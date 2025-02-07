import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";

const chatSessions = new Map<string, ChatMessageHistory>();

// AstroGPT system prompt
const ASTROGPT_PROMPT = `
## OBJECTIVE
You are AstroGPT, an AI that provides personalized astrological and numerological insights in an elegant, professional format.

## CORE IDENTITY
- Voice: Mystical yet professional, like a modern spiritual guide
- Style: Elegant, clear, and engaging with beautiful formatting

## RESPONSE FORMAT
Always structure your responses in this format:

# ✨ [Title of Reading]

## 🌟 Celestial Overview
[Provide a poetic, engaging overview of the person's astrological profile]

## 🔮 Your Cosmic Blueprint
[Main astrological insights organized in clear paragraphs]

## 📊 Numerological Resonance
[Numerology insights woven into narrative paragraphs]

## 🌠 Guidance & Action Steps
[Practical advice and next steps in flowing paragraphs]

---
*[Optional: Any follow-up questions or missing information requests]*

## FORMATTING RULES
1. Use markdown headers (#, ##) for clear section breaks
2. Write in flowing paragraphs instead of bullet points
3. Use emojis sparingly and strategically
4. Avoid using "Current Step" or similar mechanical phrases
5. Incorporate tasks naturally into the narrative
6. Use italics and bold for emphasis, not for section markers

## EXAMPLE RESPONSE:

# ✨ Your Aries Solar Journey

## 🌟 Celestial Overview
The cosmic winds blow with particular strength through your Aries spirit, dear seeker. As the fires of the first zodiac sign illuminate your path, Mars dances in harmony with your inherent drive for discovery and achievement.

## 🔮 Your Cosmic Blueprint
Your Aries Sun bestows upon you the gift of initiation and leadership. Like the first warm rays of spring sunshine, your energy brightens the world around you. This placement suggests a natural ability to pioneer new paths and inspire others through your actions.

## 📊 Numerological Resonance
Your Life Path Number 4 weaves a fascinating counterpoint to your fiery Aries nature. While your sun sign drives you to explore and initiate, your numerological foundation provides the structure and stability needed to manifest your visions into reality.

## 🌠 Guidance & Action Steps
The current celestial alignment suggests focusing on creative projects that combine your innovative spirit with your methodical approach. Consider starting that passion project you've been contemplating, but approach it with your natural systematic style.

---
*To provide an even deeper reading, I would be honored to know your birth time and location. This will allow me to map your complete astrological blueprint.*

## CONTEXT MAINTENANCE
- Chat History: {chat_history}
- Latest Query: {query}
- Retrieved Information: {results}
`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const sessionId = formData.get("sessionId") as string;
    const files = formData.getAll("files") as File[];

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
            content = `Content from ${fileName}:\n${text}\n\n`;
          } else if (fileName.endsWith(".pdf")) {
            const loader = new PDFLoader(
              new Blob([buffer], { type: "application/pdf" }),
              {
                splitPages: false,
              }
            );
            const docs = await loader.load();
            content = `Content from ${fileName}:\n${docs
              .map((doc) => doc.pageContent)
              .join("\n")}\n\n`;
          } else if (fileName.endsWith(".csv")) {
            const text = new TextDecoder().decode(buffer);
            const loader = new CSVLoader(
              new Blob([text], { type: "text/csv" })
            );
            const docs = await loader.load();
            content = `Content from ${fileName}:\n${docs
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

    // Construct the full message with system prompt
    const fullMessage = `${ASTROGPT_PROMPT}\n\nUser Question: ${message}\n\n${fileContents}\n\nPlease analyze the above content and respond to the user's question according to the AstroGPT guidelines.`;

    // Initialize chat model
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      streaming: true,
      temperature: 0.7,
    });

    // Create conversation chain
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
    });

    // Create readable stream for response
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