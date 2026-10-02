"use client";

import React from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string | number;
  variant?: "card" | "action";
  className?: string;
}

/**
 * Favoritar com resposta imediata: o estado é otimista (WishlistContext), então o coração
 * preenche no toque, com um "pop" curto. Nada de spinner nem botão desabilitado.
 */
export function FavoriteButton({ productId, variant = "action", className }: FavoriteButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const favorited = isInWishlist(productId);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void toggleWishlist(productId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      className={cn(
        "relative flex shrink-0 items-center justify-center transition-colors duration-150 active:scale-90",
        variant === "card"
          ? "size-9 rounded-full border border-border/60 bg-white/95 shadow-xs after:absolute after:-inset-1.5 after:content-[''] dark:bg-slate-800"
          : "size-11 rounded-xl border",
        favorited
          ? variant === "card"
            ? "text-rose-500"
            : "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900 dark:bg-rose-950/30"
          : variant === "card"
            ? "text-slate-400"
            : "border-border/80 text-slate-500 hover:bg-slate-100",
        className
      )}
    >
      <motion.span
        key={favorited ? "on" : "off"}
        initial={{ scale: favorited ? 0.55 : 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
        className="flex"
      >
        <Heart className={cn(variant === "card" ? "size-4" : "size-5", favorited && "fill-current")} />
      </motion.span>
    </button>
  );
}
