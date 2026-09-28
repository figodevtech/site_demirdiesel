import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_KEY = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || "";
const PAGARME_API_KEY = RAW_KEY.trim().replace(/^["']|["']$/g, "");
const IS_TEST = PAGARME_API_KEY.startsWith("sk_test");
const BASE_URL = IS_TEST ? "https://sdx-api.pagar.me/core/v5" : "https://api.pagar.me/core/v5";
const BASIC_AUTH = PAGARME_API_KEY ? Buffer.from(`${PAGARME_API_KEY}:`).toString("base64") : "";
const WEBHOOK_SECRET = (process.env.PAGARME_WEBHOOK_SECRET || "").trim();
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Validação de autenticidade / origem do webhook da Pagar.me
 * REGRA CRÍTICA (Prioridade 9 — Fail Closed):
 * Se em produção o WEBHOOK_SECRET estiver ausente, REJEITAR o processamento imediatamente.
 * Nunca fazer: WEBHOOK_SECRET ausente => aceitar.
 */
function verifyWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null
): { valid: boolean; error?: string } {
  if (!WEBHOOK_SECRET) {
    if (IS_PROD) {
      console.error(
        "[webhook] ERRO DE SEGURANÇA: PAGARME_WEBHOOK_SECRET não configurado em produção. Rejeitando fail-closed."
      );
      return {
        valid: false,
        error: "PAGARME_WEBHOOK_SECRET não configurado no servidor em ambiente de produção.",
      };
    }
    console.warn(
      "[webhook] AVISO: PAGARME_WEBHOOK_SECRET não configurado (permitido apenas em desenvolvimento/teste local)."
    );
    return { valid: true };
  }

  if (!signatureHeader) {
    return { valid: false, error: "Cabeçalho de assinatura do webhook ausente." };
  }

  try {
    const parts = signatureHeader.split("=");
    const algorithm = parts.length === 2 ? parts[0] : "sha256";
    const expectedHash = parts.length === 2 ? parts[1] : parts[0];

    const hmac = crypto.createHmac(algorithm, WEBHOOK_SECRET);
    hmac.update(rawBody);
    const calculatedHash = hmac.digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, "utf-8"),
      Buffer.from(expectedHash, "utf-8")
    );

    return valid ? { valid: true } : { valid: false, error: "Assinatura do webhook inválida." };
  } catch (err: any) {
    console.error("[webhook] Erro ao validar assinatura:", err);
    return { valid: false, error: err.message || "Falha na verificação de assinatura." };
  }
}

/**
 * Consulta oficial autenticada à API da Pagar.me (Prioridade 10)
 */
async function fetchOrderFromPagarme(orderRef: string) {
  if (!orderRef || !PAGARME_API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/orders/${orderRef}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${BASIC_AUTH}`,
      },
    });

    if (!response.ok) {
      console.warn(
        `[webhook] Falha ao consultar ordem ${orderRef} no Pagar.me. Status=${response.status}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[webhook] Erro de rede ao buscar ordem no Pagar.me:", error);
    return null;
  }
}

function resolveStatus(
  eventType?: string,
  status?: string
): "PAGO" | "AUTORIZADO" | "CANCELADO" | "PENDENTE" {
  const normalizedEvent = (eventType || "").toLowerCase();
  const normalizedStatus = (status || "").toLowerCase();

  if (
    normalizedEvent.includes("canceled") ||
    normalizedEvent.includes("payment_failed") ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "failed"
  ) {
    return "CANCELADO";
  }

  if (normalizedStatus === "authorized" || normalizedEvent.includes("authorized")) {
    return "AUTORIZADO";
  }

  if (
    normalizedEvent.includes("paid") ||
    normalizedStatus === "paid" ||
    normalizedStatus === "captured" ||
    normalizedStatus === "closed"
  ) {
    return "PAGO";
  }

  return "PENDENTE";
}

function normalizePaymentMethod(pm: any): string {
  const s = String(pm ?? "").trim().toLowerCase();
  if (!s) return "Pagar.me";
  if (s === "pix") return "Pix";
  if (s === "boleto") return "Boleto";
  if (s === "credit_card") return "Cartão de crédito";
  if (s === "debit_card") return "Cartão de débito";
  return String(pm);
}

function isPaidStatus(status?: string | null): boolean {
  const s = String(status ?? "").trim().toUpperCase();
  return s === "PAGO" || s === "FINALIZADA";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Payload vazio" }, { status: 400 });
    }

    // 1. VALIDAÇÃO DE AUTENTICIDADE — FAIL CLOSED (Prioridade 9)
    const signatureHeader =
      request.headers.get("x-hub-signature") ||
      request.headers.get("x-pagarme-signature") ||
      request.headers.get("x-hub-signature-256");

    const verification = verifyWebhookSignature(rawBody, signatureHeader);
    if (!verification.valid) {
      console.warn(`[webhook] Requisição rejeitada: ${verification.error}`);
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      try {
        payload = Object.fromEntries(new URLSearchParams(rawBody));
      } catch {
        return NextResponse.json({ error: "Formato de payload inválido" }, { status: 400 });
      }
    }

    const eventType = payload.type || payload.event || payload.name;
    const data = payload.data?.object || payload.data?.order || payload.data || payload.object || {};
    const orderNode = data.order || data;
    const payloadMetadata = orderNode?.metadata || data?.metadata || payload.metadata || {};

    const pagarmeOrderRef =
      orderNode?.id || orderNode?.code || data?.id || data?.code || payload.data?.order_code;
    const statusFromPayload = orderNode?.status || data?.status || payload.status;

    // 2. CONSULTA AUTÊNTICA À API DO GATEWAY (Prioridade 10)
    // Dá preferência ao status retornado pela consulta autenticada à API do Pagar.me
    let fetchedOrder: any = null;
    if (pagarmeOrderRef) {
      fetchedOrder = await fetchOrderFromPagarme(pagarmeOrderRef);
    }

    // 3. IDENTIFICAÇÃO CONFIÁVEL DO PEDIDO LOCAL (Prioridade 11 — NUNCA USAR HEURÍSTICA DE VALOR)
    let orderId =
      fetchedOrder?.metadata?.orderId ||
      fetchedOrder?.metadata?.order_id ||
      payloadMetadata?.orderId ||
      payloadMetadata?.order_id ||
      payloadMetadata?.orderID;

    if (!orderId && fetchedOrder?.code && /^\d+$/.test(String(fetchedOrder.code))) {
      orderId = fetchedOrder.code;
    }

    if (!orderId) {
      const charges = fetchedOrder?.charges || orderNode?.charges || data?.charges;
      const chargeMeta = charges?.[0]?.metadata || charges?.[0]?.last_transaction?.metadata;
      orderId = chargeMeta?.orderId || chargeMeta?.order_id;
    }

    if (!orderId) {
      console.warn(
        `[webhook] Webhook ignorado: nenhuma identificação confiável de pedido local (OrderRef=${pagarmeOrderRef}).`
      );
      return NextResponse.json(
        { message: "Identificador de pedido não encontrado" },
        { status: 200 }
      );
    }

    const numericOrderId = Number(String(orderId).trim());
    if (isNaN(numericOrderId) || numericOrderId <= 0) {
      console.warn(`[webhook] Order ID inválido: "${orderId}". Operação abortada.`);
      return NextResponse.json({ message: "Formato de Order ID inválido" }, { status: 200 });
    }

    // Status oficial: Prioriza retorno autenticado da API do gateway sobre o payload (Prioridade 10)
    const authoritativeStatus = fetchedOrder?.status || statusFromPayload;
    const newStatus = resolveStatus(eventType, authoritativeStatus);

    const paymentSource =
      fetchedOrder?.charges?.[0]?.last_transaction ||
      orderNode?.last_transaction ||
      data?.last_transaction ||
      data?.charges?.[0]?.last_transaction;

    const paymentMethod = normalizePaymentMethod(paymentSource?.payment_method);

    console.log(
      `[webhook] Processando: Pedido=#${numericOrderId}, StatusOficial=${newStatus}, Método=${paymentMethod}, Evento=${eventType}`
    );

    // Consulta estado anterior da venda para garantir idempotência estrita
    const { data: before, error: beforeErr } = await supabaseAdmin
      .from("venda")
      .select("id, status, forma_pagamento")
      .eq("id", numericOrderId)
      .maybeSingle();

    if (beforeErr || !before) {
      console.warn(`[webhook] Venda #${numericOrderId} não encontrada no banco local.`);
      return NextResponse.json({ message: "Venda não encontrada" }, { status: 200 });
    }

    const previousStatus = String(before.status || "").trim().toUpperCase();
    const paidBefore = isPaidStatus(previousStatus);

    // 4. ATUALIZA O STATUS DA VENDA NO BANCO
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedat: nowIso,
    };

    if (paymentMethod && paymentMethod !== "Pagar.me") {
      updatePayload.forma_pagamento = paymentMethod;
    }

    const { error: updError } = await supabaseAdmin
      .from("venda")
      .update(updatePayload)
      .eq("id", numericOrderId);

    if (updError) {
      console.error(`[webhook] Falha ao atualizar status da venda #${numericOrderId}:`, updError);
      return NextResponse.json({ error: "Falha na atualização do banco" }, { status: 500 });
    }

    // 5. BAIXA DE ESTOQUE COM IDEMPOTÊNCIA ESTRITA VIA RPC (Prioridade 12)
    // Somente baixa estoque se a venda NÃO estava paga anteriormente e agora passa para PAGO
    if (isPaidStatus(newStatus) && !paidBefore) {
      console.log(
        `[webhook] Transição para status pago confirmada. Executando fn_baixar_estoque_venda para venda #${numericOrderId}...`
      );
      const { error: rpcErr } = await supabaseAdmin.rpc("fn_baixar_estoque_venda", {
        p_venda_id: numericOrderId,
      });

      if (rpcErr) {
        console.error(
          `[webhook] Erro ao executar RPC fn_baixar_estoque_venda para venda #${numericOrderId}:`,
          rpcErr
        );
      }
    }

    // 6. ESTORNO DE ESTOQUE EM CASO DE CANCELAMENTO VIA RPC (Prioridade 12)
    // Somente estorna se a venda ESTAVA paga anteriormente e foi cancelada
    if (newStatus === "CANCELADO" && paidBefore) {
      console.log(
        `[webhook] Transição de pago para cancelado. Executando fn_estornar_estoque_venda para venda #${numericOrderId}...`
      );
      const { error: rpcErr } = await supabaseAdmin.rpc("fn_estornar_estoque_venda", {
        p_venda_id: numericOrderId,
      });

      if (rpcErr) {
        console.error(
          `[webhook] Erro ao executar RPC fn_estornar_estoque_venda para venda #${numericOrderId}:`,
          rpcErr
        );
      }
    }

    return NextResponse.json({
      received: true,
      orderId: numericOrderId,
      status: newStatus,
      paymentMethod,
    });
  } catch (error: any) {
    console.error("[webhook] Exceção no processamento do webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
