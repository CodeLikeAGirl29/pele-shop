// lib/supabase/server.ts
//
// This file is for SERVER COMPONENTS and Route Handlers.
// Server components can't use browser APIs, so this version
// reads/writes cookies via Next.js's cookies() function instead.
//
// Usage: const supabase = await createClient()

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  // cookies() from next/headers lets us read and write
  // HTTP cookies from inside a server component or API route.
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase calls getAll() to read the session cookie
        getAll() {
          return cookieStore.getAll();
        },
        // Supabase calls setAll() to refresh the session token.
        // In server components this is a no-op (can't set cookies
        // from inside a render), but Route Handlers can set them.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
