export type StreamEvent =
  | { type: "text-delta"; delta: string; batchIndex: number }
  | { type: "image"; dataUrl: string; mimeType: string; batchIndex: number }
  | { type: "done"; durationMs: number; mode: string; batchIndex: number }
  | { type: "error"; message: string; batchIndex?: number };

export function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
