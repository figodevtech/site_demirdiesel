"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Loader2, Check, Heart, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "./WhatsAppButton";
import { PublicProduct } from "@/lib/catalog/types";

export function ProductActions({ product }: { product: PublicProduct }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [shippingResult, setShippingResult] = useState<
    { type: string; price: number; days: number }[] | null
  >(null);

  const favorited = isInWishlist(product.id);
  const maxStock = Math.max(0, Number(product.stock) || 0);
  const isAvailable = product.isAvailable && maxStock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error("Produto indisponível no momento.");
      return;
    }
    addToCart(product, quantity);
    setIsAdded(true);
    toast.success("Produto adicionado ao carrinho!");

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleShippingSim = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 8) {
      toast.warning("Digite um CEP válido com 8 dígitos.");
      return;
    }

    setIsSimulating(true);
    setShippingResult(null);

    try {
      // Simulação rápida com prazo e faixas de frete
      await new Promise((resolve) => setTimeout(resolve, 800));
      setShippingResult([
        { type: "Transportadora Rodoviária / Carga Pesada", price: 38.5, days: 4 },
        { type: "Envio Expresso Aéreo", price: 68.0, days: 2 },
      ]);
    } catch {
      toast.error("Não foi possível simular o frete.");
    } finally {
      setIsSimulating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {isAvailable ? (
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
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-10 text-center font-mono font-semibold text-sm">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={quantity >= maxStock}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Botão de Compra Principal */}
              <Button
                size="lg"
                className={`flex-1 font-semibold text-sm h-11 gap-2 shadow-sm transition-all duration-300 ${
                  isAdded
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
                onClick={handleAddToCart}
                disabled={isAdded}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Adicionado ao Carrinho!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
                  </>
                )}
              </Button>

              {/* Botão de Favoritos */}
              <Button
                size="lg"
                variant="outline"
                className={`w-11 h-11 px-0 rounded-xl border border-border/80 transition-colors ${
                  favorited
                    ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
                onClick={() => toggleWishlist(product.id)}
                disabled={wishlistLoading}
                aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
              >
                {wishlistLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart
                    className={`w-4 h-4 ${favorited ? "fill-current" : ""}`}
                  />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Peça com disponibilidade sob consulta técnica
            </p>
            <p className="text-xs text-muted-foreground">
              Esta peça ou módulo pode ser encomendada ou passar por diagnóstico em nosso laboratório.
            </p>
          </div>
        )}

        {/* Botão Consultivo WhatsApp */}
        <WhatsAppButton
          productTitle={product.title}
          reference={product.reference}
          productId={product.id}
          className="w-full h-11 justify-center"
          label="Consultar Especialista no WhatsApp"
        />
      </div>

      {/* Simulação de Frete & Entrega */}
      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Truck className="w-4 h-4 text-primary" />
          <span>Calcular Frete & Prazo de Entrega</span>
        </div>

        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            maxLength={9}
            className="h-9 text-sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShippingSim}
            disabled={isSimulating}
            className="h-9 font-medium px-4 text-xs"
          >
            {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Calcular"}
          </Button>
        </div>

        {shippingResult && (
          <div className="rounded-xl border border-border/80 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2 text-xs">
            {shippingResult.map((res, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                <div>
                  <span className="font-medium text-foreground block">{res.type}</span>
                  <span className="text-[11px] text-muted-foreground">Prazo estimado: até {res.days} dias úteis</span>
                </div>
                <span className="font-bold text-foreground">{formatCurrency(res.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border/80 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-muted-foreground block truncate">{product.title}</span>
            <span className="text-base font-bold text-foreground block">
              {product.price > 0 ? product.formattedPrice : "Sob Consulta"}
            </span>
          </div>
          {isAvailable ? (
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="h-10 px-5 text-xs font-semibold bg-primary text-white shadow-xs"
            >
              Comprar
            </Button>
          ) : (
            <WhatsAppButton
              productTitle={product.title}
              reference={product.reference}
              productId={product.id}
              size="sm"
              className="h-10 px-3 text-xs"
              label="Consultar"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductActions;
