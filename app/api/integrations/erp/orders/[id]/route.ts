import { AsaasApiError, getAsaasPayment, refundAsaasPayment, refundAsaasBankSlip } from "@/lib/asaas";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  deliveryStatus: z.enum(["SEPARACAO", "FATURADO", "ENVIADO", "ENTREGUE"]).nullish(),
  trackingCode: z.string().trim().max(120).nullish(),
  carrier: z.string().trim().max(160).nullish(),
  trackingUrl: z.string().url().max(2000).nullish(),
  invoice: z.object({
    number: z.string().trim().max(30).nullish(),
    series: z.string().trim().max(20).nullish(),
    accessKey: z.string().regex(/^\d{44}$/).nullish(),
    danfeUrl: z.string().url().max(2000).nullish(),
  }).nullish(),
});

function isAuthorized(request: Request) {
  const expected = process.env.ERP_ORDER_SYNC_SECRET?.trim() || "";
  const header = request.headers.get("authorization") || "";
  const received = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return Boolean(expected && received) && receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "PEDIDO_INVALIDO" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "DADOS_INVALIDOS", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: refundRequest, error: refundRequestError } = await supabaseAdmin.from("site_order_refund_request")
    .select("order_id").eq("order_id", orderId).maybeSingle();
  if (refundRequestError) return NextResponse.json({ error: "Nao foi possivel verificar o bloqueio de estorno." }, { status: 503 });
  if (refundRequest) return NextResponse.json({ error: "Pedido com estorno solicitado nao pode ter o andamento atualizado." }, { status: 409 });
  const { data: physicalReturn, error: returnError } = await supabaseAdmin.from("site_order_return").select("order_id").eq("order_id", orderId).maybeSingle();
  if (returnError) return NextResponse.json({ error: "Falha ao verificar devolução." }, { status: 503 });
  if (physicalReturn) return NextResponse.json({ error: "Pedido em devolução não pode ter o andamento atualizado." }, { status: 409 });

  const value = parsed.data;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { updatedat: now };
  if (value.deliveryStatus !== undefined) payload.status_entrega = value.deliveryStatus;
  if (value.trackingCode !== undefined) payload.codigo_rastreio = value.trackingCode || null;
  if (value.carrier !== undefined) payload.transportadora = value.carrier || null;
  if (value.trackingUrl !== undefined) payload.url_rastreio = value.trackingUrl || null;
  if (value.deliveryStatus === "SEPARACAO") payload.separacao_em = now;
  if (value.deliveryStatus === "ENVIADO") payload.enviado_em = now;
  if (value.deliveryStatus === "ENTREGUE") payload.entregue_em = now;
  if (value.invoice) {
    payload.nfe_numero = value.invoice.number || null;
    payload.nfe_serie = value.invoice.series || null;
    payload.nfe_chave_acesso = value.invoice.accessKey || null;
    payload.danfe_url = value.invoice.danfeUrl || null;
    payload.faturado_em = now;
    if (!value.deliveryStatus) payload.status_entrega = "FATURADO";
  }

  const { data, error } = await supabaseAdmin
    .from("venda")
    .update(payload)
    .eq("id", orderId)
    .eq("status", "PAGO")
    .eq("canal", "ONLINE")
    .select("id, status_entrega, codigo_rastreio, transportadora, url_rastreio, nfe_numero, nfe_serie, nfe_chave_acesso, danfe_url, separacao_em, faturado_em, enviado_em, entregue_em")
    .maybeSingle();

  if (error) {
    console.error("[erp/orders/:id] Falha ao atualizar pedido:", error);
    return NextResponse.json({ error: "ERRO_AO_ATUALIZAR_PEDIDO" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "PEDIDO_NAO_ENCONTRADO" }, { status: 404 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
  try {
    const orderId = Number((await params).id);
    const body = await request.json();
    const reason = String(body.reason || "").trim();
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || reason.length < 3 || reason.length > 500) {
      return NextResponse.json({ error: "Pedido ou motivo inválido." }, { status: 400 });
    }
    const { data: order, error } = await supabaseAdmin.from("venda")
      .select("id, gateway_payment_id, payment_provider, status, status_entrega, enviado_em, entregue_em")
      .eq("id", orderId).eq("canal", "ONLINE").maybeSingle();
    if (error) throw error;
    if (!order || order.payment_provider !== "ASAAS" || !order.gateway_payment_id) {
      return NextResponse.json({ error: "Pedido sem cobrança Asaas." }, { status: 409 });
    }
    const { data: physicalReturn, error: returnError } = await supabaseAdmin.from("site_order_return").select("received_at").eq("order_id", orderId).maybeSingle();
    if (returnError) throw returnError;
    if ((["ENVIADO", "ENTREGUE"].includes(String(order.status_entrega)) || order.enviado_em || order.entregue_em) && !physicalReturn?.received_at) {
      return NextResponse.json({ error: "Pedido enviado ou entregue exige devolucao fisica conferida. O cancelamento automatico foi bloqueado." }, { status: 409 });
    }
    let payment = await getAsaasPayment(order.gateway_payment_id);
    if (String(payment.externalReference) !== String(orderId)) throw new Error("Cobrança divergente do pedido.");
    if (payment.billingType === "BOLETO" && !["RECEIVED", "CONFIRMED", "REFUNDED", "REFUND_REQUESTED", "REFUND_IN_PROGRESS"].includes(payment.status || "")) {
      return NextResponse.json({ error: "Boleto ainda não pago. Cancele a cobrança pendente; não há valor para reembolsar." }, { status: 409 });
    }
    if (payment.status !== "REFUNDED") {
      if (!["PIX", "CREDIT_CARD", "BOLETO"].includes(payment.billingType || "")) {
        return NextResponse.json({ error: "Estorno automático disponível para Pix e cartão. Boleto exige o fluxo de devolução no Asaas." }, { status: 409 });
      }
      if (["RECEIVED", "CONFIRMED"].includes(payment.status || "")) {
        const { error: claimError } = await supabaseAdmin.from("site_order_refund_request")
          .insert({ order_id: orderId, payment_id: payment.id, reason });
        let claimed = !claimError;
        if (claimError && claimError.code !== "23505") throw claimError;
        if (claimError?.code === "23505") {
          const { data: previous, error: previousError } = await supabaseAdmin.from("site_order_refund_request")
            .select("denied_at, denial_reason").eq("order_id", orderId).maybeSingle();
          if (previousError) throw previousError;
          if (previous?.denied_at) {
            if ((payment.refunds || []).some(refund => !["DENIED", "FAILED", "CANCELLED"].includes(String(refund.status)))) {
              return NextResponse.json({ error: "O Asaas possui outro reembolso registrado. Consulte antes de repetir o estorno." }, { status: 409 });
            }
            const { data: reopened, error: reopenError } = await supabaseAdmin.rpc("fn_reabrir_estorno_recusado_site", {
              p_order_id: orderId, p_payment_id: payment.id, p_expected_denied_at: previous.denied_at, p_reason: reason,
            });
            if (reopenError) throw reopenError;
            claimed = reopened === true;
          }
        }
        if (claimed) {
          try {
            if (payment.billingType === "BOLETO") {
              const result = await refundAsaasBankSlip(payment.id);
              const url = new URL(result.requestUrl);
              if (url.protocol !== "https:" || !["asaas.com", "www.asaas.com", "sandbox.asaas.com"].includes(url.hostname)) throw new Error("Link de reembolso Asaas inválido.");
              const { error: urlError } = await supabaseAdmin.from("site_order_refund_request").update({request_url: url.href}).eq("order_id", orderId);
              if (urlError) throw urlError;
            } else payment = await refundAsaasPayment(payment.id, reason);
          } catch (refundError) {
            // Definitive rejection may be retried; uncertain network results
            // stay claimed to prevent issuing a second financial operation.
            if (refundError instanceof AsaasApiError && refundError.status < 500) {
              await supabaseAdmin.from("site_order_refund_request").delete().eq("order_id", orderId);
            }
            throw refundError;
          }
        }
      }
      payment = await getAsaasPayment(payment.id);
    }
    if (payment.status !== "REFUNDED") {
      const authorizationPending = (payment.refunds || []).some(refund => refund.status === "AWAITING_CRITICAL_ACTION_AUTHORIZATION");
      const { data: savedRequest, error: savedError } = await supabaseAdmin.from("site_order_refund_request").select("request_url").eq("order_id",orderId).maybeSingle();
      if (savedError) throw savedError;
      return NextResponse.json({ ok: true, pending: true, requestUrl: savedRequest?.request_url || null, refundStatus: savedRequest?.request_url ? "AWAITING_CUSTOMER" : authorizationPending ? "AWAITING_CRITICAL_ACTION_AUTHORIZATION" : payment.status, gatewayStatus: payment.status,
        message: savedRequest?.request_url ? "Boleto: cliente deve preencher os dados e documentos no link do Asaas. Reembolso ainda não concluído." : authorizationPending ? "O reembolso aguarda autorizacao na conta Asaas da Demir. Autorize a acao pendente antes de consultar novamente." : "Estorno ainda não confirmado. O estoque será devolvido após a confirmação." });
    }
    const { error: processError } = await supabaseAdmin.rpc("fn_processar_evento_pagamento_asaas", {
      p_event_id: `ERP-REFUND-${payment.id}`, p_event_type: "PAYMENT_REFUNDED",
      p_payment_id: payment.id, p_venda_id: orderId, p_gateway_status: payment.status,
      p_novo_status: "CANCELADO", p_forma_pagamento: payment.billingType || "Asaas",
    });
    if (processError) throw processError;
    return NextResponse.json({ ok: true, pending: false, gatewayStatus: payment.status });
  } catch (error) {
    const databaseError = error as { code?: string; message?: string } | null;
    console.error("[erp/orders/refund]", { code: databaseError?.code, message: databaseError?.message });
    const missingControl = databaseError?.code === "PGRST205" && databaseError?.message?.includes("site_order_refund_request");
    return NextResponse.json({ error: missingControl
      ? "Falta aplicar a migration 20261006_site_order_refund_request.sql no banco da loja Demir. O estorno foi bloqueado para evitar duplicidade."
      : error instanceof Error ? error.message : "Falha ao estornar pedido. Consulte o log da loja." }, { status: missingControl ? 503 : 502 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
  try {
    const orderId = Number((await params).id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return NextResponse.json({ error: "PEDIDO_INVALIDO" }, { status: 400 });
    const { data: order, error } = await supabaseAdmin.from("venda").select("gateway_payment_id, status_entrega, enviado_em, entregue_em").eq("id", orderId).eq("canal", "ONLINE").maybeSingle();
    if (error) throw error;
    if (!order?.gateway_payment_id) return NextResponse.json({ error: "Pedido sem cobrança." }, { status: 404 });
    const payment = await getAsaasPayment(order.gateway_payment_id);
    if (String(payment.externalReference) !== String(orderId)) throw new Error("Cobrança divergente.");
    const { data: refund, error: refundError } = await supabaseAdmin.from("site_order_refund_request").select("reason, created_at, denial_reason, denied_at, request_url").eq("order_id", orderId).maybeSingle();
    if (refundError) throw refundError;
    if (payment.status === "REFUNDED") {
      const {error: processError} = await supabaseAdmin.rpc("fn_processar_evento_pagamento_asaas", {
        p_event_id:`ERP-REFUND-${payment.id}`,p_event_type:"PAYMENT_REFUNDED",p_payment_id:payment.id,
        p_venda_id:orderId,p_gateway_status:payment.status,p_novo_status:"CANCELADO",p_forma_pagamento:payment.billingType || "Asaas",
      });
      if(processError) throw processError;
    }
    const { data: physicalReturn, error: returnError } = await supabaseAdmin.from("site_order_return").select("requested_at, received_at, restocked_at").eq("order_id",orderId).maybeSingle();
    if (returnError) throw returnError;
    return NextResponse.json({ physicalReturn, requestUrl: refund?.request_url || null, requiresPhysicalReturn: !physicalReturn?.received_at && ( ["ENVIADO", "ENTREGUE"].includes(String(order.status_entrega)) || Boolean(order.enviado_em || order.entregue_em)), refundStatus: payment.status === "REFUNDED" ? "REFUNDED" : (payment.refunds || []).some(item => item.status === "AWAITING_CRITICAL_ACTION_AUTHORIZATION") ? "AWAITING_CRITICAL_ACTION_AUTHORIZATION" : refund?.denied_at ? "DENIED" : refund?.request_url ? "AWAITING_CUSTOMER" : payment.status, denialReason: payment.status !== "REFUNDED" ? refund?.denial_reason || null : null, gatewayStatus: payment.status, requestedAt: refund?.created_at || null, reason: refund?.reason || null });
  } catch (error) {
    const databaseError = error as { code?: string; message?: string } | null;
    console.error("[erp/orders/refund-status]", { code: databaseError?.code, message: databaseError?.message });
    const missingControl = databaseError?.code === "PGRST205" && databaseError?.message?.includes("site_order_refund_request");
    return NextResponse.json({ error: missingControl ? "Falta aplicar a migration de controle de estornos no banco da loja Demir." : error instanceof Error ? error.message : "Falha ao consultar estorno." }, { status: missingControl ? 503 : 502 });
  }
}

// Entire-order return only: partial or damaged returns must not use this action.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
 if (!isAuthorized(request)) return NextResponse.json({error:"NAO_AUTORIZADO"},{status:401});
 try {
  const orderId=Number((await params).id);
  const parsed=z.object({action:z.enum(["REQUEST_RETURN","RECEIVE_RETURN"]),reason:z.string().trim().min(3).max(500),operator:z.string().trim().min(1).max(100),allItemsApproved:z.literal(true).optional(),reverseTracking:z.string().trim().max(160).optional()}).safeParse(await request.json());
  if(!Number.isSafeInteger(orderId)||orderId<=0||!parsed.success) return NextResponse.json({error:"Dados inválidos."},{status:400});
  const {data:order,error}=await supabaseAdmin.from("venda").select("id,status,status_entrega,enviado_em,entregue_em").eq("id",orderId).eq("canal","ONLINE").maybeSingle();
  if(error) throw error;
  if(!order||!(["ENVIADO","ENTREGUE"].includes(String(order.status_entrega))||order.enviado_em||order.entregue_em)) return NextResponse.json({error:"Pedido não possui saída física registrada."},{status:409});
  if(parsed.data.action==="REQUEST_RETURN") {
   const {error:saveError}=await supabaseAdmin.from("site_order_return").upsert({order_id:orderId,reason:parsed.data.reason,requested_by:parsed.data.operator,reverse_tracking:parsed.data.reverseTracking||null},{onConflict:"order_id",ignoreDuplicates:true});
   if(saveError) throw saveError;
  } else {
   if(!parsed.data.allItemsApproved) return NextResponse.json({error:"Confira todos os itens e quantidades, em condição de retornar ao estoque."},{status:400});
   const {error:receiveError}=await supabaseAdmin.rpc("fn_receber_devolucao_site",{p_order_id:orderId,p_operator:parsed.data.operator,p_note:parsed.data.reason});
   if(receiveError) throw receiveError;
  }
  return NextResponse.json({ok:true});
 } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Falha ao registrar devolução."},{status:502}); }
}
