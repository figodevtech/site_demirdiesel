import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");

    if (!orderIdParam) {
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
    }

    const orderId = Number(orderIdParam);
    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId inválido" }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("venda")
      .select("id, status, valortotal, forma_pagamento, datavenda, createdat")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const normalizedStatus = String(order.status || "").trim().toUpperCase();
    const isPaid = normalizedStatus === "PAGO" || normalizedStatus === "AUTORIZADO" || normalizedStatus === "FINALIZADA";
    const isPending = normalizedStatus === "PENDENTE" || normalizedStatus === "PAGAMENTO" || normalizedStatus === "ORCAMENTO";
    const isCancelled = normalizedStatus === "CANCELADO" || normalizedStatus === "FALHA";

    return NextResponse.json({
      orderId: order.id,
      status: normalizedStatus,
      isPaid,
      isPending,
      isCancelled,
      total: Number(order.valortotal) || 0,
      paymentMethod: order.forma_pagamento || "Pagar.me",
      date: order.datavenda || order.createdat,
    });
  } catch (err: any) {
    console.error("[api/pedidos/status] Erro:", err);
    return NextResponse.json({ error: "Erro interno ao consultar status" }, { status: 500 });
  }
}
