"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useCart } from "@/components/providers/CartContext";
import { Button } from "@/components/ui/button";
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
  Store,
  Info,
  QrCode,
  CreditCard,
  Barcode,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isOrderPaid } from "@/lib/order-status";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isPickupEligible, type DeliveryMethod } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";
import { isStandaloneDisplayMode } from "@/lib/pwa/display-mode";
import { motion } from "motion/react";
import { useVirtualKeyboardOpen } from "@/hooks/use-virtual-keyboard";
import { cepDigits, formatCep, mobileInput } from "@/lib/forms/mobile-inputs";
import { haptic } from "@/lib/haptics";
import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_METHOD_LABELS,
  type AsaasBillingType,
} from "@/lib/payment-methods";

const PAYMENT_OPTIONS: Array<{
  value: AsaasBillingType;
  description: string;
  detail: string;
  icon: typeof QrCode;
  badge?: string;
}> = [
  {
    value: "PIX",
    description: "Aprova\u00e7\u00e3o em poucos segundos",
    detail: "Pague pelo aplicativo do seu banco.",
    icon: QrCode,
    badge: "Mais r\u00e1pido",
  },
  {
    value: "CREDIT_CARD",
    description: "Pagamento protegido pelo Asaas",
    detail: "Informe os dados do cart\u00e3o no ambiente seguro.",
    icon: CreditCard,
  },
  {
    value: "BOLETO",
    description: "Vencimento em at\u00e9 3 dias",
    detail: "A compensa\u00e7\u00e3o pode levar at\u00e9 3 dias \u00fateis.",
    icon: Barcode,
  },
];

interface CustomerAddress {
  id: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}

interface SavedCard {
  id: string;
  brand: string;
  lastFour: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  // Endereço
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
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
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");

  // Pagamento
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");
  const [paymentMethod, setPaymentMethod] = useState<AsaasBillingType>("PIX");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState("new");
  const clearedRef = useRef(false);
  const numeroInputRef = useRef<HTMLInputElement>(null);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const isKeyboardOpen = useVirtualKeyboardOpen();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const fetchAddresses = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from("cliente_endereco")
        .select("*")
        .eq("cliente_id", profile.id)
        .order("id", { ascending: true });

      if (error) throw error;
      const nextAddresses = (data || []) as CustomerAddress[];
      setAddresses(nextAddresses);
      if (nextAddresses.length > 0) {
        setSelectedAddressId((current) => current ?? nextAddresses[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar endereços.");
    } finally {
      setLoadingAddresses(false);
    }
  }, [profile?.id]);

  const fetchSavedCards = useCallback(async () => {
    if (!user?.id) return;
    setLoadingCards(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch("/api/account/cards", {
        cache: "no-store",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Falha ao carregar cartões.");
      const cards = (result.cards || []) as SavedCard[];
      setSavedCards(cards);
      const preferred = cards.find((card) => card.isDefault) || cards[0];
      setSelectedSavedCardId(preferred?.id || "new");
    } catch (error) {
      console.error("Erro ao carregar cartões salvos:", error);
    } finally {
      setLoadingCards(false);
    }
  }, [user?.id]);

  // Autenticação inicial
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      router.replace("/login?redirect=/checkout");
      return;
    }
    if (profile?.id) {
      void fetchAddresses();
      void fetchSavedCards();
    }
  }, [user?.id, profile?.id, authLoading, router, fetchAddresses, fetchSavedCards]);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const pickupEligible = selectedAddress
    ? isPickupEligible({ city: selectedAddress.cidade, state: selectedAddress.estado })
    : false;

  const selectAddress = (address: CustomerAddress) => {
    if (address.id !== selectedAddressId) haptic("selection");
    setSelectedAddressId(address.id);
    if (!isPickupEligible({ city: address.cidade, state: address.estado })) {
      setDeliveryMethod("delivery");
    }
  };

  // Preenche o endereço assim que o CEP tem 8 dígitos e leva o foco para o "Número"
  // (único campo que o cliente ainda precisa digitar na maioria dos casos).
  const lookupCep = async (cleanCep: string) => {
    if (cleanCep.length !== 8) return;
    setIsLookingUpCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
        if (data.logradouro) numeroInputRef.current?.focus();
      } else {
        toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    if (cepDigits(formatted).length === 8 && cepDigits(cep).length !== 8) void lookupCep(cepDigits(formatted));
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

    const useSavedCard = paymentMethod === "CREDIT_CARD" && selectedSavedCardId !== "new";
    // No app instalado (PWA) popups são instáveis: o pagamento abre na própria janela e o
    // Asaas retorna para /sucesso (callback autoRedirect configurado em /api/checkout).
    const openInSameWindow = isStandaloneDisplayMode();
    const width = 600;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const paymentWindow = useSavedCard || openInSameWindow
      ? null
      : window.open(
          "",
          "AsaasCheckout",
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
        );

    setIsProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Envia somente addressId e lista sanitizada de IDs e quantidades (Regra 1)
      const checkoutData = {
        addressId: selectedAddressId,
        deliveryMethod,
        billingType: paymentMethod,
        savedCardId: useSavedCard ? selectedSavedCardId : undefined,
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

      if (result.url || result.directPayment) {
        setPaymentUrl(result.url || null);
        setIsWaitingPayment(true);
        if (result.orderId) {
          setCurrentOrderId(result.orderId);
        }

        if (result.url && paymentWindow) {
          paymentWindow.location.href = result.url;
        } else if (result.url) {
          window.location.assign(result.url);
        } else {
          void checkOrderStatus();
        }
      } else {
        paymentWindow?.close();
        throw new Error("URL de pagamento não retornada.");
      }
    } catch (err: unknown) {
      paymentWindow?.close();
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao processar o pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalTotal = subtotal;
  const canPay = !isProcessing && Boolean(selectedAddressId) && items.length > 0;
  const selectedPaymentOption =
    PAYMENT_OPTIONS.find((option) => option.value === paymentMethod) ?? PAYMENT_OPTIONS[0];

  // Tela de Pagamento Aprovado
  if (paymentStatus === "paid") {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          onAnimationStart={() => haptic("success")}
          className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-6 text-emerald-600"
        >
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-8">
          Seu pedido #{currentOrderId} foi recebido com sucesso e já está sendo preparado pela equipe da Demir Diesel.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="h-12 rounded-xl font-semibold">
            <Link href="/pedidos">Acompanhar meu pedido</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl">
            <Link href="/">Voltar à página inicial</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 pb-32 pt-3 md:pt-5 lg:pb-10">
      {/* Top Header Seguro */}
      <div className="mb-8 flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="size-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-foreground active:scale-95 transition-transform"
            aria-label="Voltar ao carrinho"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Checkout Seguro</span>
            </h1>
            <span className="text-[11px] text-muted-foreground">Demir Diesel • Asaas</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-600/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Ambiente Criptografado</span>
          <span className="sm:hidden">Seguro</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Endereço & Pagamento */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Endereço de Entrega */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
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
                className="text-xs h-10 rounded-xl gap-1 border-dashed px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Endereço</span>
              </Button>
            </div>

            {loadingAddresses ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy="true" aria-label="Carregando endereços">
                {[0, 1].map((index) => (
                  <div key={index} className="space-y-2 rounded-xl border-2 border-border/60 p-4">
                    <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                    <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                    <div className="skeleton-shimmer h-3 w-1/3 rounded" />
                  </div>
                ))}
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
                    <button
                      type="button"
                      key={addr.id}
                      onClick={() => selectAddress(addr)}
                      aria-pressed={isSelected}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer text-xs relative active:scale-[0.99] ${
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Forma de recebimento */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">Como você quer receber?</h2>
                <p className="text-xs text-muted-foreground">A disponibilidade considera o endereço selecionado.</p>
              </div>
            </div>

            <RadioGroup value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)} className="grid gap-3 sm:grid-cols-2">
              <Label htmlFor="delivery-method" className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${deliveryMethod === "delivery" ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/40"}`}>
                <RadioGroupItem id="delivery-method" value="delivery" className="mt-0.5" />
                <span className="grid gap-1">
                  <span className="flex items-center gap-2 text-sm font-bold"><Truck className="size-4 text-primary" /> Receber no endereço</span>
                  <span className="text-xs font-normal leading-relaxed text-muted-foreground">Frete e prazo confirmados após análise do pedido.</span>
                </span>
              </Label>

              <Label htmlFor="pickup-method" className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-colors ${pickupEligible ? "cursor-pointer" : "cursor-not-allowed opacity-55"} ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-border/80"}`}>
                <RadioGroupItem id="pickup-method" value="pickup" disabled={!pickupEligible} className="mt-0.5" />
                <span className="grid gap-1">
                  <span className="flex items-center gap-2 text-sm font-bold"><Store className="size-4 text-primary" /> Retirar na Demir Diesel</span>
                  <span className="text-xs font-normal leading-relaxed text-muted-foreground">Grátis, após a confirmação de que o pedido está pronto.</span>
                </span>
              </Label>
            </RadioGroup>

            {pickupEligible ? (
              <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span><strong className="text-foreground">Local de retirada:</strong> {siteConfig.address.full}</span>
              </div>
            ) : (
              <div className="flex gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>A retirada é liberada para endereços de João Pessoa, Bayeux, Cabedelo, Conde e Santa Rita.</span>
              </div>
            )}
          </div>

          {/* 3. Forma de pagamento */}
          <div className="space-y-4 rounded-2xl bg-card p-6 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                3
              </div>
              <div>
                <h2 className="font-extrabold text-base text-foreground">Forma de pagamento</h2>
                <p className="text-xs text-muted-foreground">
                  Escolha como deseja concluir sua compra no ambiente seguro do Asaas.
                </p>
              </div>
            </div>

            {isWaitingPayment ? (
              <div className="space-y-4 rounded-xl bg-primary/5 p-6 text-center shadow-sm ring-1 ring-primary/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Aguardando confirma&ccedil;&atilde;o por {PAYMENT_METHOD_LABELS[paymentMethod]}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {paymentUrl
                    ? "A tela segura do Asaas foi aberta em uma nova janela. Conclua o pagamento para que o pedido seja liberado."
                    : "O Asaas está processando a cobrança no cartão salvo. Esta tela será atualizada assim que o pagamento for confirmado."}
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {paymentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentUrl, "AsaasCheckout")}
                      className="text-xs gap-1 rounded-xl"
                    >
                      <span>Reabrir Tela de Pagamento</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
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
              <div className="space-y-4">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as AsaasBillingType)}
                  className="grid gap-3 md:grid-cols-3"
                >
                  {PAYMENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = paymentMethod === option.value;

                    return (
                      <Label
                        key={option.value}
                        htmlFor={`payment-${option.value}`}
                        className={`relative flex cursor-pointer flex-col gap-3 rounded-xl p-4 shadow-sm ring-1 transition-all ${
                          selected
                            ? "bg-primary/5 ring-2 ring-primary"
                            : "bg-card ring-border/70 hover:ring-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </span>
                          <RadioGroupItem
                            id={`payment-${option.value}`}
                            value={option.value}
                            aria-label={PAYMENT_METHOD_LABELS[option.value]}
                          />
                        </div>
                        <span className="grid gap-1">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                            {PAYMENT_METHOD_LABELS[option.value]}
                            {option.badge && (
                              <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700 hover:bg-emerald-100">
                                <Zap className="size-3" />
                                {option.badge}
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs font-medium text-foreground/80">
                            {option.description}
                          </span>
                          <span className="text-[11px] font-normal leading-relaxed text-muted-foreground">
                            {option.detail}
                          </span>
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>

                {paymentMethod === "CREDIT_CARD" && (
                  <div className="space-y-3 rounded-xl bg-muted/35 p-4 ring-1 ring-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">Qual cartão deseja usar?</p>
                        <p className="text-[11px] text-muted-foreground">Cartões tokenizados com segurança pelo Asaas.</p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                        <Link href="/conta/cartoes">Gerenciar</Link>
                      </Button>
                    </div>

                    {loadingCards ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Carregando cartões...
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedSavedCardId}
                        onValueChange={setSelectedSavedCardId}
                        className="grid gap-2"
                      >
                        {savedCards.map((card) => (
                          <Label
                            key={card.id}
                            htmlFor={`saved-card-${card.id}`}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 transition-all ${
                              selectedSavedCardId === card.id ? "ring-2 ring-primary" : "ring-border/70"
                            }`}
                          >
                            <RadioGroupItem id={`saved-card-${card.id}`} value={card.id} />
                            <CreditCard className="size-5 text-primary" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold">{card.brand} •••• {card.lastFour}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {card.holderName} · vence {card.expiryMonth}/{card.expiryYear.slice(-2)}
                              </span>
                            </span>
                            {card.isDefault && <Badge variant="secondary">Principal</Badge>}
                          </Label>
                        ))}
                        <Label
                          htmlFor="saved-card-new"
                          className={`flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 transition-all ${
                            selectedSavedCardId === "new" ? "ring-2 ring-primary" : "ring-border/70"
                          }`}
                        >
                          <RadioGroupItem id="saved-card-new" value="new" />
                          <Plus className="size-5 text-primary" />
                          <span>
                            <span className="block text-sm font-bold">Usar outro cartão</span>
                            <span className="block text-[11px] text-muted-foreground">Preencher no ambiente seguro do Asaas</span>
                          </span>
                        </Label>
                      </RadioGroup>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>
                    A Demir Diesel n&atilde;o armazena os dados do seu cart&atilde;o. O pagamento &eacute; processado diretamente pelo Asaas.
                  </span>
                </div>

                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!canPay}
                  className="hidden w-full h-12 text-sm font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 lg:flex"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando Pedido...
                    </>
                  ) : (
                    <span>Pagar com {selectedPaymentOption ? PAYMENT_METHOD_LABELS[selectedPaymentOption.value] : "Asaas"}</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Resumo dos Itens e Valores */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-5 rounded-2xl bg-card p-6 shadow-xl shadow-slate-900/10 dark:shadow-black/30">
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
                  {deliveryMethod === "pickup" ? "Retirada grátis" : "A calcular (análise de carga)"}
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
      {/* Barra de pagamento fixa (mobile/tablet): total + ação principal sempre ao alcance do polegar. */}
      {!isWaitingPayment && items.length > 0 && (
        <div
          inert={isKeyboardOpen}
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] shadow-[0_-6px_20px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out lg:hidden dark:bg-slate-900 ${
            isKeyboardOpen ? "pointer-events-none translate-y-full" : "translate-y-0"
          }`}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-muted-foreground">
                {deliveryMethod === "pickup" ? "Total · retirada grátis" : "Total · frete a calcular"}
              </span>
              <span className="block text-lg font-extrabold tabular-nums text-foreground">{formatCurrency(finalTotal)}</span>
            </div>
            <Button
              size="lg"
              onClick={() => {
                if (!selectedAddressId) {
                  haptic("error");
                  toast.error("Selecione ou cadastre um endereço de entrega.");
                  return;
                }
                haptic("medium");
                void handleCheckout();
              }}
              disabled={isProcessing || items.length === 0}
              className="h-12 min-w-40 shrink-0 gap-2 rounded-xl px-5 text-sm font-bold shadow-md shadow-primary/25"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  Pagar com {PAYMENT_METHOD_LABELS[selectedPaymentOption.value]}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent mobileSheet className="sm:max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Novo Endereço de Entrega</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className="text-xs">CEP*</Label>
              <div className="relative">
                <Input
                  {...mobileInput.cep}
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className="h-11 text-sm font-mono tracking-wide"
                />
                {isLookingUpCep && (
                  <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" aria-label="Buscando endereço" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Logradouro / Rua*</Label>
                <Input
                  {...mobileInput.street}
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Número*</Label>
                <Input
                  ref={numeroInputRef}
                  {...mobileInput.number}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Complemento</Label>
              <Input
                {...mobileInput.complement}
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Galpão 3, Apto 101"
                className="h-11 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Bairro*</Label>
                <Input
                  {...mobileInput.district}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade*</Label>
                <Input
                  {...mobileInput.city}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Estado (UF)*</Label>
                <Input
                  {...mobileInput.state}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="h-11 text-sm uppercase"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressDialogOpen(false)}
              className="h-11 text-sm rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveAddress}
              disabled={savingAddress}
              className="h-12 text-sm rounded-xl font-semibold sm:h-11"
            >
              {savingAddress ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
