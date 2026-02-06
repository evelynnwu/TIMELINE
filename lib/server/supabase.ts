import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_KEY environment variable");
}

// Server-side Supabase client with service role key
// Use this for API routes - has full access, bypasses RLS
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
