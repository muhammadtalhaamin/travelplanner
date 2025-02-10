import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Travel-related keywords to validate queries
const TRAVEL_KEYWORDS = [
  "travel", "trip", "vacation", "holiday", "destination",
  "itinerary", "flight", "hotel", "booking", "tour",
  "visit", "explore", "adventure", "guide", "plan",
  "accommodation", "sightseeing", "attractions", "places",
];

const TripPlanner_PROMPT = `
You are Travel Planner, an AI specialized in creating detailed travel itineraries. You must ONLY respond to travel-related queries. If a query is not about travel planning, respond with: "I can only assist with travel planning. Please ask me about planning your next trip!"

When responding to travel queries, follow these strict formatting rules:

1. Start with a greeting and context summary:
   # Travel Plan for [Destination]
   *Planning a [duration] trip for [number of travelers]*

2. Structure the itinerary:
   ## Day [X] - [Theme/Area]
   - **Morning**: [Activities]
   - **Afternoon**: [Activities]
   - **Evening**: [Activities]
   
   *Estimated daily budget: $XXX*

3. Include these sections:
   ## Accommodation Options
   - **Budget**: [Options]
   - **Mid-range**: [Options]
   - **Luxury**: [Options]

   ## Essential Tips
   - [List of relevant tips]

   ## Packing List
   \`\`\`
   [ ] Essential 1
   [ ] Essential 2
   \`\`\`

   ## Budget Breakdown
   \`\`\`
   Accommodation: $XXX
   Activities: $XXX
   Food & Dining: $XXX
   Transportation: $XXX
   ---------------
   Total: $XXX
   \`\`\`

4. End with:
   ## Next Steps
   *Would you like me to adjust any part of this itinerary?*
`;

// Function to validate if the query is travel-related
function isTravelQuery(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  return TRAVEL_KEYWORDS.some(keyword => lowercaseMessage.includes(keyword));
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const files = formData.getAll("files") as File[];

    // Validate if the query is travel-related
    if (!isTravelQuery(message)) {
      return new Response(
        `data: ${JSON.stringify({
          content: "I can only assist with travel planning. Please ask me about planning your next trip!"
        })}\n\ndata: ${JSON.stringify({ content: "[DONE]" })}\n\n`,
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    // Process files and extract content
    let fileContents = "";
    if (files && files.length > 0) {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const fileName = file.name.toLowerCase();

        try {
          let content = "";
          if (fileName.endsWith(".txt")) {
            const text = new TextDecoder().decode(buffer);
            content = `Travel Information from ${fileName}:\n${text}\n\n`;
          } else if (fileName.endsWith(".pdf")) {
            const loader = new PDFLoader(
              new Blob([buffer], { type: "application/pdf" }),
              { splitPages: false }
            );
            const docs = await loader.load();
            content = `Travel Information from ${fileName}:\n${docs
              .map((doc) => doc.pageContent)
              .join("\n")}\n\n`;
          } else if (fileName.endsWith(".csv")) {
            const text = new TextDecoder().decode(buffer);
            const loader = new CSVLoader(
              new Blob([text], { type: "text/csv" })
            );
            const docs = await loader.load();
            content = `Travel Information from ${fileName}:\n${docs
              .map((doc) => doc.pageContent)
              .join("\n")}\n\n`;
          }
          fileContents += content;
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
          throw new Error(`Failed to process file ${fileName}`);
        }
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
      system: TripPlanner_PROMPT,
      messages: [
        {
          role: "user",
          content: `${message}\n\n${fileContents}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
              const data = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}