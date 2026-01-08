import { getProductsByCategory } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const categoryProducts = await getProductsByCategory(slug);

    const formattedTitle = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Categoria</span>
                    <h1 className="text-3xl font-bold text-secondary">{formattedTitle}</h1>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                    <SlidersHorizontal size={16} /> Filtros
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                {/* Sidebar Filter Mock - Can be updated to be dynamic later */}
                <div className="hidden md:block space-y-6">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-secondary">Preço</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <label className="flex items-center gap-2"><input type="checkbox" /> Até R$ 50</label>
                            <label className="flex items-center gap-2"><input type="checkbox" /> R$ 50 - R$ 100</label>
                            <label className="flex items-center gap-2"><input type="checkbox" /> R$ 100 - R$ 500</label>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {categoryProducts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded">
                        Nenhum produto encontrado nesta categoria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryProducts.map((product) => (
                            <Link key={product.id} href={`/produto/${product.id}`}>
                                <Card className="h-full hover:shadow-xl transition-all duration-300 group border-border/50 bg-white">
                                    <div className="aspect-square relative bg-white p-4">
                                        <img src={product.image} alt={product.name} className="object-contain w-full h-full" />
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                                        <h3 className="font-semibold text-secondary line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors">
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
