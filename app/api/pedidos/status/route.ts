import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  isOrderPaid,
  isOrderAuthorized,
  isOrderPending,
  isOrderCancelled,
} from "@/lib/order-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Autentica o usuário no servidor (cookies ou Bearer token)
 */
async function getAuthenticatedUser(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
  } catch {
    // Silencioso para fallback
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) return user;
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    // 1. AUTENTICAR NO SERVIDOR (Prioridade 2)
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "NAO_AUTENTICADO", message: "Faça login para consultar o status do pedido." },
        { status: 401 }
      );
    }

    // 2. OBTER CLIENTE PELO AUTH.UID()
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from("cliente")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: "PERFIL_NAO_ENCONTRADO", message: "Perfil de cliente não encontrado." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");

    if (!orderIdParam) {
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
    }

    const orderId = Number(orderIdParam);
    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "orderId inválido" }, { status: 400 });
    }

    // 3. BUSCAR VENDA GARANTINDO OWNERSHIP ESTRITO
    // venda.id = orderId AND venda.clienteid = cliente.id
    const { data: order, error } = await supabaseAdmin
      .from("venda")
      .select("id, status, valortotal, forma_pagamento, datavenda, createdat")
      .eq("id", orderId)
      .eq("clienteid", cliente.id)
      .maybeSingle();

    if (error || !order) {
      // Se não pertencer ao usuário: 404, nunca retornar dados da venda
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const normalizedStatus = String(order.status || "").trim().toUpperCase();
    const isPaid = isOrderPaid(normalizedStatus);
    const isAuthorized = isOrderAuthorized(normalizedStatus);
    const isPending = isOrderPending(normalizedStatus);
    const isCancelled = isOrderCancelled(normalizedStatus);

    // Retornar apenas informações necessárias
    return NextResponse.json({
      orderId: order.id,
      status: normalizedStatus,
      isPaid,
      isAuthorized,
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
