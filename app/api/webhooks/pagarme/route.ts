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

/**
 * Validação de autenticidade / origem do webhook da Pagar.me
 */
function verifyWebhookSignature(rawBody: string, signatureHeader?: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    // Se o segredo não estiver configurado no ambiente, permite validação por fetchOrderFromPagarme
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const parts = signatureHeader.split("=");
    const algorithm = parts.length === 2 ? parts[0] : "sha256";
    const expectedHash = parts.length === 2 ? parts[1] : parts[0];

    const hmac = crypto.createHmac(algorithm, WEBHOOK_SECRET);
    hmac.update(rawBody);
    const calculatedHash = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, "utf-8"),
      Buffer.from(expectedHash, "utf-8")
    );
  } catch (err) {
    console.error("[webhook] Erro ao validar assinatura:", err);
    return false;
  }
}

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
      console.warn(`[webhook] Falha ao consultar ordem ${orderRef} no Pagar.me. Status=${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[webhook] Erro de rede ao buscar ordem no Pagar.me:", error);
    return null;
  }
}

function resolveStatus(eventType?: string, status?: string): "PAGO" | "AUTORIZADO" | "CANCELADO" | "PENDENTE" {
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

async function baixarEstoqueVendaRpc(vendaId: number) {
  try {
    const { error } = await supabaseAdmin.rpc("fn_baixar_estoque_venda", { p_venda_id: vendaId });
    if (!error) return { ok: true as const };

    console.warn(`[webhook] RPC fn_baixar_estoque_venda não encontrada ou retornou erro, usando fallback:`, error.message);
  } catch (err: any) {
    console.warn("[webhook] Exceção ao chamar fn_baixar_estoque_venda:", err.message);
  }

  // Fallback não-atômico caso a RPC ainda não exista no banco
  return baixarEstoqueVendaManual(vendaId);
}

async function baixarEstoqueVendaManual(vendaId: number) {
  const { data: itens, error: itensErr } = await supabaseAdmin
    .from("vendaproduto")
    .select("produtoid, quantidade")
    .eq("venda_id", vendaId);

  if (itensErr) {
    console.error("[webhook] Erro ao buscar itens da venda para baixa de estoque:", itensErr);
    return { ok: false as const, error: itensErr.message };
  }

  const nowIso = new Date().toISOString();

  for (const it of itens ?? []) {
    const produtoId = Number((it as any).produtoid);
    const qtd = Math.max(0, Number((it as any).quantidade) || 0);
    if (!produtoId || !qtd) continue;

    const { data: prod, error: prodErr } = await supabaseAdmin
      .from("produto")
      .select("id, estoque")
      .eq("id", produtoId)
      .single();

    if (prodErr || !prod) {
      console.error(`[webhook] Erro ao buscar produto #${produtoId}:`, prodErr);
      continue;
    }

    const estoqueAtual = Number((prod as any).estoque ?? 0);
    const novoEstoque = Math.max(0, estoqueAtual - qtd);

    const { error: updErr } = await supabaseAdmin
      .from("produto")
      .update({ estoque: novoEstoque, updatedat: nowIso })
      .eq("id", produtoId);

    if (updErr) {
      console.error(`[webhook] Erro ao atualizar estoque do produto #${produtoId}:`, updErr);
    }
  }

  return { ok: true as const };
}

async function estornarEstoqueVendaRpc(vendaId: number) {
  try {
    const { error } = await supabaseAdmin.rpc("fn_estornar_estoque_venda", { p_venda_id: vendaId });
    if (!error) return { ok: true as const };

    console.warn(`[webhook] RPC fn_estornar_estoque_venda não encontrada, usando fallback manual:`, error.message);
  } catch (err: any) {
    console.warn("[webhook] Exceção ao chamar fn_estornar_estoque_venda:", err.message);
  }

  // Fallback manual para estorno
  const { data: itens, error: itensErr } = await supabaseAdmin
    .from("vendaproduto")
    .select("produtoid, quantidade")
    .eq("venda_id", vendaId);

  if (itensErr || !itens) return { ok: false as const };

  const nowIso = new Date().toISOString();
  for (const it of itens) {
    const produtoId = Number((it as any).produtoid);
    const qtd = Math.max(0, Number((it as any).quantidade) || 0);
    if (!produtoId || !qtd) continue;

    const { data: prod } = await supabaseAdmin
      .from("produto")
      .select("id, estoque")
      .eq("id", produtoId)
      .single();

    if (!prod) continue;
    const novoEstoque = (Number(prod.estoque) || 0) + qtd;

    await supabaseAdmin
      .from("produto")
      .update({ estoque: novoEstoque, updatedat: nowIso })
      .eq("id", produtoId);
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Payload vazio" }, { status: 400 });
    }

    // 1. Validação de Autenticidade (REGRA CRÍTICA 4)
    const signatureHeader =
      request.headers.get("x-hub-signature") ||
      request.headers.get("x-pagarme-signature") ||
      request.headers.get("x-hub-signature-256");

    if (WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signatureHeader)) {
      console.warn("[webhook] Tentativa de webhook rejeitada por assinatura inválida.");
      return NextResponse.json({ error: "Assinatura do webhook inválida" }, { status: 401 });
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
    const metadata = orderNode?.metadata || data?.metadata || payload.metadata || {};

    let orderId = metadata?.orderId || metadata?.order_id || metadata?.orderID;
    const pagarmeOrderRef = orderNode?.id || orderNode?.code || data?.id || data?.code || payload.data?.order_code;
    const statusFromPayload = orderNode?.status || data?.status || payload.status;

    // Se o metadata raiz estiver vazio, tenta extrair das cobranças (charges)
    if (!orderId) {
      const charges = orderNode?.charges || data?.charges;
      const chargeMeta = charges?.[0]?.metadata || charges?.[0]?.last_transaction?.metadata;
      orderId = chargeMeta?.orderId || chargeMeta?.order_id;
    }

    // Consulta direta à API Pagar.me para confirmar os dados oficiais da transação
    let fetchedOrder: any = null;
    if (pagarmeOrderRef) {
      fetchedOrder = await fetchOrderFromPagarme(pagarmeOrderRef);
      if (!orderId && fetchedOrder) {
        const fetchedMeta = fetchedOrder.metadata || {};
        orderId = fetchedMeta.orderId || fetchedMeta.order_id;
        if (!orderId && fetchedOrder.code && /^\d+$/.test(String(fetchedOrder.code))) {
          orderId = fetchedOrder.code;
        }
      }
    }

    // REGRA 4: NUNCA associar pedido por aproximação de valor monetário (findOrderByAmount removido).
    if (!orderId) {
      console.warn(`[webhook] Webhook ignorado: nenhuma identificação confiável de pedido local (OrderRef=${pagarmeOrderRef}).`);
      return NextResponse.json({ message: "Identificador de pedido não encontrado" }, { status: 200 });
    }

    const numericOrderId = Number(String(orderId).trim());
    if (isNaN(numericOrderId) || numericOrderId <= 0) {
      console.warn(`[webhook] Order ID inválido: "${orderId}". Operação abortada.`);
      return NextResponse.json({ message: "Formato de Order ID inválido" }, { status: 200 });
    }

    const paymentSource =
      orderNode?.last_transaction ||
      data?.last_transaction ||
      data?.charges?.[0]?.last_transaction ||
      fetchedOrder?.charges?.[0]?.last_transaction;

    const paymentMethod = normalizePaymentMethod(paymentSource?.payment_method);
    const newStatus = resolveStatus(eventType, statusFromPayload || fetchedOrder?.status);

    console.log(`[webhook] Processando: Pedido=#${numericOrderId}, Status=${newStatus}, Método=${paymentMethod}, Evento=${eventType}`);

    // Consulta o estado anterior da venda para garantir idempotência
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

    // 2. Atualiza o status e a forma de pagamento no banco
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

    // 3. Baixa de estoque com Idempotência Estrita
    // Somente baixa estoque se a venda NÃO estava paga anteriormente e agora passa para PAGO
    if (isPaidStatus(newStatus) && !paidBefore) {
      console.log(`[webhook] Transição para status pago confirmada. Executando baixa de estoque para venda #${numericOrderId}...`);
      const res = await baixarEstoqueVendaRpc(numericOrderId);
      if (!res.ok) {
        console.error(`[webhook] Baixa de estoque da venda #${numericOrderId} falhou:`, res.error);
      }
    }

    // 4. Estorno de estoque em caso de cancelamento
    if (newStatus === "CANCELADO" && paidBefore) {
      console.log(`[webhook] Transição de pago para cancelado. Executando estorno de estoque para venda #${numericOrderId}...`);
      const res = await estornarEstoqueVendaRpc(numericOrderId);
      if (!res.ok) {
        console.error(`[webhook] Estorno de estoque da venda #${numericOrderId} falhou:`, (res as any).error);
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
