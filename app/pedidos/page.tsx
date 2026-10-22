"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Calendar,
  ChevronDown,
  ArrowLeft,
  Truck,
  Copy,
  CheckCircle2,
  Circle,
  FileText,
  Home,
  Store,
  Boxes,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isOrderPaid, isOrderAuthorized, isOrderCancelled } from "@/lib/order-status";

interface OrderProduct {
  titulo: string | null;
  tituloMarketplace: string | null;
  fabricante: string | null;
}

interface OrderItem {
  id: number;
  venda_id: number;
  quantidade: number;
  valor_total: number;
  produto: OrderProduct | null;
}

interface CustomerOrder {
  id: number;
  status: string | null;
  datavenda: string | null;
  createdat: string | null;
  valortotal: number | null;
  codigo_rastreio: string | null;
  status_entrega: "SEPARACAO" | "FATURADO" | "ENVIADO" | "ENTREGUE" | null;
  transportadora: string | null;
  url_rastreio: string | null;
  nfe_numero: string | null;
  nfe_serie: string | null;
  nfe_chave_acesso: string | null;
  danfe_url: string | null;
  separacao_em: string | null;
  faturado_em: string | null;
  enviado_em: string | null;
  entregue_em: string | null;
  endereco_entrega_snapshot: {
    deliveryMethod?: "delivery" | "pickup" | string | null;
    deliveryLabel?: string | null;
    pickupAddress?: string | null;
  } | null;
  items: OrderItem[];
}

const fulfillmentRank = {
  SEPARACAO: 1,
  FATURADO: 2,
  ENVIADO: 3,
  ENTREGUE: 4,
} as const;

function formatEventDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderTimeline({ order }: { order: CustomerOrder }) {
  const currentRank = order.status_entrega ? fulfillmentRank[order.status_entrega] : 1;
  const pickup = order.endereco_entrega_snapshot?.deliveryMethod === "pickup";
  const steps = [
    { label: "Pagamento aprovado", detail: "Compra confirmada", rank: 0, icon: CheckCircle2, date: order.datavenda || order.createdat },
    { label: "Em separação", detail: "Preparando os produtos", rank: 1, icon: Boxes, date: order.separacao_em },
    { label: "Nota fiscal", detail: "NF-e emitida", rank: 2, icon: FileText, date: order.faturado_em },
    { label: pickup ? "Pronto para retirada" : "Enviado", detail: pickup ? "Aguardando retirada na loja" : "Pedido em transporte", rank: 3, icon: pickup ? Store : Truck, date: order.enviado_em },
    { label: pickup ? "Retirado" : "Entregue", detail: pickup ? "Retirada concluída" : "Entrega concluída", rank: 4, icon: Home, date: order.entregue_em },
  ];

  return (
    <section className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Acompanhamento do pedido
      </h4>
      <div className="grid gap-3 sm:grid-cols-5 sm:gap-2">
        {steps.map((step, index) => {
          const complete = currentRank >= step.rank;
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              {index > 0 && (
                <span className={`absolute right-[calc(50%+1rem)] top-4 hidden h-0.5 w-[calc(100%-2rem)] sm:block ${complete ? "bg-primary" : "bg-border"}`} />
              )}
              <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {complete ? <Icon className="size-4" /> : <Circle className="size-3" />}
              </span>
              <span>
                <span className={`block text-xs font-bold ${complete ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                <span className="block text-[10px] leading-relaxed text-muted-foreground">
                  {formatEventDate(step.date) || step.detail}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function PedidosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const fetchOrders = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: sales, error } = await supabase
        .from("venda")
        .select("*")
        .eq("clienteid", profile.id)
        .eq("status", "PAGO")
        .eq("canal", "ONLINE")
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

      const itemsBySale: Record<number, OrderItem[]> = {};
      ((itemsData || []) as unknown as OrderItem[]).forEach((item) => {
        if (!itemsBySale[item.venda_id]) itemsBySale[item.venda_id] = [];
        itemsBySale[item.venda_id].push(item);
      });

      const fullOrders = sales.map((sale) => ({
        ...sale,
        items: itemsBySale[sale.id] || [],
      }));

      setOrders(fullOrders as CustomerOrder[]);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar seus pedidos.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/pedidos");
    } else if (profile?.id) {
      const timer = window.setTimeout(() => { void fetchOrders(); }, 0);
      return () => window.clearTimeout(timer);
    } else {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, fetchOrders, profile?.id, router, user]);

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código de rastreio copiado!");
  };

  const getStatusBadge = (status: string | null) => {
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
    <AccountShell>
      <AccountSectionHeader
        icon={Package}
        title="Meus pedidos"
        description="Acompanhe suas compras, pagamentos e entregas."
        action={
          <Button asChild variant="outline" className="h-10 w-full gap-2 sm:w-auto">
            <Link href="/produtos"><ArrowLeft className="size-4" />Voltar à loja</Link>
          </Button>
        }
      />

      {loading || authLoading ? (
        <ListSkeleton rows={3} />
      ) : orders.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-border/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhum pedido encontrado</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Seus pedidos aparecerão aqui depois que o pagamento for confirmado.
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
                <Button type="button" variant="ghost"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="h-auto w-full whitespace-normal text-left p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/50 active:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors"
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

                    <span
                      aria-hidden="true"
                      className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                    >
                      <ChevronDown className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </span>
                  </div>
                </Button>

                {/* Detalhes Expansíveis dos Itens */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border/60 bg-slate-50/30 dark:bg-slate-900/30 space-y-4 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    {isOrderPaid(order.status) ? <OrderTimeline order={order} /> : <p className="text-sm text-muted-foreground">{isOrderCancelled(order.status) ? "Este pedido foi cancelado." : "Aguardando confirmação do pagamento."}</p>}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Itens do Pedido ({order.items.length})
                      </h4>

                      <div className="divide-y divide-border/50 text-xs">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground truncate block">
                                {item.produto?.tituloMarketplace || item.produto?.titulo || "Produto"}
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

                    {order.endereco_entrega_snapshot?.deliveryMethod === "pickup" ? (
                      <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-4 text-xs shadow-sm ring-1 ring-primary/15">
                        <Store className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          <strong className="block text-foreground">Retirada no local</strong>
                          <span className="text-muted-foreground">
                            {order.endereco_entrega_snapshot.pickupAddress || "Aguarde a confirmação de que o pedido está pronto para retirada."}
                          </span>
                        </span>
                      </div>
                    ) : null}

                    {/* Snapshot de Entrega e Rastreamento */}
                    <div className="grid gap-3 md:grid-cols-2">
                      {order.nfe_numero || order.nfe_chave_acesso ? (
                        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                            <FileText className="size-4 text-primary" /> Nota fiscal eletrônica
                          </div>
                          <p className="text-xs text-muted-foreground">
                            NF-e {order.nfe_numero || "—"}{order.nfe_serie ? ` · série ${order.nfe_serie}` : ""}
                          </p>
                          {order.nfe_chave_acesso && (
                            <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                              Chave: {order.nfe_chave_acesso}
                            </p>
                          )}
                          {order.danfe_url && (
                            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-xs">
                              <a href={order.danfe_url} target="_blank" rel="noreferrer">
                                Abrir DANFE <ExternalLink className="ml-1 size-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : null}

                      {order.codigo_rastreio && (
                        <div className="rounded-xl bg-emerald-50 p-4 text-xs shadow-sm ring-1 ring-emerald-600/20 dark:bg-emerald-950/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Truck className="mt-0.5 size-4 text-emerald-600" />
                              <span className="text-emerald-900 dark:text-emerald-300">
                                {order.transportadora && <span className="block">{order.transportadora}</span>}
                                Código: <strong>{order.codigo_rastreio}</strong>
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTracking(order.codigo_rastreio!)}
                              className="h-7 text-xs text-emerald-700 hover:bg-emerald-100"
                            >
                              <Copy className="mr-1 size-3.5" /> Copiar
                            </Button>
                          </div>
                          {order.url_rastreio && (
                            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-xs text-emerald-700">
                              <a href={order.url_rastreio} target="_blank" rel="noreferrer">
                                Acompanhar entrega <ExternalLink className="ml-1 size-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
