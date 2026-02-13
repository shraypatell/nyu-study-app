import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await tokenClient.auth.getUser(token);
      if (user) {
        return user;
      }
    }
  }

  const cookieClient = await createServerClient();
  const { data: { user } } = await cookieClient.auth.getUser();
  return user;
}
