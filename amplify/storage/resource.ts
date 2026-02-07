import { defineStorage } from "@aws-amplify/backend";

/**
 * Storage configuration for Artfolio
 *
 * Note: Auth is handled by Supabase, not Amplify
 * All access is controlled via presigned URLs generated in API routes
 * after Supabase authentication checks
 */
export const storage = defineStorage({
  name: "artfolioMedia",
});
