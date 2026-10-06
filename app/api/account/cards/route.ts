import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  AsaasApiError,
  createAsaasCustomer,
  findAsaasCustomer,
  tokenizeAsaasCreditCard,
} from "@/lib/asaas";
import { cleanCpfCnpj } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CardInput {
  holderName?: string;
  number?: string;
  expiryMonth?: string;
  expiryYear?: string;
  ccv?: string;
}

async function getAuthenticatedUser(request: Request): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (data.user && !error) return data.user;
  } catch {
    // Tenta o token Bearer abaixo.
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return data.user && !error ? data.user : null;
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "127.0.0.1";
}

function publicCard(card: Record<string, unknown>) {
  return {
    id: card.id,
    brand: card.brand,
    lastFour: card.last_four,
    holderName: card.holder_name,
    expiryMonth: card.expiry_month,
    expiryYear: card.expiry_year,
    isDefault: card.is_default,
    createdAt: card.created_at,
  };
}

async function customerForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("cliente")
    .select("id, nomerazaosocial, email, cpfcnpj, telefone, asaas_customer_id")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("PERFIL_NAO_ENCONTRADO");
  return data;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });

    const customer = await customerForUser(user.id);
    const currentCustomer = await findAsaasCustomer(
      cleanCpfCnpj(String(customer.cpfcnpj || "")),
      `LOJA-CLIENTE-${customer.id}`,
    );
    // Tokens cannot be moved between Asaas accounts or customer registrations.
    if (!currentCustomer) return NextResponse.json({ cards: [] });

    const { data, error } = await supabaseAdmin
      .from("customer_payment_card")
      .select("id, brand, last_four, holder_name, expiry_month, expiry_year, is_default, created_at")
      .eq("user_id", user.id)
      .eq("cliente_id", customer.id)
      .eq("provider_customer_id", currentCustomer.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ cards: (data || []).map(publicCard) });
  } catch (error) {
    console.error("[api/account/cards] Falha ao listar cartões:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Não foi possível carregar seus cartões." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });

    const body = (await request.json()) as CardInput;
    const holderName = String(body.holderName || "").trim();
    const number = String(body.number || "").replace(/\D/g, "");
    const expiryMonth = String(body.expiryMonth || "").replace(/\D/g, "").padStart(2, "0");
    let expiryYear = String(body.expiryYear || "").replace(/\D/g, "");
    if (expiryYear.length === 2) expiryYear = `20${expiryYear}`;
    const ccv = String(body.ccv || "").replace(/\D/g, "");

    if (!holderName || number.length < 13 || number.length > 19 || !/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{4}$/.test(expiryYear) || !/^\d{3,4}$/.test(ccv)) {
      return NextResponse.json({ message: "Confira os dados do cartão." }, { status: 422 });
    }

    const customer = await customerForUser(user.id);
    const { data: address } = await supabaseAdmin
      .from("cliente_endereco")
      .select("cep, logradouro, numero, complemento, bairro")
      .eq("cliente_id", customer.id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!address) {
      return NextResponse.json(
        { message: "Cadastre um endereço antes de adicionar um cartão." },
        { status: 422 },
      );
    }

    const document = cleanCpfCnpj(String(customer.cpfcnpj || ""));
    const phone = String(customer.telefone || "").replace(/\D/g, "");
    const externalReference = `LOJA-CLIENTE-${customer.id}`;
    const existing = await findAsaasCustomer(document, externalReference);
    let asaasCustomerId = existing?.id || "";

    if (!asaasCustomerId) {
      const asaasCustomer = await createAsaasCustomer({
        name: customer.nomerazaosocial,
        cpfCnpj: document,
        email: customer.email,
        mobilePhone: phone,
        address: address.logradouro,
        addressNumber: address.numero,
        complement: address.complemento || undefined,
        province: address.bairro,
        postalCode: String(address.cep || "").replace(/\D/g, ""),
        externalReference,
        notificationDisabled: false,
      });
      asaasCustomerId = asaasCustomer.id;
    }
    if (asaasCustomerId !== String(customer.asaas_customer_id || "").trim()) {
      const { error } = await supabaseAdmin
        .from("cliente")
        .update({ asaas_customer_id: asaasCustomerId, updatedat: new Date().toISOString() })
        .eq("id", customer.id);
      if (error) throw error;
    }

    const tokenized = await tokenizeAsaasCreditCard({
      customer: asaasCustomerId,
      creditCard: { holderName, number, expiryMonth, expiryYear, ccv },
      creditCardHolderInfo: {
        name: customer.nomerazaosocial,
        email: customer.email,
        cpfCnpj: document,
        postalCode: String(address.cep || "").replace(/\D/g, ""),
        addressNumber: address.numero,
        addressComplement: address.complemento || undefined,
        phone,
        mobilePhone: phone,
      },
      remoteIp: clientIp(request),
    });

    if (!tokenized.creditCardToken) throw new Error("TOKEN_NAO_RETORNADO");
    const { count } = await supabaseAdmin
      .from("customer_payment_card")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("provider_customer_id", asaasCustomerId);

    const { data: saved, error: saveError } = await supabaseAdmin
      .from("customer_payment_card")
      .insert({
        cliente_id: customer.id,
        user_id: user.id,
        provider_customer_id: asaasCustomerId,
        provider_card_token: tokenized.creditCardToken,
        brand: String(tokenized.creditCardBrand || "CARTAO").toUpperCase(),
        last_four: String(tokenized.creditCardNumber || number).replace(/\D/g, "").slice(-4),
        holder_name: holderName,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        is_default: (count || 0) === 0,
      })
      .select("id, brand, last_four, holder_name, expiry_month, expiry_year, is_default, created_at")
      .single();
    if (saveError) throw saveError;

    return NextResponse.json({ card: publicCard(saved) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[api/account/cards] Falha ao salvar cartão:", message);
    if (error instanceof AsaasApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status >= 500 ? 502 : 422 });
    }
    return NextResponse.json(
      { message: message === "PERFIL_NAO_ENCONTRADO" ? "Complete seu perfil antes de adicionar um cartão." : "Não foi possível salvar o cartão." },
      { status: message === "PERFIL_NAO_ENCONTRADO" ? 422 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ message: "Faça login para continuar." }, { status: 401 });
    const { cardId } = (await request.json()) as { cardId?: string };
    if (!cardId) return NextResponse.json({ message: "Cartão inválido." }, { status: 422 });

    const { error } = await supabaseAdmin
      .from("customer_payment_card")
      .delete()
      .eq("id", cardId)
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("[api/account/cards] Falha ao remover cartão:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Não foi possível remover o cartão." }, { status: 500 });
  }
}
