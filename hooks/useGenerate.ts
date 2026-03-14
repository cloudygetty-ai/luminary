import { useState, useCallback, useRef } from "react";
import { GenerationResult, GenerationParams, Mode } from "@/lib/types";

export interface BatchSlot {
  index: number;
  commentary: string;
  result: GenerationResult | null;
  loading: boolean;
  error: string | null;
}

interface UseGenerateReturn {
  slots: BatchSlot[];
  loading: boolean;
  error: string | null;
  generate: (params: GenerationParams, conversationHistory?: { role: "user" | "assistant"; content: string }[]) => Promise<void>;
  enhance: (prompt: string) => Promise<string>;
  abort: () => void;
}

export function useGenerate(onResult?: (r: GenerationResult) => void): UseGenerateReturn {
  const [slots, setSlots] = useState<BatchSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setSlots((prev) => prev.map((s) => ({ ...s, loading: false })));
  }, []);

  const enhance = useCallback(async (prompt: string): Promise<string> => {
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Enhance failed");
    return data.enhanced as string;
  }, []);

  const generate = useCallback(async (
    params: GenerationParams,
    conversationHistory?: { role: "user" | "assistant"; content: string }[]
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const count = Math.min(Math.max(1, params.batchSize ?? 1), 4);
    setSlots(Array.from({ length: count }, (_, i) => ({ index: i, commentary: "", result: null, loading: true, error: null })));
    setLoading(true);
    setError(null);

    const pendingImages: Record<number, string> = {};

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, conversationHistory }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let allDone = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(part.slice(6));
            const idx = event.batchIndex ?? 0;

            if (event.type === "text-delta") {
              setSlots((prev) => prev.map((s) => s.index === idx ? { ...s, commentary: s.commentary + event.delta } : s));
            } else if (event.type === "image") {
              pendingImages[idx] = event.dataUrl;
              setSlots((prev) => prev.map((s) => s.index === idx ? { ...s, commentary: "" } : s));
            } else if (event.type === "done") {
              const imageUrl = pendingImages[idx];
              if (imageUrl) {
                const result: GenerationResult = {
                  id: crypto.randomUUID(),
                  prompt: params.prompt,
                  model: params.model,
                  aspectRatio: params.aspectRatio,
                  imageUrl,
                  timestamp: Date.now(),
                  durationMs: event.durationMs,
                  mode: event.mode as Mode,
                  batchIndex: idx,
                  referenceImages: params.referenceImages,
                  rawParams: params.rawParams,
                };
                setSlots((prev) => prev.map((s) => s.index === idx ? { ...s, result, loading: false } : s));
                onResult?.(result);
              }
              allDone++;
              if (allDone >= count) setLoading(false);
            } else if (event.type === "error") {
              setSlots((prev) => prev.map((s) => s.index === idx ? { ...s, error: event.message, loading: false } : s));
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setLoading(false);
    }
  }, [onResult]);

  return { slots, loading, error, generate, enhance, abort };
}
