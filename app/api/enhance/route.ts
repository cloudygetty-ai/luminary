import { NextRequest, NextResponse } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const gateway = createOpenAICompatible({
  name: "vercel-ai-gateway",
  baseURL: process.env.VERCEL_AI_GATEWAY_URL!,
  headers: { Authorization: `Bearer ${process.env.VERCEL_AI_GATEWAY_API_KEY}` },
});

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const { text } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    messages: [{
      role: "user",
      content: `You are an expert image generation prompt engineer. Enhance this prompt to be more vivid, specific, and effective for AI image generation. Return ONLY the enhanced prompt — no explanation, no quotes, no preamble.\n\nOriginal: ${prompt}`,
    }],
    maxTokens: 300,
  });

  return NextResponse.json({ enhanced: text.trim() });
}
