import { Session } from "./types";

export async function exportSessionAsZip(session: Session): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const imgFolder = zip.folder("images")!;
  const meta: Record<string, unknown>[] = [];

  for (const result of session.results) {
    const base64 = result.imageUrl.split(",")[1];
    const ext = result.imageUrl.includes("png") ? "png" : "jpg";
    const filename = `${result.id}.${ext}`;
    imgFolder.file(filename, base64, { base64: true });
    meta.push({
      id: result.id, filename,
      prompt: result.prompt, enhancedPrompt: result.enhancedPrompt,
      model: result.model, aspectRatio: result.aspectRatio,
      mode: result.mode, durationMs: result.durationMs,
      timestamp: result.timestamp, rawParams: result.rawParams,
    });
  }

  zip.file("metadata.json", JSON.stringify(meta, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `luminary-session-${session.id}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
