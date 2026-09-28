"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useCart } from "@/components/providers/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  MapPin,
  Plus,
  Truck,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isOrderPaid, isOrderAuthorized } from "@/lib/order-status";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CheckoutPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  // Endereço
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Pedido e Frete
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  // Pagamento
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");
  const clearedRef = useRef(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Autenticação inicial
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/checkout");
      } else if (profile?.id) {
        fetchAddresses();
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  const calculateShipping = async (cepValue: string) => {
    if (!cepValue) return;
    setCalculatingShipping(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setShippingPrice(0);
    setCalculatingShipping(false);
  };

  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) calculateShipping(addr.cep);
    }
  }, [selectedAddressId, addresses]);

  const fetchAddresses = async () => {
    if (!profile?.id) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from("cliente_endereco")
        .select("*")
        .eq("cliente_id", profile.id)
        .order("id", { ascending: true });

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar endereços.");
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length >= 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setLogradouro(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      toast.warning("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    setSavingAddress(true);
    try {
      const addressData = {
        cliente_id: profile.id,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      const { data, error } = await supabase
        .from("cliente_endereco")
        .insert(addressData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Endereço adicionado com sucesso!");
      setIsAddressDialogOpen(false);
      await fetchAddresses();
      setSelectedAddressId(data.id);

      setCep("");
      setLogradouro("");
      setNumero("");
      setComplemento("");
      setBairro("");
      setCidade("");
      setEstado("");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar endereço.");
    } finally {
      setSavingAddress(false);
    }
  };

  const checkOrderStatus = useCallback(async () => {
    if (!currentOrderId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
      }

      const res = await fetch(`/api/pedidos/status?orderId=${encodeURIComponent(currentOrderId)}`, {
        credentials: "include",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isPaid) {
          setPaymentStatus("paid");
          if (!clearedRef.current) {
            clearedRef.current = true;
            clearCart();
          }
        }
      }
    } catch (err) {
      console.error("Polling order error:", err);
    }
  }, [currentOrderId, clearCart]);

  // Tempo real via Supabase
  useEffect(() => {
    if (!currentOrderId || !isWaitingPayment || paymentStatus === "paid") return;
    const channel = supabase
      .channel(`order_status_${currentOrderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "venda", filter: `id=eq.${currentOrderId}` },
        (payload) => {
          const newStatus = payload.new.status?.toUpperCase();
          if (isOrderPaid(newStatus)) {
            setPaymentStatus("paid");
            if (!clearedRef.current) {
              clearedRef.current = true;
              clearCart();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrderId, isWaitingPayment, paymentStatus, clearCart]);

  // Mensagem enviada pelo popup com validação estrita de origem (Regra 14)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof window !== "undefined" && event.origin !== window.location.origin) {
        return;
      }
      if (event.data === "order_paid") {
        // Dispara re-consulta oficial ao backend em vez de confiar cegamente na mensagem do popup
        checkOrderStatus();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [checkOrderStatus]);

  // Polling automático
  useEffect(() => {
    if (!isWaitingPayment || !currentOrderId || paymentStatus === "paid") return;
    const id = setInterval(() => {
      checkOrderStatus();
    }, 4000);
    return () => clearInterval(id);
  }, [isWaitingPayment, currentOrderId, paymentStatus, checkOrderStatus]);

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Selecione um endereço de entrega.");
      return;
    }

    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Envia somente addressId e lista sanitizada de IDs e quantidades (Regra 1)
      const checkoutData = {
        addressId: selectedAddressId,
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "Erro ao processar checkout");
      }

      if (result.url) {
        setPaymentUrl(result.url);
        setIsWaitingPayment(true);
        if (result.orderId) {
          setCurrentOrderId(result.orderId);
        }

        // Abre em janela modal/popup amigável
        const width = 600;
        const height = 750;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          result.url,
          "PagarMeCheckout",
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
        );
      } else {
        throw new Error("URL de pagamento não retornada.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar o pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalTotal = subtotal;

  // Tela de Pagamento Aprovado
  if (paymentStatus === "paid") {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-8">
          Seu pedido #{currentOrderId} foi recebido com sucesso e já está sendo preparado pela equipe da Demir Diesel.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="rounded-xl font-semibold">
            <Link href="/pedidos">Ver Meus Pedidos</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/">Voltar à Página Inicial</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* Top Header Seguro */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-foreground"
            aria-label="Voltar ao carrinho"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Checkout Seguro</span>
            </h1>
            <span className="text-[11px] text-muted-foreground">Demir Diesel • Pagar.me</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-600/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Ambiente Criptografado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Endereço & Pagamento */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Endereço de Entrega */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h2 className="font-extrabold text-base text-foreground">Endereço de Entrega</h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddressDialogOpen(true)}
                className="text-xs h-8 rounded-lg gap-1 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Endereço</span>
              </Button>
            </div>

            {loadingAddresses ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Carregando seus endereços...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-border text-xs space-y-3">
                <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-muted-foreground">Você ainda não tem nenhum endereço cadastrado.</p>
                <Button
                  size="sm"
                  onClick={() => setIsAddressDialogOpen(true)}
                  className="rounded-lg text-xs"
                >
                  Cadastrar Endereço de Entrega
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-xs relative ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-2xs"
                          : "border-border/80 hover:border-slate-400 bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-foreground text-sm font-bold block">
                          {addr.logradouro}, {addr.numero}
                        </strong>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      {addr.complemento && (
                        <span className="text-muted-foreground block mt-0.5">{addr.complemento}</span>
                      )}

                      <span className="text-muted-foreground block mt-1">
                        {addr.bairro} • {addr.cidade} - {addr.estado}
                      </span>
                      <span className="font-mono text-slate-500 block mt-0.5">CEP: {addr.cep}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Aguardando Pagamento ou Gatilho */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h2 className="font-extrabold text-base text-foreground">
                Pagamento Integrado (PIX, Cartão de Crédito ou Boleto)
              </h2>
            </div>

            {isWaitingPayment && paymentUrl ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/30 space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Aguardando confirmação do pagamento...
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  A tela de pagamento do Pagar.me foi aberta em uma nova janela. Conclua o pagamento por PIX, Cartão ou Boleto.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(paymentUrl, "PagarMeCheckout")}
                    className="text-xs gap-1 rounded-xl"
                  >
                    <span>Reabrir Tela de Pagamento</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={checkOrderStatus}
                    className="text-xs rounded-xl"
                  >
                    Já realizei o pagamento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ao clicar em <strong>Prosseguir para Pagamento</strong>, você será direcionado ao ambiente seguro da Pagar.me para escolher entre PIX (aprovação imediata), Cartão de Crédito (em até 12x) ou Boleto Bancário.
                </p>

                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing || !selectedAddressId || items.length === 0}
                  className="w-full h-12 text-sm font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando Pedido...
                    </>
                  ) : (
                    <span>Prosseguir para Pagamento Seguro</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Resumo dos Itens e Valores */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-5 sticky top-24">
            <h2 className="font-extrabold text-base text-foreground">Resumo da Compra</h2>

            {/* Lista compacta de itens */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 no-scrollbar divide-y divide-border/50 text-xs">
              {items.map((item) => (
                <div key={item.product.id} className="pt-2 first:pt-0 flex justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground truncate block">
                      {item.product.name || item.product.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Qtd: {item.quantity} × {formatCurrency(item.product.price)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="pt-4 border-t border-border/80 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal dos produtos</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span className="font-semibold text-primary">
                  A calcular (análise de carga)
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-border/60 text-base">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-black text-foreground">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar Novo Endereço */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Novo Endereço de Entrega</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className="text-xs">CEP*</Label>
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={handleCepBlur}
                maxLength={9}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Logradouro / Rua*</Label>
                <Input
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Número*</Label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Complemento</Label>
              <Input
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Galpão 3, Apto 101"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Bairro*</Label>
                <Input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade*</Label>
                <Input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Estado (UF)*</Label>
                <Input
                  value={estado}
                  maxLength={2}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddressDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAddress}
              disabled={savingAddress}
              className="text-xs rounded-xl font-semibold"
            >
              {savingAddress ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
