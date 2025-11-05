/**
 * TypeScript types for Gemini AI subtitle optimization
 */

export interface SubtitleItem {
  index: number;
  content: string;
}

export interface GeminiOptimizeRequest {
  apiKey: string;
  subtitles: SubtitleItem[];
}

export interface GeminiOptimizeResponse {
  success: boolean;
  optimized?: SubtitleItem[];
  error?: string;
}

export interface BatchInfo {
  batchNumber: number;
  totalBatches: number;
  subtitles: SubtitleItem[];
}
