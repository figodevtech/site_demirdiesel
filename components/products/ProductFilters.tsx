"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Filter } from "lucide-react";
import { PublicCategory } from "@/lib/catalog/types";

interface ProductFiltersProps {
  categories: PublicCategory[];
  availableBrands?: string[];
  onApply?: () => void;
}

export function ProductFilters({
  categories,
  availableBrands = ["BOSCH", "CUMMINS", "DELPHI", "DENSO", "MANN", "SCANIA", "VOLVO", "WEGA"],
  onApply,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const currentCategory = searchParams.get("category");
  const currentCondition = searchParams.get("condicao");
  const currentBrand = searchParams.get("marca");
  const currentStockOnly = searchParams.get("estoque") === "disponivel";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Volta para página 1 ao filtrar
    if (!value || value === "todos") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/produtos?${params.toString()}`);
    if (onApply) onApply();
  };

  const clearAllFilters = () => {
    router.push("/produtos");
    if (onApply) onApply();
  };

  const hasActiveFilters =
    Boolean(currentCategory) ||
    Boolean(currentCondition) ||
    Boolean(currentBrand) ||
    currentStockOnly;

  return (
    <div className="space-y-6">
      {/* Header com Limpar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Filtros do Catálogo</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
          >
            Limpar todos
          </Button>
        )}
      </div>

      {/* 1. Categorias */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Categorias
        </span>
        <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar pr-1">
          <button
            type="button"
            onClick={() => updateParam("category", null)}
            className={`flex items-center justify-between w-full text-xs text-left px-2.5 py-1.5 rounded-lg transition-colors ${
              !currentCategory
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Todas as Categorias</span>
            {!currentCategory && <Check className="w-3.5 h-3.5" />}
          </button>

          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam("category", isActive ? null : cat.slug)}
                className={`flex items-center justify-between w-full text-xs text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Condição da Peça */}
      <div className="space-y-2.5 pt-4 border-t border-border/60">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Conservação
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Todos", value: null },
            { label: "Novo", value: "novo" },
            { label: "Seminovo", value: "usado" },
            { label: "Revisado", value: "recondicionado" },
          ].map((item) => {
            const isSelected = item.value === null ? !currentCondition : currentCondition === item.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => updateParam("condicao", item.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : "bg-card border-border/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Disponibilidade de Estoque */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStockOnly}
            onChange={(e) => updateParam("estoque", e.target.checked ? "disponivel" : null)}
            className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          />
          <span>Apenas com estoque imediato</span>
        </label>
      </div>

      {/* 4. Fabricantes & Marcas */}
      {availableBrands.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-border/60">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Fabricante / Marca
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-1">
            <button
              type="button"
              onClick={() => updateParam("marca", null)}
              className={`flex items-center justify-between w-full text-xs text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                !currentBrand
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <span>Todos os Fabricantes</span>
              {!currentBrand && <Check className="w-3.5 h-3.5" />}
            </button>
            {availableBrands.map((b) => {
              const isActive = currentBrand?.toUpperCase() === b.toUpperCase();
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => updateParam("marca", isActive ? null : b.toLowerCase())}
                  className={`flex items-center justify-between w-full text-xs text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <span>{b}</span>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductFilters;
