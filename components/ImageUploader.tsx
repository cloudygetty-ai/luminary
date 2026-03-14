"use client";
import { useRef, useCallback } from "react";
import { ReferenceImage } from "@/lib/types";

interface Props { images: ReferenceImage[]; onChange: (images: ReferenceImage[]) => void; max?: number; }

function fileToRef(file: File): Promise<ReferenceImage> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ id: crypto.randomUUID(), dataUrl: r.result as string, mimeType: file.type || "image/png" });
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function ImageUploader({ images, onChange, max = 2 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = useCallback(async (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith("image/")).slice(0, max - images.length);
    const converted = await Promise.all(imgs.map(fileToRef));
    onChange([...images, ...converted]);
  }, [images, onChange, max]);

  return (
    <div onPaste={(e) => { const files = Array.from(e.clipboardData.items).filter(i=>i.kind==="file").map(i=>i.getAsFile()).filter(Boolean) as File[]; addFiles(files); }}>
      <label style={{ display:"block", fontSize:10, fontFamily:"var(--font-mono)", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
        Reference Images <span style={{ fontWeight:400 }}>({images.length}/{max})</span>
      </label>
      {images.length > 0 && (
        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
          {images.map(img => (
            <div key={img.id} style={{ position:"relative", width:64, height:64 }}>
              <img src={img.dataUrl} alt="ref" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"var(--radius)", border:"1px solid var(--border)", display:"block" }} />
              <button onClick={()=>onChange(images.filter(i=>i.id!==img.id))} style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:"var(--bg)", border:"1px solid var(--border-hover)", color:"var(--text-secondary)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
      {images.length < max && (
        <div onDrop={(e)=>{e.preventDefault();addFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()} onClick={()=>inputRef.current?.click()}
          style={{ border:"1px dashed var(--border-hover)", borderRadius:"var(--radius)", padding:"12px 8px", textAlign:"center", cursor:"pointer" }}>
          <p style={{ fontSize:11, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>drop / click / paste</p>
          <p style={{ fontSize:10, color:"var(--text-muted)", opacity:0.6 }}>PNG, JPG, WEBP</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>addFiles(Array.from(e.target.files??[]))} />
    </div>
  );
}
