"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Truck,
  Copy,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isOrderPaid, isOrderAuthorized, isOrderCancelled } from "@/lib/order-status";

export default function PedidosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/pedidos");
      } else if (profile?.id) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  const fetchOrders = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: sales, error } = await supabase
        .from("venda")
        .select("*")
        .eq("clienteid", profile.id)
        .order("datavenda", { ascending: false, nullsFirst: false })
        .order("createdat", { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!sales || sales.length === 0) {
        setOrders([]);
        return;
      }

      // Busca os itens de cada venda
      const saleIds = sales.map((s) => s.id);
      const { data: itemsData } = await supabase
        .from("vendaproduto")
        .select(`
          id,
          venda_id,
          produtoid,
          quantidade,
          valor_total,
          produto (
            id,
            titulo,
            tituloMarketplace,
            fabricante,
            imgUrl
          )
        `)
        .in("venda_id", saleIds);

      const itemsBySale: Record<number, any[]> = {};
      (itemsData || []).forEach((item: any) => {
        if (!itemsBySale[item.venda_id]) itemsBySale[item.venda_id] = [];
        itemsBySale[item.venda_id].push(item);
      });

      const fullOrders = sales.map((sale) => ({
        ...sale,
        items: itemsBySale[sale.id] || [],
      }));

      setOrders(fullOrders);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar seus pedidos.");
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código de rastreio copiado!");
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (isOrderPaid(s)) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
          PAGO
        </Badge>
      );
    }
    if (isOrderAuthorized(s)) {
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
          AUTORIZADO
        </Badge>
      );
    }
    if (isOrderCancelled(s)) {
      return (
        <Badge variant="destructive" className="text-[10px] font-bold">
          CANCELADO
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
        PENDENTE
      </Badge>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 pb-8 pt-3 md:pb-10 md:pt-5">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <Package className="w-7 h-7 text-primary" />
            <span>Meus Pedidos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Histórico completo de compras e status de envio
          </p>
        </div>

        <Link
          href="/produtos"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar à Loja</span>
        </Link>
      </div>

      {loading || authLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Carregando seus pedidos...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-border/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhum pedido encontrado</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Você ainda não realizou compras em nossa plataforma.
          </p>
          <Button asChild className="rounded-xl px-6 font-semibold text-xs h-9">
            <Link href="/produtos">Explorar Catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const dateStr = order.datavenda || order.createdat;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl bg-card shadow-lg shadow-slate-900/8 transition-all dark:shadow-black/25"
              >
                {/* Header do Card de Pedido */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      #{order.id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          Pedido #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Valor Total</span>
                      <span className="font-black text-sm sm:text-base text-foreground block">
                        {formatCurrency(Number(order.valortotal) || 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes Expansíveis dos Itens */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border/60 bg-slate-50/30 dark:bg-slate-900/30 space-y-4 animate-in fade-in-50 duration-150">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Itens do Pedido ({order.items.length})
                      </h4>

                      <div className="divide-y divide-border/50 text-xs">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground truncate block">
                                {item.produto?.tituloMarketplace || item.produto?.titulo || "Componente Diesel"}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                {item.produto?.fabricante ? `Fabricante: ${item.produto.fabricante} • ` : ""}Qtd: {item.quantidade}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              {formatCurrency(Number(item.valor_total) || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Snapshot de Entrega e Rastreamento */}
                    {order.codigo_rastreio && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/20 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-900 dark:text-emerald-300">
                            Rastreamento: <strong>{order.codigo_rastreio}</strong>
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTracking(order.codigo_rastreio)}
                          className="h-7 text-xs text-emerald-700 hover:bg-emerald-100"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
