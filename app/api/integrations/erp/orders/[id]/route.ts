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

  const value = parsed.data;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { updatedat: now };
  if (value.deliveryStatus !== undefined) payload.status_entrega = value.deliveryStatus;
  if (value.trackingCode !== undefined) payload.codigo_rastreio = value.trackingCode || null;
  if (value.carrier !== undefined) payload.transportadora = value.carrier || null;
  if (value.trackingUrl !== undefined) payload.url_rastreio = value.trackingUrl || null;
  if (value.deliveryStatus === "ENVIADO") payload.enviado_em = now;
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
    .select("id, status_entrega, codigo_rastreio, nfe_numero, nfe_chave_acesso")
    .maybeSingle();

  if (error) {
    console.error("[erp/orders/:id] Falha ao atualizar pedido:", error);
    return NextResponse.json({ error: "ERRO_AO_ATUALIZAR_PEDIDO" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "PEDIDO_NAO_ENCONTRADO" }, { status: 404 });
  return NextResponse.json({ ok: true, data });
}
