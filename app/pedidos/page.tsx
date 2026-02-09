"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Loader2, Package, Calendar, CheckCircle2, Check, Copy } from "lucide-react";

export default function PedidosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const copyText = async (value: string, label: string) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      // fallback simples
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    // sem toast aqui para manter o site leve (opcional adicionar depois)
    console.log(`${label} copiado.`);
  };

  const formatCarrier = (v: any) => {
    const s = String(v ?? "").trim().toUpperCase();
    if (!s) return "—";
    if (s === "CORREIOS") return "Correios";
    return s;
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile?.id) {
        fetchOrders();

        const channel = supabase
          .channel("schema-db-changes")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "venda",
              filter: `clienteid=eq.${profile.id}`,
            },
            () => fetchOrders(),
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  const fetchOrders = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("venda")
        .select("*")
        .eq("clienteid", profile.id)
        .order("createdat", { ascending: false });
      if (error) {
        console.error("Erro ao buscar pedidos:", JSON.stringify(error, null, 2));
        setOrders([]);
        return;
      }

      const { data: itemsData } = await supabase
        .from("vendaproduto")
        .select(
          `
                    *,
                    produto (
                        tituloMarketplace,
                        imgUrl,
                        precovenda
                    )
                `,
        )
        .in("venda_id", data?.map((o) => o.id) || []);

      const ordersWithItems =
        data?.map((order) => ({
          ...order,
          items: itemsData?.filter((i) => i.venda_id === order.id) || [],
        })) || [];
      setOrders(ordersWithItems);
    } catch (err) {
      console.error("Erro inesperado ao buscar pedidos:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (order: any) => {
    const status = String(order?.status ?? "PENDENTE")
      .trim()
      .toUpperCase();
    const entrega = String(order?.status_entrega ?? "")
      .trim()
      .toUpperCase();

    const isCanceled = status === "CANCELADO" || status === "CANCELADA";
    if (isCanceled) return { color: "bg-red-600", label: "Cancelado", step: -1 };

    const isPaid = status === "PAGO" || status === "FINALIZADA";
    const isAuthorized = status === "AUTORIZADO";

    // Fluxo de acompanhamento (5 etapas):
    // 0 Recebido -> 1 Pago -> 2 Separação -> 3 Enviado -> 4 Entregue
    if (!isPaid) {
      if (isAuthorized) return { color: "bg-blue-600", label: "Pagamento Autorizado", step: 0 };
      return { color: "bg-yellow-500", label: "Aguardando Pagamento", step: 0 };
    }

    // Pago, agora acompanha entrega conforme status_entrega
    if (entrega === "ENTREGUE") return { color: "bg-emerald-600", label: "Entregue", step: 4 };
    if (entrega === "ENVIO") return { color: "bg-indigo-600", label: "Enviado", step: 3 };
    if (entrega === "SEPARACAO") return { color: "bg-sky-600", label: "Em separação", step: 2 };

    // Pago, mas entrega ainda não iniciada
    return { color: "bg-teal-600", label: "Pagamento Confirmado", step: 1 };
  };

  const ReadonlyCopyField = ({
    value,
    placeholder,
    copyLabel,
  }: {
    value: string | null | undefined;
    placeholder?: string;
    copyLabel: string;
  }) => {
    const v = String(value ?? "").trim();
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }, []);

    return (
      <div className="flex items-center gap-2">
        <Input
          value={v}
          readOnly
          placeholder={placeholder}
          className="font-mono text-xs sm:text-sm h-9 bg-white/60"
        />
        <Button
          type="button"
          variant="outline"
          className={[
            "h-9 px-3 text-xs transition-all",
            copied ? "bg-emerald-600 text-white border-emerald-600 scale-[1.02]" : "bg-transparent",
          ].join(" ")}
          disabled={!v}
          onClick={async () => {
            await copyText(v, copyLabel);
            setCopied(true);
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 animate-in zoom-in-50 duration-150" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Package className="text-primary" /> Meus Pedidos
      </h1>

      {(loading || authLoading) && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
          <p className="text-muted-foreground animate-pulse">Sincronizando seus pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/5 flex flex-col items-center">
          <Package size={48} className="mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
          <p className="max-w-xs mx-auto mt-2">Você ainda não fez nenhuma compra conosco. Aproveite nossas ofertas!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
          const statusInfo = getStatusInfo(order);
          const isExpanded = selectedOrderId === order.id;

            return (
              <Card
                key={order.id}
                className={`overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-primary shadow-xl scale-[1.01]" : "hover:border-primary/50"}`}
              >
                <div className="bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-4 border-b">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Pedido #{order.id}</p>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Calendar size={14} />
                      {new Date(order.datavenda || order.createdat).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          order.valortotal || 0,
                        )}
                      </p>
                    </div>
                    <Badge className={`${statusInfo.color} text-white px-3 py-1`}>{statusInfo.label}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      {isExpanded ? "Ver Menos" : "Ver Detalhes"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                        Acompanhamento do Pedido
                      </h4>
                      <div className="relative flex justify-between max-w-2xl mx-auto">
                        <div className="absolute top-4 left-0 right-0 h-1 bg-muted -z-0">
                          <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${Math.max(0, (statusInfo.step / 4) * 100)}%` }}
                          ></div>
                        </div>
                        {["Recebido", "Pago", "Separação", "Enviado", "Entregue"].map((label, idx) => {
                          const isActive = idx <= statusInfo.step;
                          return (
                            <div key={label} className="flex flex-col items-center gap-2 z-10">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${isActive ? "bg-primary border-primary-foreground text-white" : "bg-muted border-white text-muted-foreground"}`}
                              >
                                {idx < statusInfo.step ? (
                                  <CheckCircle2 size={18} />
                                ) : (
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-secondary flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-primary" /> Itens do Pedido
                        </h4>
                        <div className="border rounded-lg bg-muted/5 divide-y">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="p-3 flex items-center gap-3">
                              <div className="w-12 h-12 rounded bg-white border flex items-center justify-center overflow-hidden shrink-0">
                                {item.produto?.imgUrl ? (
                                  <img src={item.produto.imgUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="text-muted-foreground/30" size={20} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                  {item.produto?.tituloMarketplace || "Produto"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantidade}x{" "}
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                    (item.valor_total || 0) / Math.max(item.quantidade || 1, 1),
                                  )}
                                </p>
                              </div>
                              <p className="text-sm font-bold">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                  item.valor_total || 0,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-secondary">Informações de Entrega</h4>
                          <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-dashed">
                            {order.endereco_entrega_snapshot ? (
                              <div className="space-y-1">
                                <p className="font-bold text-foreground">
                                  {order.endereco_entrega_snapshot.logradouro}, {order.endereco_entrega_snapshot.numero}
                                </p>
                                <p>
                                  {order.endereco_entrega_snapshot.bairro} - {order.endereco_entrega_snapshot.cidade}/
                                  {order.endereco_entrega_snapshot.estado}
                                </p>
                                <p>CEP: {order.endereco_entrega_snapshot.cep}</p>
                              </div>
                            ) : (
                              <p>Endereço não disponível</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-secondary">Rastreamento</h4>
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            {order.codigo_rastreio ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                    Código de rastreio
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Transportadora:{" "}
                                    <span className="font-semibold text-foreground">
                                      {formatCarrier(order.transportadora_rastreio)}
                                    </span>
                                  </p>
                                </div>
                                <ReadonlyCopyField
                                  value={order.codigo_rastreio}
                                  copyLabel="Código de rastreio"
                                  placeholder="Sem código"
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                {statusInfo.step >= 3
                                  ? "O código de rastreio será disponibilizado em breve."
                                  : "Aguardando envio para gerar código de rastreio."}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-secondary">Nota fiscal</h4>
                          <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-dashed">
                            {order.danfe_url ? (
                              <div className="space-y-2">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-primary text-xs justify-start"
                                  onClick={() => window.open(order.danfe_url, "_blank")}
                                >
                                  Abrir DANFE
                                </Button>
                                {order.nfe_chave_acesso ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-foreground">Chave NF-e</p>
                                    <ReadonlyCopyField value={order.nfe_chave_acesso} copyLabel="Chave NF-e" placeholder="—" />
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Nota fiscal ainda não disponível.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
