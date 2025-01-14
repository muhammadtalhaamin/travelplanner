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

    // Construct the full message
    let fullMessage = message;
    if (fileContents) {
      fullMessage = `User Question: ${message}\n\n${fileContents}\n\nPlease analyze the above content and respond to the user's question.`;
    }

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
