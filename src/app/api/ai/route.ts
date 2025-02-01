import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch("http://127.0.0.1:8000/query-knowledge-base", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: body.query,
        knowledge_base_id: process.env.KNOWLEDGE_BASE_ID,
      }),
    });
    const analysis = await response.json();

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}
