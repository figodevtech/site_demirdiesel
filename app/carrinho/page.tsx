"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import { AnimatePresence, motion } from "motion/react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Package,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getShippingEstimate } from "@/lib/shipping";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";
import { buildWhatsAppUrl } from "@/lib/site-config";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { useVirtualKeyboardOpen } from "@/hooks/use-virtual-keyboard";
import { cepDigits, formatCep, mobileInput } from "@/lib/forms/mobile-inputs";
import { haptic } from "@/lib/haptics";

export default function CarrinhoPage() {
  const router = useRouter();
  const {
    items,
    isLoaded,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItems,
    shippingInfo,
    setShippingInfo,
  } = useCart();

  const [cep, setCep] = useState(shippingInfo?.cep ? formatCep(shippingInfo.cep) : "");
  const [isSimulating, setIsSimulating] = useState(false);
  const isKeyboardOpen = useVirtualKeyboardOpen();

  const goToCheckout = () => {
    haptic("medium");
    router.push("/checkout");
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleShippingCalc = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanCep = cepDigits(cep);
    if (cleanCep.length < 8) {
      haptic("error");
      toast.warning("Digite um CEP válido com 8 dígitos.");
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur();

    setIsSimulating(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const location = response.ok ? await response.json() : null;
      const quote = getShippingEstimate(cleanCep, {
        city: location?.localidade,
        state: location?.uf,
      });
      setShippingInfo({
        cep: cleanCep,
        price: 0,
        days: 0,
        method: "delivery",
        pickupEligible: quote.pickupEligible,
        label: quote.pickupEligible ? "Retirada no local disponível" : "Entrega a calcular",
      });
      toast.info(quote.message);
    } catch {
      setShippingInfo({ cep: cleanCep, price: 0, days: 0, method: "delivery", label: "Entrega a calcular" });
      toast.info("O frete será confirmado após a análise do endereço e da cubagem.");
    } finally {
      setIsSimulating(false);
    }
  };

  const finalTotal = subtotal;

  return (
    <div className={`container mx-auto max-w-5xl px-4 pt-3 md:pt-5 ${items.length > 0 ? "pb-28 lg:pb-10" : "pb-8 md:pb-10"}`}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-primary" />
            <span>Meu Carrinho</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {!isLoaded ? "\u00a0" : totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? "item selecionado" : "itens selecionados"}`
              : "Nenhum item adicionado"}
          </p>
        </div>

        <Link
          href="/produtos"
          className="flex min-h-10 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continuar comprando</span>
        </Link>
      </div>

      {!isLoaded ? (
        <div className="rounded-2xl bg-card p-4 shadow-lg shadow-slate-900/8 lg:max-w-[66%]">
          <ListSkeleton rows={2} variant="row" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-border/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Seu carrinho está vazio</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Você ainda não adicionou nenhum componente ao carrinho. Explore nosso catálogo de peças e módulos.
          </p>
          <Button asChild className="rounded-xl px-6 font-semibold text-xs h-10">
            <Link href="/produtos">Explorar Catálogo Diesel</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lista de Itens do Carrinho */}
          <div className="lg:col-span-8 space-y-4">
            <div className="divide-y divide-border/40 overflow-hidden rounded-2xl bg-card shadow-lg shadow-slate-900/8 dark:shadow-black/25">
              <AnimatePresence initial={false}>
              {items.map((item) => {
                const p = item.product;
                const itemTotal = (Number(p.price) || 0) * item.quantity;

                return (
                  <motion.div
                    key={p.id}
                    layout="position"
                    exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeOut" } }}
                    className="overflow-hidden"
                  >
                  <div className="p-4 sm:p-5 flex gap-3 items-start sm:items-center">
                    {/* Imagem do Item */}
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1 shadow-sm shadow-slate-900/6 dark:bg-slate-900 dark:shadow-black/20 sm:h-24 sm:w-24">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name || p.title || "Produto"}
                          fill
                          sizes="96px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <ProductFallbackImage category={p.category} />
                      )}
                    </div>

                    {/* Detalhes do Item */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/produto/${p.slug || p.id}`}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 block leading-snug"
                      >
                        {p.name || p.title}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        {p.brand && (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {p.brand}
                          </span>
                        )}
                        {p.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px]">Ref: {p.reference}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2">
                        {/* Seletor de Quantidade */}
                        <div className="flex items-center rounded-xl border border-border/80 bg-slate-50 dark:bg-slate-900 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition-transform active:scale-90 active:bg-slate-200/70 disabled:opacity-35"
                            aria-label={`Diminuir quantidade de ${p.name || p.title}`}
                          >
                            <Minus className="size-4" />
                          </button>
                          <motion.span
                            key={item.quantity}
                            initial={{ y: -4, opacity: 0.4 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="w-8 text-center font-mono text-sm font-semibold tabular-nums"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </motion.span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, item.quantity + 1)}
                            disabled={item.quantity >= (Number(p.stock) || 99)}
                            className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition-transform active:scale-90 active:bg-slate-200/70 disabled:opacity-35"
                            aria-label={`Aumentar quantidade de ${p.name || p.title}`}
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        {/* Valor Unitário e Total do Item */}
                        <div className="text-right">
                          <span className="font-bold text-sm sm:text-base text-foreground block">
                            {formatCurrency(itemTotal)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-muted-foreground block">
                              {formatCurrency(p.price)} un.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(p.id)}
                      className="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-rose-600 active:bg-rose-50 active:text-rose-600"
                      aria-label={`Remover ${p.name || p.title} do carrinho`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>

            {/* Simulação de Frete */}
            <div className="space-y-3 rounded-2xl bg-card p-5 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Truck className="w-4 h-4 text-primary" />
                <span>Simulação de Frete para Entrega</span>
              </div>
              <form onSubmit={handleShippingCalc} className="flex gap-2 max-w-sm">
                <Input
                  {...mobileInput.cep}
                  enterKeyHint="go"
                  aria-label="CEP para simular o frete"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  className="h-11 text-sm font-mono tracking-wide"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSimulating}
                  className="h-11 min-w-28 text-sm font-semibold px-4"
                >
                  {isSimulating ? "Calculando..." : "Calcular"}
                </Button>
              </form>
              {shippingInfo && (
                <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                  <span>{shippingInfo.pickupEligible ? "Retirada no local" : "Transporte especializado"}:</span>
                  <span className="font-semibold text-primary">
                    {shippingInfo.pickupEligible ? "Disponível e grátis" : "A combinar"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-5 rounded-2xl bg-card p-6 shadow-xl shadow-slate-900/10 dark:shadow-black/30">
              <h2 className="font-extrabold text-base text-foreground">Resumo do Pedido</h2>

              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Subtotal dos produtos</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-semibold text-primary">
                    A calcular
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-3 text-base">
                  <span className="font-bold text-foreground">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground block">
                      {formatCurrency(finalTotal)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Condições do cartão calculadas no checkout
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={goToCheckout}
                className="hidden w-full h-12 text-sm font-bold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 lg:flex"
              >
                <span>Avançar para o Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ambiente Seguro e Criptografado</span>
              </div>

              <div className="text-center pt-2 border-t border-border/40">
                <a
                  href={buildWhatsAppUrl("Olá! Tenho dúvidas sobre os itens no meu carrinho e gostaria de atendimento técnico.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dúvidas com o pedido? Fale no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de finalização ao alcance do polegar (mobile/tablet), acima da BottomNav. */}
      {isLoaded && items.length > 0 && (
        <div
          inert={isKeyboardOpen}
          className={`fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-border/70 bg-white px-4 py-3 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] shadow-[0_-6px_20px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out md:bottom-0 md:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden dark:bg-slate-900 ${
            isKeyboardOpen ? "pointer-events-none translate-y-[200%]" : "translate-y-0"
          }`}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-muted-foreground">
                Total · {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
              <motion.span
                key={finalTotal}
                initial={{ opacity: 0.5, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="block text-lg font-extrabold tabular-nums text-foreground"
              >
                {formatCurrency(finalTotal)}
              </motion.span>
            </div>
            <Button
              size="lg"
              onClick={goToCheckout}
              className="h-12 shrink-0 gap-2 rounded-xl px-5 text-sm font-bold shadow-md shadow-primary/25"
            >
              Finalizar compra
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
