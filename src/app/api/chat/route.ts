import { NextResponse } from "next/server";

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

    const response = await fetch('http://187.33.155.76:5005/webhooks/rest/webhook', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'charset': 'UTF-8',
      },
      credentials: "same-origin",
      body: JSON.stringify({ "sender": "user", "message": message }),
    });

    if (!response.ok) {
      console.error("Error response from webhook:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to get valid response from chatbot service" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("Invalid or empty response data from webhook:", data);
      return NextResponse.json(
        { error: "Invalid response from chatbot service" },
        { status: 500 }
      );
    }

    const temp = data[0];
    const recipient_id = temp["recipient_id"];
    const recipient_msg = temp["text"];

    const response_temp = {
      sender: "bot",
      recipient_id: recipient_id,
      msg: recipient_msg
    };

    return NextResponse.json(
      {
        message: response_temp.msg
      }
    );

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
