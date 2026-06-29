// lib/supabase/client.ts
//
// This file is for CLIENT COMPONENTS (anything with 'use client').
// It creates a Supabase client that runs in the browser and
// handles auth via cookies automatically.
//
// Usage: const supabase = createClient()

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  // These two env vars are safe to expose to the browser —
  // they're prefixed with NEXT_PUBLIC_ on purpose.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
