import {
  UIMessage,
  streamText,
  convertToModelMessages,
  createDataStreamResponse,
} from "ai";
import { NextResponse } from "next/server";
import { ollama } from "ollama-ai-provider-v2";
import { retrieveContext } from "@/lib/rag";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    
    // Retrieve context from the RAG database based on the last user message
    const context = await retrieveContext(lastMessage.content, 4);

    const systemPrompt = context.length > 0 
      ? `You are a helpful and knowledgeable RAG Chatbot. Answer the user's question strictly based on the context provided below.
If you cannot answer the question using the context, say that you don't have enough information in your knowledge base.
Provide citations by mentioning the source document names when explaining facts.

Context:
${context.map((c) => `--- Document: ${c.source} ---\n${c.content}`).join("\n\n")}`
      : `You are a helpful assistant. Currently, there are no documents in your knowledge base. Explain that the user can upload documents in the left sidebar to start asking questions about their data.`;

    return createDataStreamResponse({
      execute: (dataStream) => {
        // Send the retrieved sources to the client as a message annotation
        if (context.length > 0) {
          dataStream.writeMessageAnnotation({
            type: "sources",
            sources: context.map((c) => ({
              title: c.source,
              content: c.content,
              similarity: c.similarity,
            })),
          });
        }

        // Stream the text response
        const result = streamText({
          model: ollama("qwen3:8b"),
          system: systemPrompt,
          messages: convertToModelMessages(messages),
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during chat processing." },
      { status: 500 }
    );
  }
}