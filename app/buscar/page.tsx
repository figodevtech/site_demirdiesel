import { searchProducts } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const query = (await searchParams).q || "";

    const filteredProducts = await searchProducts(query);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-secondary">
                    Resultados para &quot;<span className="text-primary">{query}</span>&quot;
                </h1>
                <span className="text-sm text-muted-foreground">{filteredProducts.length} produtos encontrados</span>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                    <Button variant="link" asChild className="mt-2">
                        <Link href="/">Voltar para Home</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
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
    );
}
