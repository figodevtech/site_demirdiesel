"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "recent";

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.delete("page");
    router.push(`/produtos?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-muted-foreground hidden sm:inline">Ordenar por:</span>
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
        aria-label="Ordenação de produtos"
      >
        <option value="recent">Mais Recentes</option>
        <option value="price_asc">Menor Preço</option>
        <option value="price_desc">Maior Preço</option>
        <option value="name_asc">Nome (A - Z)</option>
        <option value="featured">Destaques</option>
      </select>
    </div>
  );
}
