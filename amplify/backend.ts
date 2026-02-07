import { defineBackend } from "@aws-amplify/backend";
import { storage } from "./storage/resource.js";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 *
 * Note: Auth & Data are handled by Supabase, not Amplify
 * Amplify is only used for Storage (S3)
 */
defineBackend({
  storage,
});
