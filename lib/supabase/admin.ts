// lib/supabase/admin.ts
//
// This is the ADMIN client. It uses the service role key, which
// bypasses all RLS policies entirely.
//
// ONLY use this in:
//   - API Route Handlers (app/api/*)
//   - Server Actions
//   - NEVER in client components — it would expose the secret key
//
// We use this in the Stripe webhook to create orders, because
// the webhook runs as a server process with no user session.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // The service role key bypasses RLS — treat it like a password
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Don't try to persist auth state — this is a server-only client
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
