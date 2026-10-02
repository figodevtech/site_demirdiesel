"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  Plus,
  Search,
  SearchX,
  WifiOff,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";
import { useCart } from "@/components/providers/CartContext";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { useSafeBack } from "@/hooks/use-safe-back";
import { mobileInput } from "@/lib/forms/mobile-inputs";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  getServerRecentSearches,
  removeRecentSearch,
  subscribeRecentSearches,
} from "@/lib/search/recent-searches";
import type { PublicProduct } from "@/lib/catalog/types";

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

export interface SearchCategory {
  name: string;
  slug: string;
  image: string;
}

export function SearchScreen({ categories }: { categories: SearchCategory[] }) {
  const router = useRouter();
  const goBack = useSafeBack("/");
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();
  const { results, status, isRefreshing } = useCatalogSearch(query);
  const recentSearches = useSyncExternalStore(subscribeRecentSearches, getRecentSearches, getServerRecentSearches);

  // Foco automático só quando o usuário chega para digitar (sem termo na URL).
  useEffect(() => {
    if (!initialQuery) inputRef.current?.focus({ preventScroll: true });
  }, [initialQuery]);

  // Mantém o termo na URL: ao voltar de um produto, a busca reaparece (do cache) na mesma posição.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = trimmed ? `/buscar?q=${encodeURIComponent(trimmed)}` : "/buscar";
      if (`${window.location.pathname}${window.location.search}` !== url) {
        window.history.replaceState(window.history.state, "", url);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  const openCatalog = (term: string) => {
    addRecentSearch(term);
    inputRef.current?.blur();
    router.push(`/produtos?q=${encodeURIComponent(term)}`);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed) openCatalog(trimmed);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const applyTerm = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
  };

  const showIdle = trimmed.length < 2;
  const isFirstLoad = status === "loading" && results.length === 0;

  return (
    <div className="container mx-auto max-w-3xl px-4 pb-8">
      {/* Barra de busca do app: no mobile substitui o header (ver Header.tsx). */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:static md:mx-0 md:border-0 md:px-0 md:pt-6">
        <form onSubmit={handleSubmit} role="search" className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="size-11 shrink-0 rounded-xl text-foreground/80"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {status === "loading" && !showIdle ? (
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
            </span>
            <Input
              ref={inputRef}
              {...mobileInput.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Peça, código, módulo, bomba..."
              aria-label="Buscar peças"
              className="h-11 rounded-xl border-border/80 bg-slate-100/90 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus-visible:bg-white dark:bg-slate-800/90 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground active:bg-slate-200/70"
                aria-label="Limpar busca"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Button type="submit" className="hidden h-11 shrink-0 rounded-xl px-5 text-sm font-semibold sm:inline-flex">
            Buscar
          </Button>
        </form>
      </div>

      <div className="pt-4" aria-live="polite" aria-busy={status === "loading"}>
        {showIdle ? (
          <IdleState
            recentSearches={recentSearches}
            categories={categories}
            onPick={applyTerm}
          />
        ) : isFirstLoad ? (
          <ResultsSkeleton />
        ) : status === "error" ? (
          <EmptyState
            icon={<WifiOff className="size-7" />}
            title="Não foi possível buscar agora"
            description="Verifique sua conexão. Você ainda pode abrir o catálogo completo."
            onPick={applyTerm}
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-7" />}
            title="Nenhuma peça encontrada"
            description={`Não encontramos "${trimmed}". Confira o código da peça ou tente um termo mais amplo.`}
            onPick={applyTerm}
          />
        ) : (
          <div className={`transition-opacity duration-150 ${isRefreshing && status === "loading" ? "opacity-60" : "opacity-100"}`}>
            <div className="flex items-center justify-between pb-2 text-xs text-muted-foreground">
              <span>
                {results.length} {results.length === 1 ? "resultado" : "resultados"}
              </span>
              <button
                type="button"
                onClick={() => openCatalog(trimmed)}
                className="flex min-h-10 items-center gap-1 font-semibold text-primary"
              >
                Ver com filtros
                <ChevronRight className="size-4" />
              </button>
            </div>

            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-md shadow-slate-900/6">
              {results.map((product) => (
                <ResultRow key={product.id} product={product} onOpen={() => addRecentSearch(trimmed)} />
              ))}
            </ul>

            <Button
              variant="outline"
              onClick={() => openCatalog(trimmed)}
              className="mt-4 h-12 w-full gap-2 rounded-xl text-sm font-semibold"
            >
              Abrir todos os resultados no catálogo
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ product, onOpen }: { product: PublicProduct; onOpen: () => void }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const href = `/produto/${product.slug || product.id}`;
  const canBuy = product.price > 0 && product.isAvailable;

  const handleAdd = () => {
    if (addToCart(product, 1) > 0) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1400);
    }
  };

  return (
    <li className="flex items-center gap-3 pr-2">
      <Link href={href} onClick={onOpen} className="pressable flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 active:bg-slate-50 dark:active:bg-slate-800/50">
        <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
          {product.image ? (
            <Image src={product.image} alt="" fill sizes="64px" className="object-contain p-1" />
          ) : (
            <ProductFallbackImage category={product.categoryName} />
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">{product.title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {[product.brand, product.reference ? `Ref: ${product.reference}` : null].filter(Boolean).join(" · ")}
          </span>
          <span className="block text-sm font-bold text-foreground">
            {product.price > 0 ? (
              product.formattedPrice
            ) : product.isAvailable ? (
              <span className="text-xs font-semibold text-primary">Consulte valor</span>
            ) : (
              <span className="text-xs font-semibold text-rose-600">Sem estoque</span>
            )}
          </span>
        </span>
      </Link>

      {canBuy ? (
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${product.title} ao carrinho`}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            justAdded ? "bg-emerald-600 text-white" : "bg-primary/10 text-primary"
          }`}
        >
          {justAdded ? <Check className="size-5" /> : <Plus className="size-5" strokeWidth={2.5} />}
        </button>
      ) : (
        <ChevronRight className="mr-2 size-5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
      )}
    </li>
  );
}

function IdleState({
  recentSearches,
  categories,
  onPick,
}: {
  recentSearches: string[];
  categories: SearchCategory[];
  onPick: (term: string) => void;
}) {
  return (
    <div className="space-y-7">
      {recentSearches.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscas recentes</h2>
            <button type="button" onClick={clearRecentSearches} className="min-h-10 px-1 text-xs font-semibold text-primary">
              Limpar
            </button>
          </div>
          <ul>
            {recentSearches.map((term) => (
              <li key={term} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onPick(term)}
                  className="pressable flex min-h-11 flex-1 items-center gap-3 rounded-lg text-left text-sm text-foreground"
                >
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeRecentSearch(term)}
                  aria-label={`Remover "${term}" das buscas recentes`}
                  className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mais procurados</h2>
        <div className="flex flex-wrap gap-2">
          {SEARCH_SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPick(item)}
              className="h-9 rounded-full border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground shadow-xs transition-transform active:scale-95"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categorias</h2>
            <Link href="/produtos" className="flex min-h-10 items-center gap-1 text-xs font-semibold text-primary">
              Catálogo completo
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/produtos?category=${category.slug}`}
                className="pressable relative flex h-20 items-end overflow-hidden rounded-xl p-3 shadow-sm"
              >
                <Image src={category.image} alt="" fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/5" />
                <span className="relative text-[13px] font-bold leading-tight text-white">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  onPick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPick: (term: string) => void;
}) {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SEARCH_SUGGESTIONS.slice(0, 4).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className="h-9 rounded-full border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>
      <Button asChild variant="outline" className="mt-5 h-11 gap-2 rounded-xl px-5 text-sm font-semibold">
        <Link href="/produtos">
          <Package className="size-4" />
          Explorar o catálogo
        </Link>
      </Button>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton-shimmer mb-3 h-4 w-28 rounded" />
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-md shadow-slate-900/6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3">
            <div className="skeleton-shimmer size-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3.5 w-11/12 rounded" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded" />
              <div className="skeleton-shimmer h-3.5 w-24 rounded" />
            </div>
            <div className="skeleton-shimmer size-11 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
