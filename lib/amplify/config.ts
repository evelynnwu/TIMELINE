"use client";

import { Amplify } from "aws-amplify";

let configured = false;

/**
 * Configure Amplify with the generated outputs
 * This should be called once at app initialization
 */
export function configureAmplify(): void {
  if (configured) {
    return;
  }

  // Dynamic import to handle cases where amplify_outputs.json doesn't exist yet
  // (e.g., before first deployment or in certain build scenarios)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require("@/amplify_outputs.json");
    Amplify.configure(outputs);
    configured = true;
  } catch {
    console.warn(
      "Amplify outputs not found. Run 'npx ampx sandbox' or deploy to generate."
    );
  }
}
