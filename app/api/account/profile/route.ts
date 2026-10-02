import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { cleanCpfCnpj, isValidCpfCnpj } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request: Request): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
  } catch {
    // Tenta o token Bearer abaixo.
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  return user && !error ? user : null;
}

function metadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "NAO_AUTENTICADO", message: "Faça login para continuar." },
        { status: 401 },
      );
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("cliente")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) return NextResponse.json({ profile: existing, created: false });

    const personType =
      metadataValue(user, "person_type") === "JURIDICA" ? "JURIDICA" : "FISICA";
    const document = cleanCpfCnpj(metadataValue(user, "cpf_cnpj"));
    const name = metadataValue(user, "name");
    const phone = metadataValue(user, "phone");
    const email = String(user.email || "").trim().toLowerCase();

    if (
      !name ||
      !email ||
      !phone ||
      !isValidCpfCnpj(document, personType)
    ) {
      return NextResponse.json(
        {
          error: "PERFIL_INCOMPLETO",
          message: "Os dados básicos do cadastro estão incompletos.",
        },
        { status: 422 },
      );
    }

    const { data: created, error: insertError } = await supabaseAdmin
      .from("cliente")
      .insert({
        user_id: user.id,
        nomerazaosocial: name,
        tipopessoa: personType,
        cpfcnpj: document,
        email,
        telefone: phone,
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: concurrentProfile } = await supabaseAdmin
          .from("cliente")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (concurrentProfile) {
          return NextResponse.json({
            profile: concurrentProfile,
            created: false,
          });
        }
      }
      throw insertError;
    }

    return NextResponse.json({ profile: created, created: true });
  } catch (error) {
    console.error("[api/account/profile] Erro:", error);
    return NextResponse.json(
      { error: "ERRO_INTERNO", message: "Não foi possível preparar o perfil." },
      { status: 500 },
    );
  }
}
