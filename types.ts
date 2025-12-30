
export interface ResultItem {
  id: string;
  imageUrl: string;
  mimeType: string;
  prompt: string;
  sourceImageUrl?: string; // The URL of the image used to generate this result
}

export type ComparisonMode = 'side' | 'slider' | 'single';

export type PromptMode = 'retouch' | 'reimagine' | 'textToImage' | 'composition'; // Added composition for multi-image

export type GenerationMode = 'image-to-image' | 'text-to-image' | 'multi-image-composition';

export type AspectRatio = 'auto' | '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9';

export interface Pan {
  x: number;
  y: number;
}

export interface PresetPrompt {
  id: string;
  prompt: string;
}

export interface ImageState {
  dataUrl: string;
  mimeType: string;
}

export type CompositionImageSlotIndex = 0 | 1 | 2 | 3 | 4; // 0 for main, 1-4 for multi-image grid slots