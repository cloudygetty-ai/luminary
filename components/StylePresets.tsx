"use client";
import { STYLE_PRESETS } from "@/lib/presets";

interface Props { selected: string | null; onSelect: (id: string | null) => void; }

export function StylePresets({ selected, onSelect }: Props) {
  return (
    <div>
      <label style={{ display:"block", fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
        Style Preset
      </label>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {STYLE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => onSelect(selected === p.id ? null : p.id)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:"var(--radius)", border:`1px solid ${selected===p.id?"var(--accent)":"var(--border)"}`, background:selected===p.id?"var(--accent-glow)":"transparent", color:selected===p.id?"var(--accent)":"var(--text-secondary)", fontSize:12, textAlign:"left", transition:"all 0.12s ease", cursor:"pointer" }}>
            <span>{p.emoji}</span><span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
