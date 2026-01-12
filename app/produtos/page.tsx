import { buscarCategorias, buscarProdutosFiltrados } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const categorySlug = typeof params.category === 'string' ? params.category : undefined;
    const minPrice = typeof params.minPrice === 'string' ? Number(params.minPrice) : undefined;
    const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;

    const [categories, products] = await Promise.all([
        buscarCategorias(),
        buscarProdutosFiltrados({ categorySlug, minPrice, maxPrice })
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                <div>
                     <span className="text-xs text-muted-foreground uppercase tracking-wider">Loja</span>
                    <h1 className="text-3xl font-bold text-secondary">
                        {categorySlug 
                            ? categories.find(c => c.slug === categorySlug)?.nome || "Produtos" 
                            : "Todos os Produtos"}
                    </h1>
                     <p className="text-muted-foreground text-sm mt-1">
                        {products.length} {products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </p>
                </div>
                
                {/* Mobile Filter Button */}
                <Sheet>
                    <SheetTrigger asChild>
                         <Button variant="outline" size="sm" className="md:hidden flex gap-2">
                            <SlidersHorizontal size={16} /> Filtros
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px]">
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
                        <Link href="/produtos" className="text-primary underline mt-2 inline-block">Limpar filtros</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Link key={product.id} href={`/produto/${product.id}`}>
                                <Card className="h-full hover:shadow-xl transition-all duration-300 group border-border/50 bg-white overflow-hidden">
                                    <div className="aspect-square relative bg-white flex items-center justify-center p-4">
                                        <div className="w-full h-full bg-gray-50 rounded-md relative overflow-hidden flex items-center justify-center">
                                            <img src={product.image} alt={product.name} className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-500" />
                                            
                                            <div className="absolute bottom-2 right-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <Button size="icon" className="h-8 w-8 rounded-full shadow-lg">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                                        <h3 className="font-semibold text-secondary line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors text-sm">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-lg font-bold text-primary">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
