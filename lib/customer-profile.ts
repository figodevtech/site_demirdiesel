import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type PersonType = "FISICA" | "JURIDICA";

interface CustomerProfileInput {
  name: string;
  personType: PersonType;
  document: string;
  email: string;
  phone: string;
}

export async function ensureCustomerProfile(
  user: User,
  input?: CustomerProfileInput,
) {
  const { data: existing, error: lookupError } = await supabase
    .from("cliente")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing;

  if (input) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name: input.name.trim(),
        person_type: input.personType,
        cpf_cnpj: input.document,
        phone: input.phone.trim(),
      },
    });
    if (metadataError) throw metadataError;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const response = await fetch("/api/account/profile", {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Não foi possível preparar o perfil.");
  }

  return result.profile;
}
