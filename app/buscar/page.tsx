"use client";

import React, { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  ArrowLeft,
  Loader2,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicProduct } from "@/lib/catalog/types";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";
import { useCart } from "@/components/providers/CartContext";
import { buildProductWhatsAppUrl } from "@/lib/site-config";

const SEARCH_SUGGESTIONS = [
  "Módulo ECM",
  "Bico Injetor",
  "Bomba de Alta",
  "Filtro Racor",
  "Sensor de Pressão",
  "Turbina",
  "Chicote",
  "Arla",
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();

  // Foco automático no campo ao entrar na página de busca mobile
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Busca com debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Erro na busca rápida:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produtos?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl pb-24">
      {/* Barra de Busca Superior com Autofocus */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 border-b border-border/60">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por peça, código, módulo, bomba..."
              className="h-11 pl-10 pr-10 text-sm bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl border-border/80 focus-visible:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpar termo de busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-11 px-4 text-xs font-semibold bg-primary text-white rounded-xl shrink-0"
          >
            Buscar
          </Button>
        </form>

        {/* Sugestões Rápidas de Peças */}
        {!hasSearched && (
          <div className="pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Mais procurados na linha diesel:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SEARCH_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleChipClick(item)}
                  className="px-3 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground transition-colors font-medium border border-border/50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultados da Busca */}
      <div className="pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Consultando catálogo Demir Diesel...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
              <Package className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-base font-bold text-foreground">Nenhum componente encontrado</h2>
              <p className="text-xs text-muted-foreground">
                Não encontramos resultados para &ldquo;{query}&rdquo;. Verifique o código da peça ou tente termos mais genéricos como &ldquo;bico&rdquo;, &ldquo;módulo&rdquo; ou &ldquo;filtro&rdquo;.
              </p>
            </div>
            <Link href="/produtos">
              <Button variant="outline" size="sm" className="text-xs font-semibold gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Explorar todo o catálogo</span>
              </Button>
            </Link>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
              <span>{results.length} resultado(s) direto(s)</span>
              <Link
                href={`/produtos?q=${encodeURIComponent(query.trim())}`}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Ver no catálogo completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="py-3.5 flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-900/40 p-2 rounded-xl transition-colors"
                >
                  <Link
                    href={`/produto/${product.slug || product.id}`}
                    className="relative w-16 h-16 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 border border-border/60 overflow-hidden flex items-center justify-center"
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <ProductFallbackImage category={product.categoryName} />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.brand && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {product.brand}
                        </span>
                      )}
                      {product.condition === "USADO" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white shadow-xs">
                          SEMINOVO
                        </span>
                      )}
                      {product.condition === "RECONDICIONADO" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-600 text-white shadow-xs">
                          RECONDICIONADO
                        </span>
                      )}
                      {product.condition === "NOVO" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                          NOVO
                        </span>
                      )}
                      {!product.isAvailable && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                          Sem estoque
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/produto/${product.slug || product.id}`}
                      className="block font-semibold text-xs text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                    >
                      {product.title}
                    </Link>

                    {product.reference && (
                      <span className="text-[10px] font-mono text-muted-foreground block truncate">
                        Ref: {product.reference}
                      </span>
                    )}

                    <div className="pt-0.5">
                      {product.price > 0 ? (
                        <span className="text-xs font-bold text-foreground">
                          {product.formattedPrice}
                        </span>
                      ) : product.isAvailable ? (
                        <Link
                          href={`/produto/${product.slug || product.id}`}
                          className="text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          Consulte Valor
                        </Link>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Sem estoque
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {product.price > 0 && product.isAvailable ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addToCart(product, 1)}
                        className="h-8 px-2.5 text-xs font-semibold gap-1"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Adicionar</span>
                      </Button>
                    ) : product.price <= 0 && product.isAvailable ? (
                      <Link href={`/produto/${product.slug || product.id}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 px-2.5 text-xs font-semibold gap-1 bg-primary hover:bg-primary/90 text-white shadow-xs"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ver Produto</span>
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/produto/${product.slug || product.id}`}>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                          Ver Detalhes
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <Link href={`/produtos?q=${encodeURIComponent(query.trim())}`}>
                <Button variant="outline" className="w-full text-xs font-semibold gap-2">
                  <span>Abrir todos os resultados com filtros avançados</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
          Carregando busca...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
