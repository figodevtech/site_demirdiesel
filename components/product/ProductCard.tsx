"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicProduct } from "@/lib/catalog/types";
import { ProductFallbackImage } from "./ProductFallbackImage";
import { useCart } from "@/components/providers/CartContext";
import { useWishlist } from "@/lib/hooks/useWishlist";

interface ProductCardProps {
  product: PublicProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const [imageError, setImageError] = useState(false);

  const favorited = isInWishlist(product.id);
  const hasValidImage = product.image && product.image.trim() !== "" && !imageError;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isAvailable) {
      addToCart(product, 1);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-xl border border-border/70 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 overflow-hidden">
      {/* Imagem do Produto com Proporção Otimizada */}
      <Link
        href={`/produto/${product.slug || product.id}`}
        className="relative block aspect-square w-full bg-slate-50 dark:bg-slate-900/50 p-4 overflow-hidden border-b border-border/40"
      >
        {hasValidImage ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
            priority={priority}
            onError={() => setImageError(true)}
          />
        ) : (
          <ProductFallbackImage category={product.categoryName} />
        )}

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.condition === "USADO" ? (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 backdrop-blur-xs"
            >
              USADO
            </Badge>
          ) : product.condition === "RECONDICIONADO" ? (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 backdrop-blur-xs"
            >
              REVISADO
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs"
            >
              NOVO
            </Badge>
          )}

          {!product.isAvailable && (
            <Badge
              variant="destructive"
              className="text-[10px] font-medium px-2 py-0.5 bg-rose-600/90 text-white"
            >
              Indisponível
            </Badge>
          )}
        </div>

        {/* Botão de Favoritos */}
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-border/60 shadow-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              favorited ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>
      </Link>

      {/* Conteúdo Comercial */}
      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Categoria & Fabricante */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
            <span className="truncate font-medium uppercase tracking-wider text-slate-500">
              {product.categoryName}
            </span>
            {product.brand && (
              <span className="shrink-0 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {product.brand}
              </span>
            )}
          </div>

          {/* Nome do Produto */}
          <Link
            href={`/produto/${product.slug || product.id}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Referência Técnica */}
          {product.reference && (
            <p className="text-[11px] font-mono text-muted-foreground truncate" title={product.reference}>
              Ref: <span className="text-slate-700 dark:text-slate-300">{product.reference}</span>
            </p>
          )}
        </div>

        {/* Preço e Ação */}
        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.price > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground block font-medium">À vista</span>
                  <span className="text-lg font-bold text-foreground tracking-tight">
                    {product.formattedPrice}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-primary block py-1">
                  Consulte Valor
                </span>
              )}
            </div>

            <span className={`text-[11px] font-medium ${product.isAvailable ? "text-emerald-600" : "text-slate-400"}`}>
              {product.isAvailable ? `Em estoque` : "Sob consulta"}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 gap-2">
            {product.isAvailable ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleQuickAdd}
                className="w-full font-medium h-9 text-xs gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Adicionar ao Carrinho
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full font-medium h-9 text-xs gap-1 border-border/80"
              >
                <Link href={`/produto/${product.slug || product.id}`}>
                  <span>Ver Detalhes</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compatibilidade com imports antigos
export default ProductCard;
