import { reconcileCheckout } from '@/lib/checkout-reconcile';
import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAsaasPayment } from "@/lib/asaas";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookToken = String(process.env.ASAAS_WEBHOOK_TOKEN || "").trim();

function secureEquals(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function localStatus(asaasStatus: string) {
  const status = asaasStatus.trim().toUpperCase();
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status)) return "PAGO";
  if (
    [
      "REFUNDED",
      "DELETED",
    ].includes(status)
  ) {
    return "CANCELADO";
  }
  return "PENDENTE";
}

function paymentMethod(billingType?: string) {
  const value = String(billingType || "").trim().toUpperCase();
  if (value === "PIX") return "PIX";
  if (value === "BOLETO") return "Boleto";
  if (value === "CREDIT_CARD") return "Cartão de crédito";
  return "Asaas";
}

export async function POST(request: Request) {
  try {
    if (!webhookToken) {
      console.error("[webhook/asaas] ASAAS_WEBHOOK_TOKEN não configurado.");
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
    }

    const receivedToken = String(request.headers.get("asaas-access-token") || "").trim();
    if (!receivedToken || !secureEquals(receivedToken, webhookToken)) {
      return NextResponse.json({ error: "Token de webhook inválido" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const eventId = String(payload?.id || "").trim();
    const eventType = String(payload?.event || "").trim().toUpperCase();
    const paymentId = String(payload?.payment?.id || "").trim();

    if (!eventId || !eventType || !paymentId) {
      return NextResponse.json({ error: "Evento incompleto" }, { status: 400 });
    }

    const {error:inboxError}=await supabaseAdmin.from('checkout_gateway_event').upsert({event_id:eventId,event_type:eventType,payment_id:paymentId},{onConflict:'event_id',ignoreDuplicates:true});
    if(inboxError)throw inboxError;

    // O payload identifica o recurso, mas o estado financeiro é relido na API oficial.
    const payment = await getAsaasPayment(paymentId);
    const orderId = Number(payment.externalReference);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      console.warn("[webhook/asaas] Cobrança sem pedido local válido:", paymentId);
      return NextResponse.json({ received: true, ignored: true });
    }

    const gatewayStatus = String(payment.status || "PENDING").trim().toUpperCase();
    const centrallyHandled = await reconcileCheckout(orderId,payment,eventType);
    const { data: result, error } = centrallyHandled ? {data:null,error:null} : await supabaseAdmin.rpc(
      "fn_processar_evento_pagamento_asaas",
      {
        p_event_id: eventId,
        p_event_type: eventType,
        p_payment_id: paymentId,
        p_venda_id: orderId,
        p_gateway_status: gatewayStatus,
        p_novo_status: localStatus(gatewayStatus),
        p_forma_pagamento: paymentMethod(payment.billingType),
      }
    );

    if (error) {
      console.error("[webhook/asaas] Falha transacional:", error);
      return NextResponse.json({ error: "Falha ao processar evento" }, { status: 500 });
    }

    if (eventType === "PAYMENT_REFUND_DENIED" && gatewayStatus !== "REFUNDED") {
      // Asaas dateCreated has no offset and uses Brasilia time.
      const rawDate = String(payload.dateCreated || "");
      const deniedAt = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDate) ? rawDate.replace(" ", "T") + "-03:00" : rawDate);
      if (!Number.isFinite(deniedAt.getTime())) throw new Error("Data de recusa invalida.");
      const { error: denialError } = await supabaseAdmin.rpc("fn_registrar_recusa_estorno_site", {
        p_order_id: orderId, p_payment_id: paymentId,
        p_reason: String(payload.additionalInfo?.denialReason || "Estorno recusado pelo Asaas"),
        p_denied_at: deniedAt.toISOString(),
      });
      if (denialError) throw denialError;
    }

    // Run even for duplicate events: a previous ERP delivery may have failed.
    const erpWebhookUrl = process.env.ERP_ORDER_WEBHOOK_URL?.trim();
    if (!centrallyHandled && erpWebhookUrl && ["PAGO", "CANCELADO"].includes(localStatus(gatewayStatus))) {
      const erpResponse = await fetch(erpWebhookUrl, {
        method: "POST", headers: { Authorization: `Bearer ${process.env.ERP_ORDER_SYNC_SECRET?.trim() || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }), cache: "no-store", signal: AbortSignal.timeout(60_000),
      });
      if (!erpResponse.ok) {
        const erpError = await erpResponse.json().catch(() => null);
        console.error("[webhook/asaas] Falha na entrega ao ERP", {
          eventId, orderId, erpStatus: erpResponse.status,
          error: typeof erpError?.error === "string" ? erpError.error : "Resposta sem erro JSON",
        });
        return NextResponse.json({
          error: "Pagamento atualizado; sincronização ERP pendente.",
          erpStatus: erpResponse.status,
        }, { status: 502 });
      }
    }

    const {error:processedError}=await supabaseAdmin.from('checkout_gateway_event').update({processed_at:new Date().toISOString()}).eq('event_id',eventId);
    if(processedError)throw processedError;
    return NextResponse.json({
      received: true,
      result,
      orderId,
      status: gatewayStatus,
    });
  } catch (error) {
    console.error("[webhook/asaas] Exceção:", error);
    return NextResponse.json({ error: "Falha ao consultar ou processar cobrança" }, { status: 500 });
  }
}
