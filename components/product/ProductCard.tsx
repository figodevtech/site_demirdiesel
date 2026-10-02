"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Plus, ShoppingCart } from "lucide-react";
import { PublicProduct } from "@/lib/catalog/types";
import { ProductFallbackImage } from "./ProductFallbackImage";
import { useCart } from "@/components/providers/CartContext";
import { FavoriteButton } from "./FavoriteButton";

const CART_BUTTON_CLASS_NAME = "group/cart relative inline-flex size-8 shrink-0 after:absolute after:-inset-2 after:content-[''] items-center justify-center gap-0.5 rounded-full border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/5 transition duration-300 ease-out hover:-translate-y-0.5 hover:scale-110 hover:border-primary/35 hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:bg-muted disabled:hover:text-muted-foreground disabled:hover:shadow-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100";

interface ProductCardProps {
  product: PublicProduct;
  priority?: boolean;
  rank?: number;
  badgeText?: string;
}

export function ProductCard({
  product,
  priority = false,
  rank,
  badgeText,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const hasValidImage = product.image && product.image.trim() !== "" && !imageError;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isAvailable && product.price > 0 && addToCart(product, 1) > 0) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1400);
    }
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-md shadow-slate-900/8 transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/12 dark:shadow-black/25">
      {/* Imagem do Produto com Proporção Otimizada */}
      <Link
        href={`/produto/${product.slug || product.id}`}
        className="relative isolate block aspect-square w-full overflow-hidden bg-slate-50 transition-opacity duration-150 active:opacity-85 dark:bg-slate-900/50"
      >
        {hasValidImage ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority={priority}
            onError={() => setImageError(true)}
          />
        ) : (
          <ProductFallbackImage category={product.categoryName} />
        )}

        {/* Badges superiores com alto contraste */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-10 max-w-[80%]">
          {rank ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-sm border border-amber-400/80 uppercase tracking-tight">
              <span>#{rank} Mais Vendido</span>
            </span>
          ) : badgeText ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-sm border border-amber-400/80 uppercase tracking-tight">
              {badgeText}
            </span>
          ) : null}



          {!product.isAvailable && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-xs border border-rose-700/40">
              Sem estoque
            </span>
          )}
        </div>

        {/* Botão de Favoritos */}
        <FavoriteButton productId={product.id} variant="card" className="absolute top-2 right-2 z-10" />
      </Link>

      {/* Conteúdo Comercial */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="space-y-1.5">
          {/* Categoria & Fabricante */}
          <div className="flex items-center justify-between gap-2 text-[9px] text-muted-foreground sm:text-[11px]">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="min-w-0 truncate font-medium uppercase tracking-wider text-slate-500">
                {product.categoryName}
              </span>
              {product.brand && (
                <span className="max-w-[45%] shrink-0 truncate rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300" title={product.brand}>
                  {product.brand}
                </span>
              )}
            </div>
            {product.price > 0 && (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!product.isAvailable}
                aria-label={`Adicionar ${product.title} ao carrinho`}
                title={product.isAvailable ? "Adicionar ao carrinho" : "Produto sem estoque"}
                className={`${CART_BUTTON_CLASS_NAME} ${justAdded ? "!border-emerald-600 !bg-emerald-600 !text-white" : ""}`}
              >
                {justAdded ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                ) : (
                <>
                <Plus className="size-2 shrink-0 transition-transform duration-300 ease-out group-hover/cart:rotate-90 group-hover/cart:scale-125 group-disabled/cart:transform-none motion-reduce:transform-none" strokeWidth={3} aria-hidden="true" />
                <ShoppingCart className="size-3 shrink-0 transition-transform duration-300 ease-out group-hover/cart:-rotate-12 group-disabled/cart:transform-none motion-reduce:transform-none" aria-hidden="true" />
                </>
                )}
              </button>
            )}
          </div>

          {/* Nome do Produto */}
          <Link
            href={`/produto/${product.slug || product.id}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="line-clamp-2 min-h-9 text-xs font-semibold leading-snug text-foreground sm:text-sm">
              {product.title}
            </h3>
          </Link>

          {product.condition === "USADO" ? (
            <span className="hidden truncate text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:block">
              SEMINOVO
            </span>
          ) : product.condition === "RECONDICIONADO" ? (
            <span className="hidden truncate text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:block">
              RECONDICIONADO
            </span>
          ) : product.condition === "NOVO" ? (
            <span className="hidden truncate text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:block">
              NOVO
            </span>
          ) : null}

          {/* Referência Técnica */}
          {product.reference && (
            <p className="truncate font-mono text-[9px] text-muted-foreground sm:text-[11px]" title={product.reference}>
              Ref: <span className="text-slate-700 dark:text-slate-300">{product.reference}</span>
            </p>
          )}
        </div>

        {/* Preço e disponibilidade */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
            <div>
              {product.price > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground block font-medium">À vista</span>
                  <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                    {product.formattedPrice}
                  </span>
                </>
              ) : (
                <Link
                  href={`/produto/${product.slug || product.id}`}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors py-1 block"
                >
                  Consulte Valor
                </Link>
              )}
            </div>

            {/* <span className={`text-[10px] font-medium sm:text-[11px] ${product.isAvailable ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400 font-semibold"}`}>
              {product.isAvailable ? `Em estoque` : "Sem estoque"}
            </span> */}
          </div>
        </div>
    </article>
  );
}

// Compatibilidade com imports antigos
export default ProductCard;
