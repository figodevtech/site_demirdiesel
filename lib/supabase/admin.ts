import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_STORE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.STORE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada no ambiente.");
}

let _cachedAdminClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_cachedAdminClient) {
    return _cachedAdminClient;
  }

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada no ambiente.");
  }

  if (!supabaseServiceKey) {
    throw new Error(
      "CRITICAL: SUPABASE_SERVICE_ROLE_KEY ausente no servidor. Operações administrativas não podem prosseguir sem a chave com permissão de service role."
    );
  }

  _cachedAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _cachedAdminClient;
}

/**
 * Proxy seguro para o cliente administrativo do Supabase.
 * Falha explicitamente se chamado sem SUPABASE_SERVICE_ROLE_KEY válida no servidor.
 * Nunca faz fallback silencioso para a chave anônima.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseAdmin();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
