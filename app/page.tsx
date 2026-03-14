"use client";

import { useState, useCallback } from "react";
import { useGenerate } from "@/hooks/useGenerate";
import { useHistory } from "@/hooks/useHistory";
import { exportSessionAsZip } from "@/lib/export";
import { AspectRatio, ModelVariant, ReferenceImage, GenerationResult, ViewMode, ConversationTurn } from "@/lib/types";
import type { RawParams } from "@/lib/types";
import { BatchGrid } from "@/components/BatchGrid";
import { CompareView } from "@/components/CompareView";
import { InpaintCanvas } from "@/components/InpaintCanvas";
import { StylePresets } from "@/components/StylePresets";
import { RawParamsPanel } from "@/components/RawParams";
import { ImageUploader } from "@/components/ImageUploader";

const MODELS: { value: ModelVariant; label: string; badge: string }[] = [
  { value: "nano-banana", label: "Nano Banana", badge: "2.5 Flash" },
  { value: "nano-banana-pro", label: "NB Pro", badge: "3 Pro" },
];
const RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [model, setModel] = useState<ModelVariant>("nano-banana");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [batchSize, setBatchSize] = useState(1);
  const [seed, setSeed] = useState("");
  const [stylePreset, setStylePreset] = useState<string | null>(null);
  const [rawParams, setRawParams] = useState<Partial<RawParams>>({});
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selected, setSelected] = useState<GenerationResult | null>(null);
  const [compareA, setCompareA] = useState<GenerationResult | null>(null);
  const [compareB, setCompareB] = useState<GenerationResult | null>(null);
  const [inpaintTarget, setInpaintTarget] = useState<GenerationResult | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);

  const { session, addResult, clearSession } = useHistory();
  const { slots, loading, error, generate, enhance, abort } = useGenerate(addResult);

  const handleGenerate = useCallback(async () => {
    const history = viewMode === "conversation"
      ? conversation.flatMap(t => [
          { role: "user" as const, content: t.prompt },
          { role: "assistant" as const, content: `[Generated image for: ${t.prompt}]` },
        ])
      : undefined;

    await generate({
      prompt, model, aspectRatio, batchSize,
      seed: seed ? parseInt(seed) : undefined,
      stylePreset: stylePreset ?? undefined,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      rawParams: Object.keys(rawParams).length > 0 ? rawParams : undefined,
    }, history);
  }, [prompt, model, aspectRatio, batchSize, seed, stylePreset, referenceImages, rawParams, generate, viewMode, conversation]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try { setPrompt(await enhance(prompt)); } catch {} finally { setEnhancing(false); }
  };

  const handleSelect = (r: GenerationResult) => {
    setSelected(r);
    if (!compareA) { setCompareA(r); }
    else if (!compareB) { setCompareB(r); }
    if (viewMode === "conversation") {
      setConversation(prev => [...prev, { id: crypto.randomUUID(), prompt, result: r, timestamp: Date.now() }]);
    }
  };

  const handleInpaint = (r: GenerationResult) => {
    setInpaintTarget(r);
    setViewMode("inpaint");
  };

  const sidebarSection = (label: string, children: React.ReactNode) => (
    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{label}</label>
      {children}
    </div>
  );

  const primaryResult = slots.find(s => s.result)?.result ?? selected;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, letterSpacing: "0.08em", color: "var(--accent)" }}>Luminary</span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: 3, background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(200,168,255,0.2)" }}>nano banana</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(["single","batch","compare","inpaint","conversation"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{ padding: "4px 10px", borderRadius: "var(--radius)", fontSize: 11, fontFamily: "var(--font-mono)", border: `1px solid ${viewMode===v?"var(--accent)":"var(--border)"}`, background: viewMode===v?"var(--accent-glow)":"transparent", color: viewMode===v?"var(--accent)":"var(--text-muted)", cursor: "pointer", transition: "all 0.12s" }}>{v}</button>
          ))}
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
          {loading && <button onClick={abort} style={{ padding: "4px 10px", borderRadius: "var(--radius)", fontSize: 11, fontFamily: "var(--font-mono)", border: "1px solid var(--error)", color: "var(--error)", background: "transparent", cursor: "pointer" }}>✕ cancel</button>}
          <button onClick={() => exportSessionAsZip(session)} style={{ padding: "4px 10px", borderRadius: "var(--radius)", fontSize: 11, fontFamily: "var(--font-mono)", border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}>↓ export</button>
          <button onClick={clearSession} style={{ padding: "4px 10px", borderRadius: "var(--radius)", fontSize: 11, fontFamily: "var(--font-mono)", border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }}>clear</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{ width: 248, borderRight: "1px solid var(--border)", overflowY: "auto", padding: "20px 16px", flexShrink: 0, background: "var(--surface)" }}>
          {sidebarSection("Model", (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MODELS.map(m => (
                <button key={m.value} onClick={() => setModel(m.value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: "var(--radius)", border: `1px solid ${model===m.value?"var(--accent)":"var(--border)"}`, background: model===m.value?"var(--accent-glow)":"transparent", color: model===m.value?"var(--accent)":"var(--text-secondary)", fontSize: 12, cursor: "pointer", transition: "all 0.12s" }}>
                  <span>{m.label}</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", padding: "2px 5px", borderRadius: 2, background: model===m.value?"rgba(200,168,255,0.2)":"var(--border)", color: model===m.value?"var(--accent)":"var(--text-muted)" }}>{m.badge}</span>
                </button>
              ))}
            </div>
          ))}

          {sidebarSection("Aspect Ratio", (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
              {RATIOS.map(r => (
                <button key={r} onClick={() => setAspectRatio(r)} style={{ padding: "5px 2px", borderRadius: "var(--radius)", border: `1px solid ${aspectRatio===r?"var(--accent)":"var(--border)"}`, background: aspectRatio===r?"var(--accent-glow)":"transparent", color: aspectRatio===r?"var(--accent)":"var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)", cursor: "pointer", transition: "all 0.12s" }}>{r}</button>
              ))}
            </div>
          ))}

          {sidebarSection("Variations", (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>batch size</span>
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{batchSize}</span>
              </div>
              <input type="range" min={1} max={4} value={batchSize} onChange={e => setBatchSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>seed</span>
                <input type="number" value={seed} onChange={e => setSeed(e.target.value)} placeholder="random" style={{ width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
          ))}

          {sidebarSection("Style", <StylePresets selected={stylePreset} onSelect={setStylePreset} />)}

          {sidebarSection("Reference Images", <ImageUploader images={referenceImages} onChange={setReferenceImages} max={2} />)}

          <RawParamsPanel params={rawParams} onChange={setRawParams} />

          {/* History strip */}
          {session.results.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>History ({session.results.length})</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...session.results].reverse().slice(0, 12).map(r => (
                  <button key={r.id} onClick={() => setSelected(r)} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 6px", borderRadius: "var(--radius)", border: `1px solid ${selected?.id===r.id?"var(--accent)":"var(--border)"}`, background: "transparent", cursor: "pointer", textAlign: "left" }}>
                    <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.prompt.slice(0, 28)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main canvas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {viewMode === "inpaint" && inpaintTarget ? (
              <InpaintCanvas sourceImage={inpaintTarget} model={model} onResult={r => { addResult(r); setSelected(r); }} />
            ) : viewMode === "compare" && compareA && compareB ? (
              <CompareView a={compareA} b={compareB} />
            ) : (slots.length > 0 || viewMode === "batch") ? (
              <BatchGrid slots={slots.length > 0 ? slots : []} onSelect={handleSelect} onInpaint={handleInpaint} />
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
                {selected ? (
                  <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxHeight: "100%", maxWidth: "100%" }}>
                    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 0 80px rgba(200,168,255,0.06)" }}>
                      <img src={selected.imageUrl} alt={selected.prompt} style={{ display: "block", maxWidth: "100%", maxHeight: "calc(100vh - 280px)", objectFit: "contain" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => { const a = document.createElement("a"); a.href = selected.imageUrl; a.download = `luminary-${selected.id}.png`; a.click(); }} style={{ padding: "6px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)", background: "transparent", cursor: "pointer" }}>↓ save</button>
                      <button onClick={() => { setCompareA(compareA ? compareA : selected); setCompareB(selected); setViewMode("compare"); }} style={{ padding: "6px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)", background: "transparent", cursor: "pointer" }}>⇔ compare</button>
                      <button onClick={() => handleInpaint(selected)} style={{ padding: "6px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)", background: "transparent", cursor: "pointer" }}>✎ inpaint</button>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{selected.durationMs}ms</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 300, color: "var(--text-muted)", opacity: 0.3, letterSpacing: "0.1em" }}>luminary</p>
                    <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 8 }}>enter a prompt to begin</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt bar */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-hover)", background: "var(--bg)" }}>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) handleGenerate(); }}
                placeholder={viewMode==="conversation" ? "Continue the conversation..." : "Describe your image..."}
                rows={1} style={{ flex: 1, resize: "none", fontSize: 14, lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: "none", border: "none", outline: "none", color: "var(--text-primary)" }}
                onInput={e => { const el=e.currentTarget; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,100)+"px"; }}
              />
              <button onClick={handleEnhance} disabled={enhancing||!prompt.trim()} title="Enhance prompt with AI"
                style={{ fontSize: 14, color: enhancing?"var(--text-muted)":"var(--accent-dim)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s", padding: "2px 4px" }}>
                {enhancing ? "…" : "✦"}
              </button>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>⌘↵</span>
            </div>
            <button onClick={handleGenerate} disabled={loading||!prompt.trim()}
              style={{ padding: "0 24px", borderRadius: "var(--radius-lg)", background: loading?"var(--border)":"var(--accent)", color: loading?"var(--text-muted)":"#080608", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", transition: "all 0.2s", minWidth: 110, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: loading?"not-allowed":"pointer" }}>
              {loading ? <span style={{ animation: "pulse-glow 1.2s ease-in-out infinite" }}>generating</span> : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
