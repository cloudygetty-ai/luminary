import { NextRequest } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import type { UserContent } from "ai";
import { encodeEvent } from "@/lib/stream";
import { STYLE_PRESETS } from "@/lib/presets";

const MODEL_MAP = {
  "nano-banana": "google/gemini-2.5-flash-image",
  "nano-banana-pro": "google/gemini-3-pro-image",
};

const gateway = createOpenAICompatible({
  name: "vercel-ai-gateway",
  baseURL: process.env.VERCEL_AI_GATEWAY_URL!,
  headers: { Authorization: `Bearer ${process.env.VERCEL_AI_GATEWAY_API_KEY}` },
});

export const maxDuration = 180;

async function runSingleGeneration(
  params: {
    prompt: string; model: string; aspectRatio: string; seed?: number;
    referenceImages?: { dataUrl: string; mimeType: string }[];
    rawParams?: { temperature?: number; topP?: number; thinkingBudget?: number; systemPrompt?: string; negativePrompt?: string };
    stylePreset?: string;
    conversationHistory?: { role: "user" | "assistant"; content: string }[];
    batchIndex: number;
  },
  enqueue: (event: object) => void
) {
  const isEdit = Array.isArray(params.referenceImages) && params.referenceImages.length > 0;
  const preset = STYLE_PRESETS.find((p) => p.id === params.stylePreset);

  let finalPrompt = params.prompt;
  if (preset) finalPrompt += `, ${preset.injection}`;
  if (params.rawParams?.negativePrompt) finalPrompt += `. Avoid: ${params.rawParams.negativePrompt}`;

  const content: UserContent = [];
  if (isEdit) {
    for (const ref of params.referenceImages!) {
      content.push({ type: "image", image: ref.dataUrl.split(",")[1], mimeType: ref.mimeType });
    }
  }

  const instruction = isEdit
    ? `Edit the provided image(s): ${finalPrompt}. Aspect ratio: ${params.aspectRatio}.${params.seed ? ` Seed: ${params.seed}.` : ""}`
    : `Generate an image: ${finalPrompt}. Aspect ratio: ${params.aspectRatio}.${params.seed ? ` Seed: ${params.seed}.` : ""}`;
  content.push({ type: "text", text: instruction });

  const messages: { role: "user" | "assistant"; content: UserContent | string }[] = [];
  if (params.rawParams?.systemPrompt) {
    messages.push({ role: "user", content: `System context: ${params.rawParams.systemPrompt}` });
    messages.push({ role: "assistant", content: "Understood." });
  }
  if (params.conversationHistory?.length) {
    for (const turn of params.conversationHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }
  }
  messages.push({ role: "user", content });

  const start = Date.now();
  const result = streamText({
    model: gateway(params.model),
    messages: messages as Parameters<typeof streamText>[0]["messages"],
    temperature: params.rawParams?.temperature,
    topP: params.rawParams?.topP,
  });

  for await (const delta of result.fullStream) {
    if (delta.type === "text-delta" && delta.textDelta) {
      enqueue({ type: "text-delta", delta: delta.textDelta, batchIndex: params.batchIndex });
    }
  }

  const final = await result;
  const imageFile = final.files?.[0];
  if (!imageFile) { enqueue({ type: "error", message: "No image returned", batchIndex: params.batchIndex }); return; }

  const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
  const mimeType = imageFile.mimeType ?? "image/png";
  enqueue({ type: "image", dataUrl: `data:${mimeType};base64,${base64}`, mimeType, batchIndex: params.batchIndex });
  enqueue({ type: "done", durationMs: Date.now() - start, mode: isEdit ? "edit" : "generate", batchIndex: params.batchIndex });
}

export async function POST(req: NextRequest) {
  const { prompt, model, aspectRatio, seed, referenceImages, rawParams, batchSize = 1, stylePreset, conversationHistory } = await req.json();
  if (!prompt?.trim()) {
    return new Response(`data: ${JSON.stringify({ type: "error", message: "Prompt required" })}\n\n`, { status: 400, headers: { "Content-Type": "text/event-stream" } });
  }

  const modelId = MODEL_MAP[model as keyof typeof MODEL_MAP] ?? MODEL_MAP["nano-banana"];
  const count = Math.min(Math.max(1, batchSize), 4);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: object) => {
        controller.enqueue(encoder.encode(encodeEvent(event as Parameters<typeof encodeEvent>[0])));
      };
      try {
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            runSingleGeneration(
              { prompt, model: modelId, aspectRatio, seed: seed ? seed + i : undefined, referenceImages, rawParams, stylePreset, conversationHistory, batchIndex: i },
              enqueue
            )
          )
        );
      } catch (err) {
        enqueue({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
