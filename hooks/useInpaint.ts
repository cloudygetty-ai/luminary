import { useState, useRef, useCallback } from "react";
import { GenerationResult, ModelVariant } from "@/lib/types";

export function useInpaint(onResult?: (r: GenerationResult) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e, canvasRef.current);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "white";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (lastPos.current) ctx.moveTo(lastPos.current.x, lastPos.current.y);
    else ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, brushSize]);

  const clearMask = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const inpaint = useCallback(async (imageDataUrl: string, prompt: string, model: ModelVariant) => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    const maskDataUrl = canvasRef.current.toDataURL("image/png");

    try {
      const res = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, maskDataUrl, prompt, model }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let capturedUrl = "";

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
            if (event.type === "image") capturedUrl = event.dataUrl;
            if (event.type === "done" && capturedUrl) {
              const r: GenerationResult = {
                id: crypto.randomUUID(), prompt, model,
                aspectRatio: "1:1", imageUrl: capturedUrl,
                timestamp: Date.now(), durationMs: event.durationMs, mode: "edit",
              };
              setResult(r);
              onResult?.(r);
            }
            if (event.type === "error") setError(event.message);
          } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inpaint failed");
    } finally {
      setLoading(false);
    }
  }, [onResult]);

  return { canvasRef, brushSize, setBrushSize, isDrawing, setIsDrawing, draw, clearMask, inpaint, loading, error, result, lastPos };
}
