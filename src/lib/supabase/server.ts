import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseServiceClient: SupabaseClient | null = null;

type SupabaseServiceClientOptions = {
  timeoutMs?: number;
};

const requiredSupabaseEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function getMissingSupabaseEnvVars() {
  return requiredSupabaseEnvVars.filter((key) => !process.env[key]);
}

function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const externalSignal = init?.signal;

    if (externalSignal?.aborted) {
      controller.abort();
    } else if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

export function getSupabaseServiceClient(options?: SupabaseServiceClientOptions) {
  if (!options?.timeoutMs && supabaseServiceClient) {
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

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    ...(options?.timeoutMs
      ? {
          global: {
            fetch: createFetchWithTimeout(options.timeoutMs),
          },
        }
      : {}),
  });

  if (!options?.timeoutMs) {
    supabaseServiceClient = client;
  }

  return client;
}
