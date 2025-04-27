import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  const { error, data } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Save user message to Supabase
    await supabase
      .from("messages")
      .insert([{ role: "user", message: message }]);

    let fullResponse = "";

    const completionStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Keep your responses concise and clear.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
    });

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    // Process the stream in the background
    (async () => {
      try {
        for await (const chunk of completionStream) {
          if (chunk.choices[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullResponse += content;
            await writer.write(encoder.encode(content));

            // Add a small delay between chunks
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        // Save the complete assistant response to Supabase
        await supabase
          .from("messages")
          .insert([{ role: "assistant", message: fullResponse }]);

        await writer.close();
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.abort(error);
      }
    })();

    // Return the stream as the response
    return new Response(transformStream.readable, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
