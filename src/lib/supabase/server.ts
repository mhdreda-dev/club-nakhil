import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseServiceClient: SupabaseClient | null = null;

const requiredSupabaseEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function getMissingSupabaseEnvVars() {
  return requiredSupabaseEnvVars.filter((key) => !process.env[key]);
}

export function getSupabaseServiceClient() {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }

  const missingEnvVars = getMissingSupabaseEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Supabase configuration is missing: ${missingEnvVars.join(", ")}.`,
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  supabaseServiceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseServiceClient;
}
