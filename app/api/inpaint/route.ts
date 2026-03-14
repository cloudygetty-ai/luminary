import { NextRequest } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import type { UserContent } from "ai";
import { encodeEvent } from "@/lib/stream";

const gateway = createOpenAICompatible({
  name: "vercel-ai-gateway",
  baseURL: process.env.VERCEL_AI_GATEWAY_URL!,
  headers: { Authorization: `Bearer ${process.env.VERCEL_AI_GATEWAY_API_KEY}` },
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { imageDataUrl, maskDataUrl, prompt, model = "nano-banana-pro" } = await req.json();
  const modelId = model === "nano-banana-pro" ? "google/gemini-3-pro-image" : "google/gemini-2.5-flash-image";
  const encoder = new TextEncoder();

  const content: UserContent = [
    { type: "image", image: imageDataUrl.split(",")[1], mimeType: "image/png" },
    { type: "image", image: maskDataUrl.split(",")[1], mimeType: "image/png" },
    { type: "text", text: `The first image is the original. The second is a mask where WHITE areas should be regenerated. Keep BLACK areas exactly as-is. For white regions, generate: ${prompt}. Return the complete composited image.` },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: object) => controller.enqueue(encoder.encode(encodeEvent(event as Parameters<typeof encodeEvent>[0])));
      try {
        const result = streamText({ model: gateway(modelId), messages: [{ role: "user", content }] });
        for await (const delta of result.fullStream) {
          if (delta.type === "text-delta" && delta.textDelta) enqueue({ type: "text-delta", delta: delta.textDelta, batchIndex: 0 });
        }
        const final = await result;
        const imageFile = final.files?.[0];
        if (!imageFile) { enqueue({ type: "error", message: "No image returned", batchIndex: 0 }); return; }
        const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
        enqueue({ type: "image", dataUrl: `data:image/png;base64,${base64}`, mimeType: "image/png", batchIndex: 0 });
        enqueue({ type: "done", durationMs: 0, mode: "edit", batchIndex: 0 });
      } catch (err) {
        enqueue({ type: "error", message: err instanceof Error ? err.message : "Inpaint failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
