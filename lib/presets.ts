export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  injection: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  { id: "photo", label: "Photorealistic", emoji: "📷", injection: "photorealistic, 8K, DSLR, natural lighting, sharp focus" },
  { id: "cinema", label: "Cinematic", emoji: "🎬", injection: "cinematic, anamorphic lens, film grain, dramatic lighting, movie still" },
  { id: "anime", label: "Anime", emoji: "⛩️", injection: "anime style, studio ghibli inspired, cel shading, vibrant colors" },
  { id: "oil", label: "Oil Painting", emoji: "🎨", injection: "oil painting, impasto texture, museum quality, old masters style" },
  { id: "iso", label: "Isometric", emoji: "📐", injection: "isometric 3D, low poly, clean render, pastel colors, architectural" },
  { id: "neon", label: "Neon Noir", emoji: "🌆", injection: "neon noir, cyberpunk, rain-slicked streets, volumetric fog, blade runner aesthetic" },
  { id: "sketch", label: "Sketch", emoji: "✏️", injection: "pencil sketch, hand-drawn, crosshatching, graphite on white paper" },
  { id: "watercolor", label: "Watercolor", emoji: "🌊", injection: "watercolor painting, soft edges, translucent washes, paper texture" },
  { id: "3d", label: "3D Render", emoji: "🧊", injection: "3D render, octane, subsurface scattering, ray tracing, ultra detailed" },
  { id: "flat", label: "Flat Design", emoji: "🟦", injection: "flat design, minimal, bold shapes, limited palette, vector illustration" },
];
