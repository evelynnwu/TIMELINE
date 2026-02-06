export interface DetectionResult {
  passed: boolean;
  confidence: number; // 0-1, how confident we are it's human-made
  rawScore: number; // Provider-specific score
  provider: string;
  details: Record<string, unknown>;
}

export interface AIDetector {
  checkImage(imageBytes: Buffer, filename: string): Promise<DetectionResult>;
  checkText(text: string): Promise<DetectionResult>;
}
