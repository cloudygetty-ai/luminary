export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9";
export type ModelVariant = "nano-banana" | "nano-banana-pro";
export type Mode = "generate" | "edit";
export type ViewMode = "single" | "batch" | "compare" | "inpaint" | "conversation";

export interface ReferenceImage {
  id: string;
  dataUrl: string;
  mimeType: string;
}

export interface RawParams {
  temperature: number;
  topP: number;
  thinkingBudget: number;
  systemPrompt: string;
  negativePrompt: string;
}

export interface GenerationParams {
  prompt: string;
  model: ModelVariant;
  aspectRatio: AspectRatio;
  seed?: number;
  referenceImages?: ReferenceImage[];
  rawParams?: Partial<RawParams>;
  batchSize?: number;
  stylePreset?: string;
}

export interface GenerationResult {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  model: ModelVariant;
  aspectRatio: AspectRatio;
  imageUrl: string;
  timestamp: number;
  durationMs: number;
  mode: Mode;
  batchIndex?: number;
  referenceImages?: ReferenceImage[];
  rawParams?: Partial<RawParams>;
  commentary?: string;
}

export interface ConversationTurn {
  id: string;
  prompt: string;
  result: GenerationResult;
  timestamp: number;
}

export interface Session {
  id: string;
  createdAt: number;
  results: GenerationResult[];
  conversation: ConversationTurn[];
}
