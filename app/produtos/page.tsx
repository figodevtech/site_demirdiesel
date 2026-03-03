import { buscarCategorias, buscarProdutosFiltrados } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProductCardV2 from "@/components/product/ProductCardV2";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categorySlug =
    typeof params.category === "string" ? params.category : undefined;
  const minPrice =
    typeof params.minPrice === "string" ? Number(params.minPrice) : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined;

  const [categories, products] = await Promise.all([
    buscarCategorias(),
    buscarProdutosFiltrados({ categorySlug, minPrice, maxPrice }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Loja
          </span>
          <h1 className="text-3xl font-bold text-secondary">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.nome ||
                "Produtos"
              : "Todos os Produtos"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length}{" "}
            {products.length === 1
              ? "produto encontrado"
              : "produtos encontrados"}
          </p>
        </div>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden flex gap-2"
            >
              <SlidersHorizontal size={16} /> Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-75">
            <div className="py-6">
              <h2 className="font-bold text-lg mb-6">Filtros</h2>
              <ProductFilters categories={categories} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Desktop Sidebar Filter */}
        <div className="hidden md:block">
          <ProductFilters categories={categories} />
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded h-fit">
            <p>Nenhum produto encontrado com os filtros selecionados.</p>
            <Link
              href="/produtos"
              className="text-primary underline mt-2 inline-block"
            >
              Limpar filtros
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/produto/${product.id}`}>
                <ProductCardV2 product={product} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
