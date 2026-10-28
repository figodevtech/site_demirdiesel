"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Plus, Minus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/components/providers/CartContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "./WhatsAppButton";
import { FavoriteButton } from "./FavoriteButton";
import { PublicProduct } from "@/lib/catalog/types";
import { ProductPaymentTerms } from "./ProductPaymentTerms";
import { ShippingSimulator } from "./ShippingSimulator";
import { haptic } from '@/lib/haptics';
import { useVirtualKeyboardOpen } from "@/hooks/use-virtual-keyboard";

export function ProductActions({ product }: { product: PublicProduct }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const isKeyboardOpen = useVirtualKeyboardOpen();
  const [isAdded, setIsAdded] = useState(false);

  const maxStock = Math.max(0, Number(product.stock) || 0);
  const isAvailable = product.isAvailable && maxStock > 0;
  const hasPrice = product.price > 0;

  const handleAddToCart = async () => {
    if (!isAvailable) {
      toast.error("Produto sem estoque no momento.");
      return;
    }
    if (!hasPrice) {
      toast.info("Produto com valor sob consulta. Entre em contato pelo WhatsApp.");
      return;
    }
    // Feedback (toast "Ver carrinho" + haptic) vem do CartContext.
    if ((await addToCart(product, quantity)) <= 0) return;
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="space-y-6">
      <ProductPaymentTerms productId={Number(product.id)} price={product.price} quantity={quantity}/>
      <div className="flex flex-col gap-4">
        {isAvailable && hasPrice ? (
          <div className="space-y-3">
            <Label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quantidade (Disponível: {maxStock})
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Quantidade Moderno */}
              <div className="flex items-center rounded-xl border border-border/80 bg-slate-50 dark:bg-slate-900 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-lg"
                  onClick={() => {
                    haptic("selection");
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <motion.span
                  key={quantity}
                  initial={{ y: -4, opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="w-9 text-center font-mono text-base font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </motion.span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-lg"
                  onClick={() => {
                    haptic("selection");
                    setQuantity((q) => Math.min(maxStock, q + 1));
                  }}
                  disabled={quantity >= maxStock}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Botão de Compra Principal */}
              <Button
                size="lg"
                className={`flex-1 font-semibold text-sm h-12 gap-2 shadow-sm transition-colors duration-200 ${
                  isAdded
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
                onClick={handleAddToCart}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isAdded ? "added" : "add"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {isAdded ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
                    {isAdded ? "Adicionado!" : "Adicionar ao Carrinho"}
                  </motion.span>
                </AnimatePresence>
              </Button>

              {/* Botão de Favoritos */}
              <FavoriteButton productId={product.id} className="size-12" />
            </div>
          </div>
        ) : isAvailable && !hasPrice ? (
          <div className="space-y-3">
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 shadow-md shadow-slate-900/7 dark:bg-slate-900 dark:shadow-black/25">
              <p className="font-semibold text-foreground text-sm">
                Valor sob consulta técnica comercial
              </p>
              <p className="text-xs text-muted-foreground">
                Peça disponível em estoque. Fale diretamente com nossa equipe especializada para cotação imediata, condições de faturamento e prazo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <WhatsAppButton
                productTitle={product.title}
                reference={product.reference}
                productId={product.id}
                action="valor"
                variant="default"
                className="flex-1 h-12 justify-center bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md"
                label="Consultar Valor"
              />

              {/* Botão de Favoritos */}
              <FavoriteButton productId={product.id} className="size-12" />
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl bg-slate-100 p-4 shadow-md shadow-slate-900/7 dark:bg-slate-800/60 dark:shadow-black/25">
            <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
              Peça atualmente sem estoque imediato
            </p>
            <p className="text-xs text-muted-foreground">
              Consulte nossa equipe especializada pelo WhatsApp para previsão de reposição ou diagnóstico sob encomenda.
            </p>
          </div>
        )}

        {/* Botão WhatsApp Secundário para produto com preço normal */}
        {hasPrice && isAvailable && (
          <WhatsAppButton
            productTitle={product.title}
            reference={product.reference}
            productId={product.id}
            action="interesse"
            className="w-full h-11 justify-center"
            label="Tirar Dúvidas com Especialista no WhatsApp"
          />
        )}
        {!isAvailable && (
          <WhatsAppButton
            productTitle={product.title}
            reference={product.reference}
            productId={product.id}
            action="disponibilidade"
            className="w-full h-11 justify-center"
            label="Perguntar quando chega pelo WhatsApp"
          />
        )}
      </div>

      <ShippingSimulator productIds={[Number(product.id)]} items={[{productId:Number(product.id),quantity}]}/>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div
        inert={isKeyboardOpen}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border/80 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pl-[calc(0.75rem+env(safe-area-inset-left,0px))] pr-[calc(0.75rem+env(safe-area-inset-right,0px))] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-200 ${
          isKeyboardOpen ? "pointer-events-none translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-muted-foreground block truncate">{product.title}</span>
            <span className="text-base font-bold text-foreground block">
              {hasPrice ? (
                product.formattedPrice
              ) : isAvailable ? (
                <span className="text-foreground font-bold">Consulte Valor</span>
              ) : (
                "Sem Estoque"
              )}
            </span>
          </div>
          {hasPrice && isAvailable ? (
            <Button
              onClick={handleAddToCart}
              className={`h-12 min-w-36 gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-colors duration-200 ${
                isAdded ? "bg-emerald-600 hover:bg-emerald-600" : "bg-primary shadow-primary/25"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isAdded ? "added" : "buy"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  {isAdded ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
                  {isAdded ? "Adicionado" : "Adicionar"}
                </motion.span>
              </AnimatePresence>
            </Button>
          ) : (
            <WhatsAppButton
              productTitle={product.title}
              reference={product.reference}
              productId={product.id}
              action={!hasPrice && isAvailable ? "valor" : "disponibilidade"}
              size="sm"
              variant="default"
              className="h-12 rounded-xl px-5 text-sm bg-primary hover:bg-primary/90 text-white font-bold"
              label={!hasPrice && isAvailable ? "Consultar Valor" : "Consultar"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductActions;
