"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { mobileInput } from "@/lib/forms/mobile-inputs";
import { addRecentSearch } from "@/lib/search/recent-searches";

interface SearchInputProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSelectResult?: () => void;
  onSearchActiveChange?: (active: boolean) => void;
}

export function SearchInput({
  className = "",
  inputClassName = "",
  placeholder = "Busque por peça, módulo, referência ou fabricante...",
  autoFocus = false,
  onSelectResult,
  onSearchActiveChange,
}: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, status } = useCatalogSearch(query);
  const loading = status === "loading";

  useEffect(() => {
    const isActive = isFocused || isOpen || query.trim().length > 0;
    onSearchActiveChange?.(isActive);
  }, [isFocused, isOpen, query, onSearchActiveChange]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      addRecentSearch(query);
      (document.activeElement as HTMLElement | null)?.blur();
      if (onSelectResult) onSelectResult();
      router.push(`/produtos?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (slugOrId: string) => {
    setIsOpen(false);
    addRecentSearch(query);
    if (onSelectResult) onSelectResult();
    router.push(`/produto/${slugOrId}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
        <Input
          {...mobileInput.search}
          aria-label="Buscar peças"
          placeholder={placeholder}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length >= 2);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          className={cn(
            "w-full pl-10 pr-10 h-10 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm",
            inputClassName
          )}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>
        )}
      </form>

      {/* Dropdown de Resultados Rápidos */}
      {isOpen && query.trim().length >= 2 && (results.length > 0 || !loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 divide-y divide-border/40 overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-900/12 animate-in fade-in-50 zoom-in-95 duration-150 dark:bg-slate-900 dark:shadow-black/35">
          {results.length > 0 ? (
            <div className={`py-2 max-h-[min(360px,55dvh)] overflow-y-auto overscroll-contain no-scrollbar transition-opacity duration-150 ${loading ? "opacity-60" : ""}`}>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Peças Encontradas ({results.length})
              </div>
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product.slug || product.id)}
                  className="w-full min-h-12 px-3 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {product.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {product.brand}
                      </span>
                      {product.reference && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] truncate">Ref: {product.reference}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-foreground block">
                      {product.price > 0 ? product.formattedPrice : (product.isAvailable ? "Consulte Valor" : "Sem estoque")}
                    </span>
                    <span className={`text-[10px] font-medium ${product.isAvailable ? "text-emerald-600" : "text-rose-600 dark:text-rose-400"}`}>
                      {product.isAvailable ? "Em estoque" : "Sem estoque"}
                    </span>
                  </div>
                </button>
              ))}

              <div className="p-2 border-t border-border/60">
                <Link
                  href={`/produtos?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <span>Ver todos os resultados para &quot;{query}&quot;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : status === "error" ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Não foi possível buscar agora. Verifique sua conexão.
            </div>
          ) : !loading && query.trim().length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Nenhuma peça encontrada para &quot;{query}&quot;.
              </p>
              <Link
                href={`/produtos?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
              >
                Buscar no catálogo completo
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchInput;
