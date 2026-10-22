import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreOrderRow = {
  id: number;
  status: string;
  central_inventory?: boolean;
  sub_total: number;
  valortotal: number;
  forma_pagamento?: string | null;
  endereco_entrega_snapshot?: Record<string, unknown> | null;
  payment_provider?: string | null;
  gateway_payment_id?: string | null;
  datavenda?: string | null;
  createdat?: string | null;
  status_entrega?: string | null;
  codigo_rastreio?: string | null;
  transportadora?: string | null;
  url_rastreio?: string | null;
  nfe_numero?: string | null;
  nfe_serie?: string | null;
  nfe_chave_acesso?: string | null;
  danfe_url?: string | null;
  separacao_em?: string | null;
  faturado_em?: string | null;
  enviado_em?: string | null;
  entregue_em?: string | null;
  cliente?: {
    id: number;
    tipopessoa: 'FISICA' | 'JURIDICA';
    cpfcnpj: string;
    nomerazaosocial: string;
    email: string;
    telefone: string;
  } | null;
  itens?: Array<{
    produtoid: number;
    quantidade: number;
    sub_total: number;
    valor_total: number;
    valor_desconto?: number | null;
    valor_frete?: number | null;
    produto?: { titulo?: string | null; referencia?: string | null } | null;
  }>;
};

function safeEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function isAuthorized(request: Request) {
  const expected = process.env.ERP_ORDER_SYNC_SECRET?.trim();
  const authorization = request.headers.get("authorization") || "";
  const received = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return Boolean(expected && received) && safeEqual(received, expected!);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
  }

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 50)));
  const orderId = Number(request.nextUrl.searchParams.get("orderId") || 0);
  let query = supabaseAdmin
    .from("venda")
    .select(`
      id, status, central_inventory, sub_total, valortotal, forma_pagamento, endereco_entrega_snapshot,
      canal, status_entrega, codigo_rastreio, transportadora, url_rastreio,
      nfe_numero, nfe_serie, nfe_chave_acesso, danfe_url,
      separacao_em, faturado_em, enviado_em, entregue_em,
      payment_provider, gateway_payment_id, datavenda, createdat,
      cliente:clienteid ( id, tipopessoa, cpfcnpj, nomerazaosocial, email, telefone ),
      itens:vendaproduto (
        produtoid, quantidade, sub_total, valor_total, valor_desconto, valor_frete,
        produto:produtoid ( id, titulo, referencia )
      )
    `)
    .eq("status", "PAGO")
    .eq("canal", "ONLINE")
    .order("datavenda", { ascending: true })
    .limit(limit);
  if(orderId) {
    if(!Number.isSafeInteger(orderId) || orderId <= 0) return NextResponse.json({error:"PEDIDO_INVALIDO"},{status:400});
    query = query.eq("id",orderId);
  }
  const {data,error} = await query;

  if (error) {
    console.error("[erp/orders] Falha ao listar pedidos pagos:", error);
    return NextResponse.json({ error: "ERRO_AO_LISTAR_PEDIDOS" }, { status: 500 });
  }

  const orders = ((data ?? []) as unknown as StoreOrderRow[]).map((order) => ({
    id: Number(order.id),
    status: order.status,
    centralInventory: Boolean(order.central_inventory),
    subtotal: Number(order.sub_total || 0),
    total: Number(order.valortotal || 0),
    paymentMethod: order.forma_pagamento || "Asaas",
    paymentProvider: order.payment_provider || "ASAAS",
    gatewayPaymentId: order.gateway_payment_id || null,
    createdAt: order.datavenda || order.createdat,
    shippingAddress: order.endereco_entrega_snapshot || {},
    fulfillment: {
      status: order.status_entrega || null,
      trackingCode: order.codigo_rastreio || null,
      carrier: order.transportadora || null,
      trackingUrl: order.url_rastreio || null,
      invoice: {
        number: order.nfe_numero || null,
        series: order.nfe_serie || null,
        accessKey: order.nfe_chave_acesso || null,
        danfeUrl: order.danfe_url || null,
      },
      separationAt: order.separacao_em || null,
      invoicedAt: order.faturado_em || null,
      shippedAt: order.enviado_em || null,
      deliveredAt: order.entregue_em || null,
    },
    customer: {
      id: Number(order.cliente?.id || 0),
      type: order.cliente?.tipopessoa,
      document: order.cliente?.cpfcnpj,
      name: order.cliente?.nomerazaosocial,
      email: order.cliente?.email,
      phone: order.cliente?.telefone,
    },
    items: (order.itens ?? []).map((item) => ({
      produtoId: Number(item.produtoid),
      quantidade: Number(item.quantidade),
      subTotal: Number(item.sub_total || 0),
      valorTotal: Number(item.valor_total || 0),
      valorDesconto: Number(item.valor_desconto || 0),
      valorFrete: Number(item.valor_frete || 0),
      baixarEstoque: true,
      title: item.produto?.titulo || null,
      reference: item.produto?.referencia || null,
    })),
  }));

  return NextResponse.json({ data: orders, count: orders.length });
}
