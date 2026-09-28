import React from "react";
import Link from "next/link";
import { SlidersHorizontal, Package, Home, ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/catalog/categories";
import { getPaginatedProducts, getAvailableBrands } from "@/lib/catalog/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { ProductPagination } from "@/components/products/ProductPagination";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
  const sort = typeof params.sort === "string" ? (params.sort as any) : "recent";
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const [categories, availableBrands, paginatedResult] = await Promise.all([
    getCategories(),
    getAvailableBrands(),
    getPaginatedProducts({
      query,
      categorySlug,
      brand,
      condition,
      inStockOnly,
      sort,
      page,
      pageSize: 20,
    }),
  ]);

  const { products, totalCount, totalPages } = paginatedResult;
  const activeCategoryName = categories.find((c) => c.slug === categorySlug)?.name;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
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
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <ProductSort />

          {/* Gatilho dos Filtros no Mobile (Drawer) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden flex items-center gap-2 rounded-xl text-xs h-9"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-6">
              <SheetHeader className="text-left pb-4 border-b border-border">
                <SheetTitle className="text-base font-bold">Filtros do Catálogo</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto max-h-[calc(80vh-80px)] pt-4 pb-12">
                <ProductFilters
                  categories={categories}
                  availableBrands={availableBrands}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Layout com Sidebar Desktop e Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
        {/* Sidebar Desktop de Filtros */}
        <aside className="hidden md:block sticky top-24 bg-card rounded-2xl border border-border/80 p-5 shadow-2xs">
          <ProductFilters
            categories={categories}
            availableBrands={availableBrands}
          />
        </aside>

        {/* Área do Grid de Produtos */}
        <div className="space-y-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Paginação */}
              <ProductPagination currentPage={page} totalPages={totalPages} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
