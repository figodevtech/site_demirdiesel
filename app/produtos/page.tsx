import React from "react";
import Link from "next/link";
import { SlidersHorizontal, Package, Home, ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/catalog/categories";
import { getPaginatedProducts, getAvailableBrands, getAvailablePriceRange } from "@/lib/catalog/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { ProductPagination } from "@/components/products/ProductPagination";
import { CatalogPendingArea, CatalogTransitionProvider } from "@/components/products/CatalogTransition";
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductFilterOptions } from "@/lib/catalog/types";

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : undefined;
  const categorySlug = typeof params.category === "string" ? params.category : undefined;
  const brand = typeof params.marca === "string" ? params.marca : undefined;
  const condition = typeof params.condicao === "string" ? params.condicao : undefined;
  const inStockOnly = params.estoque === "disponivel";
  const minPrice = parseOptionalNumber(params.precoMin);
  const maxPrice = parseOptionalNumber(params.precoMax);
  const sort = parseSort(params.sort);
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = parsePageSize(params.porPagina);

  const [categories, availableBrands, priceRange, paginatedResult] = await Promise.all([
    getCategories(),
    getAvailableBrands(),
    getAvailablePriceRange(),
    getPaginatedProducts({
      query,
      categorySlug,
      brand,
      condition,
      inStockOnly,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize,
    }),
  ]);

  const { products, totalCount, totalPages } = paginatedResult;
  const activeCategoryName = categories.find((c) => c.slug === categorySlug)?.name;
  const activeFilterCount = [categorySlug, brand, condition, inStockOnly, minPrice != null, maxPrice != null].filter(Boolean).length;

  return (
    <CatalogTransitionProvider>
    <div className="container mx-auto px-4 pb-8 pt-3 md:pb-10 md:pt-5">
      {/* Breadcrumbs discretos */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/produtos" className="hover:text-foreground">
          Catálogo
        </Link>
        {activeCategoryName && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {activeCategoryName}
            </span>
          </>
        )}
        {query && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              &quot;{query}&quot;
            </span>
          </>
        )}
      </nav>

      {/* Header do Catálogo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {activeCategoryName || (query ? `Resultados para "${query}"` : "Catálogo de Peças Diesel")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {totalCount}{" "}
            {totalCount === 1 ? "componente catalogado" : "componentes catalogados"}
            {query && ` para o termo "${query}"`}
          </p>
        </div>

        {/* Controles: Ordenação & Botão Mobile de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <ProductSort />

          {/* Gatilho dos Filtros no Mobile (Drawer) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold md:hidden"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros</span>
                {activeFilterCount > 0 && <Badge className="size-5 justify-center rounded-full p-0 text-[10px]">{activeFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92vw] gap-0 overflow-hidden p-0 sm:max-w-sm">
              <SheetHeader className="border-b bg-muted/30 p-5 text-left">
                <SheetTitle className="text-base font-bold">Filtros do catálogo</SheetTitle>
                <SheetDescription>Escolha uma ou mais opções para encontrar a peça certa.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                <ProductFilters
                  categories={categories}
                  availableBrands={availableBrands}
                  priceBounds={priceRange}
                />
              </div>
              {/* Ação principal ao alcance do polegar: fecha o painel e mostra a lista já filtrada. */}
              <div className="shrink-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <SheetClose asChild>
                  <Button className="h-12 w-full rounded-xl text-sm font-bold">
                    Ver {totalCount} {totalCount === 1 ? "produto" : "produtos"}
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Layout com Sidebar Desktop e Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
        {/* Sidebar Desktop de Filtros */}
        <aside className="sticky top-24 hidden h-[calc(100dvh-7rem)] overflow-hidden pr-1 md:block">
          <ProductFilters
            categories={categories}
            availableBrands={availableBrands}
            priceBounds={priceRange}
          />
        </aside>

        {/* Área do Grid de Produtos */}
        <CatalogPendingArea className="space-y-8">
          {products.length === 0 ? (
            <div className="py-20 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">
                Nenhum componente encontrado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                Não encontramos produtos para os filtros ou busca informada. Tente limpar os filtros
                ou fazer uma busca mais ampla.
              </p>
              <Button asChild size="sm" variant="default" className="rounded-xl text-xs">
                <Link href="/produtos">Ver Todos os Produtos</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Paginação */}
              <ProductPagination currentPage={page} totalPages={totalPages} />
            </>
          )}
        </CatalogPendingArea>
      </div>
    </div>
    </CatalogTransitionProvider>
  );
}

function parseOptionalNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function parseSort(value: string | string[] | undefined): ProductFilterOptions["sort"] {
  const valid = ["recent", "price_asc", "price_desc", "name_asc", "featured"] as const;
  return typeof value === "string" && valid.includes(value as (typeof valid)[number])
    ? (value as (typeof valid)[number])
    : "recent";
}

function parsePageSize(value: string | string[] | undefined) {
  const allowedPageSizes = [12, 20, 36, 48] as const;
  const parsedValue = typeof value === "string" ? Number(value) : 20;

  return allowedPageSizes.includes(parsedValue as (typeof allowedPageSizes)[number])
    ? parsedValue
    : 20;
}
