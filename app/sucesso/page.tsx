"use client";

import React, { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Package, Home, RefreshCw } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { supabase } from "@/lib/supabase";

function SucessoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: number;
    status: string;
    isPaid: boolean;
    isPending: boolean;
    isCancelled: boolean;
    total: number;
    paymentMethod: string;
  } | null>(null);

  const [hasOpener, setHasOpener] = useState(false);
  const clearedRef = useRef(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
      }

      const res = await fetch(`/api/pedidos/status?orderId=${encodeURIComponent(orderId)}`, {
        credentials: "include",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setOrderInfo(data);

        // Somente se realmente confirmado pelo backend/webhook
        if (data.isPaid) {
          if (!clearedRef.current) {
            clearedRef.current = true;
            clearCart();
          }

          if (typeof window !== "undefined" && window.opener) {
            setHasOpener(true);
            window.opener.postMessage("order_paid", window.location.origin);
          }
        }
      }
    } catch (err) {
      console.error("[sucesso] Erro ao consultar status do pedido:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, clearCart]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Polling automático enquanto pendente (aguarda processamento do Pix/cartão)
  useEffect(() => {
    if (!orderId || !orderInfo || orderInfo.isPaid || orderInfo.isCancelled) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, orderInfo, checkStatus]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto">
      {loading ? (
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Consultando Status do Pedido...</h1>
          <p className="text-xs text-muted-foreground">Aguarde enquanto verificamos o processamento da transação.</p>
        </div>
      ) : orderInfo?.isPaid ? (
        <div className="space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Pagamento Confirmado!
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Seu pedido <strong className="text-foreground">#{orderInfo.orderId}</strong> no valor de{" "}
              <strong className="text-foreground">{formatCurrency(orderInfo.total)}</strong> foi confirmado. Nossa equipe técnica já iniciou a separação e preparação da carga.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/pedidos">
              <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 bg-primary text-white">
                <Package className="w-4 h-4" />
                <span>Ver Meus Pedidos</span>
              </Button>
            </Link>
            <Link href="/produtos">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium gap-2">
                <Home className="w-4 h-4" />
                <span>Continuar Comprando</span>
              </Button>
            </Link>
          </div>

          {hasOpener && (
            <p className="text-xs text-muted-foreground animate-pulse pt-2">
              A janela anterior foi atualizada automaticamente.
            </p>
          )}
        </div>
      ) : orderInfo?.isCancelled ? (
        <div className="space-y-5">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Pagamento Não Concluído
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A transação do pedido <strong className="text-foreground">#{orderInfo.orderId}</strong> foi cancelada ou não autorizada pela operadora.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/carrinho">
              <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 bg-primary text-white">
                <span>Revisar Carrinho</span>
              </Button>
            </Link>
            <Link href="/fale-conosco">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                <span>Falar com o Suporte</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Estado Pendente / Aguardando Compensação */
        <div className="space-y-5">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mx-auto border border-amber-500/30">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Pedido Recebido!
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {orderInfo?.orderId ? (
                <>
                  Seu pedido <strong className="text-foreground">#{orderInfo.orderId}</strong> foi registrado em nosso sistema.
                </>
              ) : (
                "Seu pedido foi registrado em nosso sistema."
              )}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto pt-1">
              Estamos aguardando a confirmação do pagamento pela instituição financeira. Se pagou por Pix ou Boleto, a aprovação é atualizada automaticamente assim que o banco nos notificar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => checkStatus()}
              className="w-full sm:w-auto font-medium gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verificar Novamente</span>
            </Button>
            <Link href="/pedidos">
              <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 bg-primary text-white">
                <Package className="w-4 h-4" />
                <span>Acompanhar Meus Pedidos</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <SucessoContent />
    </Suspense>
  );
}
