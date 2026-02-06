import { DetectionResult, AIDetector } from "./types";

const AI_THRESHOLD = 0.65; // Reject if completely_generated_prob > this

export class GPTZeroDetector implements AIDetector {
  private apiKey: string;

  constructor() {
    if (!process.env.GPTZERO_API_KEY) {
      throw new Error("Missing GPTZero API key");
    }
    this.apiKey = process.env.GPTZERO_API_KEY;
  }

  async checkImage(_imageBytes: Buffer, _filename: string): Promise<DetectionResult> {
    throw new Error("GPTZero does not support image detection");
  }

  async checkText(text: string): Promise<DetectionResult> {
    const response = await fetch("https://api.gptzero.me/v2/predict/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ document: text }),
    });

    const data = await response.json();
    const aiProb = data?.documents?.[0]?.completely_generated_prob ?? 0;

    return {
      passed: aiProb < AI_THRESHOLD,
      confidence: 1 - aiProb,
      rawScore: aiProb,
      provider: "gptzero",
      details: data,
    };
  }
}
