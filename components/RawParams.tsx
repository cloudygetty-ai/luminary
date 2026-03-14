"use client";
import { RawParams } from "@/lib/types";
import { useState } from "react";

interface Props { params: Partial<RawParams>; onChange: (p: Partial<RawParams>) => void; }

function Slider({ label, value, min, max, step, onChange }: { label:string; value:number; min:number; max:number; step:number; onChange:(v:number)=>void }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"var(--font-mono)" }}>{label}</span>
        <span style={{ fontSize:11, color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(parseFloat(e.target.value))} style={{ width:"100%", accentColor:"var(--accent)" }} />
    </div>
  );
}

export function RawParamsPanel({ params, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const p = { temperature:1, topP:0.95, thinkingBudget:0, systemPrompt:"", negativePrompt:"", ...params };
  return (
    <div>
      <button onClick={() => setOpen(v=>!v)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"6px 0", fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.12em", background:"none", border:"none", cursor:"pointer" }}>
        <span>Raw Parameters</span>
        <span style={{ transition:"transform 0.15s", transform:open?"rotate(180deg)":"none" }}>▾</span>
      </button>
      {open && (
        <div style={{ marginTop:10 }}>
          <Slider label="temperature" value={p.temperature} min={0} max={2} step={0.05} onChange={(v)=>onChange({...params,temperature:v})} />
          <Slider label="top_p" value={p.topP} min={0} max={1} step={0.01} onChange={(v)=>onChange({...params,topP:v})} />
          <Slider label="thinking budget" value={p.thinkingBudget} min={0} max={8192} step={256} onChange={(v)=>onChange({...params,thinkingBudget:v})} />
          <label style={{ display:"block", fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)", marginBottom:4, marginTop:8 }}>System Prompt</label>
          <textarea value={p.systemPrompt} onChange={(e)=>onChange({...params,systemPrompt:e.target.value})} rows={2} placeholder="Style persona..." style={{ width:"100%", padding:"6px 8px", borderRadius:"var(--radius)", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", fontSize:11, resize:"vertical", fontFamily:"var(--font-mono)" }} />
          <label style={{ display:"block", fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)", marginBottom:4, marginTop:8 }}>Negative Prompt</label>
          <textarea value={p.negativePrompt} onChange={(e)=>onChange({...params,negativePrompt:e.target.value})} rows={2} placeholder="What to avoid..." style={{ width:"100%", padding:"6px 8px", borderRadius:"var(--radius)", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", fontSize:11, resize:"vertical", fontFamily:"var(--font-mono)" }} />
        </div>
      )}
    </div>
  );
}
