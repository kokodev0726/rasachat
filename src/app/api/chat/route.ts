import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  // const { error, data } = await supabase
  //   .from("messages")
  //   .select("*")
  //   .order("created_at", { ascending: true });

  // if (error) {
  //   return NextResponse.json({ error: error.message }, { status: 500 });
  // }
  // return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let response_temp;
  
    await fetch('http://187.33.155.76:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'charset':'UTF-8',
        },
        credentials: "same-origin",
        body: JSON.stringify({ "sender": "user", "message": message }),
    })
    .then(response => response.json())
    .then((response) => {
        if(response){
            const temp = response[0];
            const recipient_id = temp["recipient_id"];
            const recipient_msg = temp["text"];
            response_temp = {
              sender: "bot",
              recipient_id : recipient_id,
              msg: recipient_msg
            };
            return NextResponse.json(
              { 
                message: response_temp?.msg
              }
            );
        }
    }) 

  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat message" 
      },
      { status: 500 }
    );
  }
}
