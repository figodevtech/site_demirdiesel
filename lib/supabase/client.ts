import { createBrowserClient } from "@supabase/ssr";

// Este cliente pertence exclusivamente ao banco da loja.
// Os nomes antigos ficam como fallback temporario durante a migracao.
const supabaseUrl =
  process.env.NEXT_PUBLIC_STORE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_STORE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase da loja nao configurado. Defina NEXT_PUBLIC_STORE_SUPABASE_URL e NEXT_PUBLIC_STORE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
