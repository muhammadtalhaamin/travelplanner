import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";

const chatSessions = new Map<string, ChatMessageHistory>();

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

Remember:
- Use proper Markdown formatting
- Include specific costs and times
- Maintain consistent indentation
- Use bullet points for lists
- Include code blocks for structured information
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
    const sessionId = formData.get("sessionId") as string;
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

    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, new ChatMessageHistory());
    }
    const chatHistory = chatSessions.get(sessionId)!;

    const memory = new BufferMemory({
      chatHistory: chatHistory,
      returnMessages: true,
      memoryKey: "history",
    });

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

    const fullMessage = `${TripPlanner_PROMPT}\n\nUser Question: ${message}\n\n${fileContents}`;

    const model = new ChatOpenAI({
      modelName: "gpt-4",
      streaming: true,
      temperature: 0.7,
    });

    const chain = new ConversationChain({
      llm: model,
      memory: memory,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const response = await chain.call(
            { input: fullMessage },
            {
              callbacks: [
                {
                  handleLLMNewToken(token: string) {
                    const data = JSON.stringify({ content: token });
                    controller.enqueue(`data: ${data}\n\n`);
                  },
                },
              ],
            }
          );

          await chatHistory.addMessage(new HumanMessage(fullMessage));
          await chatHistory.addMessage(new AIMessage(response.response));

          controller.enqueue(
            `data: ${JSON.stringify({ content: "[DONE]" })}\n\n`
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
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