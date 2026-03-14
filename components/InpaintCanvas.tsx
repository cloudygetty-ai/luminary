"use client";
import { useEffect, useState } from "react";
import { useInpaint } from "@/hooks/useInpaint";
import { GenerationResult, ModelVariant } from "@/lib/types";

interface Props { sourceImage: GenerationResult; model: ModelVariant; onResult: (r: GenerationResult) => void; }

export function InpaintCanvas({ sourceImage, model, onResult }: Props) {
  const { canvasRef, brushSize, setBrushSize, setIsDrawing, draw, clearMask, inpaint, loading, error, result, lastPos } = useInpaint(onResult);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, alignItems:"center", padding:24, overflowY:"auto" }}>
      <div style={{ position:"relative", display:"inline-block", borderRadius:"var(--radius-lg)", overflow:"hidden", border:"1px solid var(--border)" }}>
        <img src={sourceImage.imageUrl} alt="source" style={{ display:"block", maxWidth:600, maxHeight:480, objectFit:"contain" }} />
        <canvas ref={canvasRef} width={600} height={480}
          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", opacity:0.55, cursor:"crosshair" }}
          onMouseDown={e=>{ setIsDrawing(true); lastPos.current=null; draw(e); }}
          onMouseMove={draw}
          onMouseUp={()=>setIsDrawing(false)}
          onMouseLeave={()=>setIsDrawing(false)}
        />
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", width:"100%", maxWidth:600 }}>
        <input type="text" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="What to generate in masked area..." style={{ flex:1, padding:"8px 12px", borderRadius:"var(--radius)", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", fontSize:13 }} />
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>{brushSize}px</span>
          <input type="range" min={8} max={80} value={brushSize} onChange={e=>setBrushSize(parseInt(e.target.value))} style={{ width:70, accentColor:"var(--accent)" }} />
        </div>
        <button onClick={clearMask} style={{ padding:"8px 12px", borderRadius:"var(--radius)", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:12, background:"transparent", cursor:"pointer" }}>Clear</button>
        <button onClick={()=>inpaint(sourceImage.imageUrl, prompt, model)} disabled={loading||!prompt.trim()}
          style={{ padding:"8px 16px", borderRadius:"var(--radius)", background:loading?"var(--border)":"var(--accent)", color:loading?"var(--text-muted)":"#080608", fontSize:12, fontWeight:700, fontFamily:"var(--font-mono)", cursor:loading?"not-allowed":"pointer" }}>
          {loading?"painting...":"Inpaint"}
        </button>
      </div>
      {error && <p style={{ color:"var(--error)", fontSize:12, fontFamily:"var(--font-mono)" }}>{error}</p>}
      {result && (
        <div className="animate-in" style={{ borderRadius:"var(--radius-lg)", overflow:"hidden", border:"1px solid var(--accent)" }}>
          <img src={result.imageUrl} alt="inpainted" style={{ display:"block", maxWidth:600 }} />
        </div>
      )}
    </div>
  );
}
