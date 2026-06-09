import { createClient } from "@supabase/supabase-js";

// Trim whitespace and strip accidental surrounding quotes (common copy-paste issue).
const clean = (v) => (v || "").trim().replace(/^["']|["']$/g, "");
const url = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_KEY);

// VITE_SUPABASE_URL must be a real project URL (https://xxxx.supabase.co).
// We validate it so a misconfigured .env never crashes the whole app —
// the chat just falls back to local mode instead.
const validUrl = /^https?:\/\/.+/i.test(url || "");

let client = null;
let configured = false;
if (validUrl && key) {
  try {
    client = createClient(url, key);
    configured = true;
  } catch {
    client = null;
    configured = false;
  }
}

export const isSupabaseConfigured = configured;
export const supabase = client;
