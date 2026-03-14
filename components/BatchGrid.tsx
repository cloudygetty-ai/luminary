"use client";
import { GenerationResult } from "@/lib/types";

interface Slot { index:number; commentary:string; result:GenerationResult|null; loading:boolean; error:string|null; }
interface Props { slots:Slot[]; onSelect:(r:GenerationResult)=>void; onInpaint:(r:GenerationResult)=>void; }

export function BatchGrid({ slots, onSelect, onInpaint }: Props) {
  const cols = slots.length <= 1 ? 1 : 2;
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:12, padding:24, flex:1, overflow:"auto" }}>
      {slots.map(slot => (
        <div key={slot.index} style={{ borderRadius:"var(--radius-lg)", border:"1px solid var(--border)", background:"var(--surface)", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:240, position:"relative" }}>
          {slot.loading && !slot.result && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", border:"2px solid var(--border)", borderTopColor:"var(--accent)", animation:"spin 0.8s linear infinite" }} />
              {slot.commentary && <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)", textAlign:"center", lineHeight:1.6, maxWidth:200 }}>{slot.commentary.slice(-120)}<span style={{ display:"inline-block", width:6, height:12, background:"var(--accent)", marginLeft:2, animation:"pulse-glow 0.8s infinite" }} /></p>}
            </div>
          )}
          {slot.error && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}><p style={{ color:"var(--error)", fontSize:11, fontFamily:"var(--font-mono)", textAlign:"center" }}>{slot.error}</p></div>}
          {slot.result && (
            <>
              <img src={slot.result.imageUrl} alt={slot.result.prompt} style={{ display:"block", width:"100%", aspectRatio:"1", objectFit:"cover", cursor:"pointer" }} onClick={()=>onSelect(slot.result!)} />
              <div style={{ padding:"8px 10px", display:"flex", gap:6, borderTop:"1px solid var(--border)" }}>
                <span style={{ flex:1, fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>v{slot.index+1} · {slot.result.durationMs}ms</span>
                <button onClick={()=>onSelect(slot.result!)} style={{ fontSize:10, color:"var(--accent)", fontFamily:"var(--font-mono)", background:"none", border:"none", cursor:"pointer" }}>Select</button>
                <button onClick={()=>onInpaint(slot.result!)} style={{ fontSize:10, color:"var(--text-secondary)", fontFamily:"var(--font-mono)", background:"none", border:"none", cursor:"pointer" }}>Inpaint</button>
              </div>
            </>
          )}
          <div style={{ position:"absolute", top:6, left:6, fontSize:9, fontFamily:"var(--font-mono)", padding:"2px 6px", borderRadius:3, background:"rgba(0,0,0,0.6)", color:"var(--text-muted)" }}>v{slot.index+1}</div>
        </div>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
