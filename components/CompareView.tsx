"use client";
import { GenerationResult } from "@/lib/types";
import { useState } from "react";

interface Props { a: GenerationResult; b: GenerationResult; }

export function CompareView({ a, b }: Props) {
  const [sliderX, setSliderX] = useState(50);
  const [mode, setMode] = useState<"slider"|"side">("side");

  if (mode === "side") {
    return (
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>
        {[a,b].map((r,i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", borderRight:i===0?"1px solid var(--border)":"none" }}>
            <div style={{ padding:"8px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>{i===0?"A":"B"} · {r.model}</span>
              <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>{r.durationMs}ms</span>
            </div>
            <img src={r.imageUrl} alt={r.prompt} style={{ flex:1, objectFit:"contain", display:"block" }} />
          </div>
        ))}
        <button onClick={()=>setMode("slider")} style={{ position:"absolute", bottom:20, right:20, padding:"6px 12px", borderRadius:"var(--radius)", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-secondary)", fontSize:11, fontFamily:"var(--font-mono)", cursor:"pointer" }}>Slider mode</button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, position:"relative", overflow:"hidden", cursor:"col-resize" }}
      onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); setSliderX(((e.clientX-r.left)/r.width)*100); }}>
      <img src={a.imageUrl} alt="A" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain" }} />
      <div style={{ position:"absolute", inset:0, overflow:"hidden", width:`${sliderX}%` }}>
        <img src={b.imageUrl} alt="B" style={{ position:"absolute", inset:0, width:`${100/(sliderX/100)}%`, maxWidth:"none", height:"100%", objectFit:"contain" }} />
      </div>
      <div style={{ position:"absolute", top:0, bottom:0, left:`${sliderX}%`, width:2, background:"var(--accent)", transform:"translateX(-50%)" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:24, height:24, borderRadius:"50%", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#080608" }}>⇔</div>
      </div>
      <div style={{ position:"absolute", top:12, left:12, padding:"4px 8px", borderRadius:3, background:"rgba(0,0,0,0.7)", color:"var(--accent)", fontSize:10, fontFamily:"var(--font-mono)" }}>B</div>
      <div style={{ position:"absolute", top:12, right:12, padding:"4px 8px", borderRadius:3, background:"rgba(0,0,0,0.7)", color:"var(--text-secondary)", fontSize:10, fontFamily:"var(--font-mono)" }}>A</div>
      <button onClick={()=>setMode("side")} style={{ position:"absolute", bottom:20, right:20, padding:"6px 12px", borderRadius:"var(--radius)", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-secondary)", fontSize:11, fontFamily:"var(--font-mono)", cursor:"pointer" }}>Side by side</button>
    </div>
  );
}
