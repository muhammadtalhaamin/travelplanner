import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Get the request body
    const { message } = await req.json();

    // Create the messages array for OpenAI
    const messages = [
      {
        role: "system",
        content:
          "You are a wise and supportive assistant who combines warmth and professionalism to provide thoughtful, empathetic guidance while maintaining appropriate boundaries and encouraging positive outcomes.",
      },
      {
        role: "user",
        content: message,
      },
    ];

    // Create the stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      stream: true,
    });

    // Create a new ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Process each chunk from OpenAI
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            // Format the data as your frontend expects
            const data = JSON.stringify({ content });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // Send the [DONE] message
          controller.enqueue(
            `data: ${JSON.stringify({ content: "[DONE]" })}\n\n`
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the streaming response
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: "Error generating response" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
