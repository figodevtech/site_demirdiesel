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
      "REFUND_REQUESTED",
      "CHARGEBACK_REQUESTED",
      "CHARGEBACK_DISPUTE",
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

    // O payload identifica o recurso, mas o estado financeiro é relido na API oficial.
    const payment = await getAsaasPayment(paymentId);
    const orderId = Number(payment.externalReference);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      console.warn("[webhook/asaas] Cobrança sem pedido local válido:", paymentId);
      return NextResponse.json({ received: true, ignored: true });
    }

    const gatewayStatus = String(payment.status || "PENDING").trim().toUpperCase();
    const { data: result, error } = await supabaseAdmin.rpc(
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
