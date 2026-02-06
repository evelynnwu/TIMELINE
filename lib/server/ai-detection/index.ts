import { SightengineDetector } from "./sightengine";
import { GPTZeroDetector } from "./gptzero";
import { DetectionResult } from "./types";

export type { DetectionResult } from "./types";

export type ContentType = "image" | "text";

let imageDetector: SightengineDetector | null = null;
let textDetector: GPTZeroDetector | null = null;

function getImageDetector(): SightengineDetector {
  if (!imageDetector) {
    imageDetector = new SightengineDetector();
  }
  return imageDetector;
}

function getTextDetector(): GPTZeroDetector {
  if (!textDetector) {
    textDetector = new GPTZeroDetector();
  }
  return textDetector;
}

export async function detectAIContent(
  contentType: ContentType,
  content: Buffer | string,
  filename?: string
): Promise<DetectionResult> {
  if (contentType === "image") {
    if (!(content instanceof Buffer)) {
      throw new Error("Image content must be a Buffer");
    }
    return getImageDetector().checkImage(content, filename ?? "image");
  } else {
    if (typeof content !== "string") {
      throw new Error("Text content must be a string");
    }
    return getTextDetector().checkText(content);
  }
}
