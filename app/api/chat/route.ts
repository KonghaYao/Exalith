import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      messages,
      model = process.env.OPENAI_MODEL || "",
      temperature,
    } = body;

    const response = openai.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature,
    });

    const stream = (await response.asResponse()).body;
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during your request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
