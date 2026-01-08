import { getProductById } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Truck, Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-12">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-white border border-border/50 rounded-lg flex items-center justify-center p-8 relative overflow-hidden">
                        <img src={product.image} alt={product.name} className="object-contain w-full h-full max-h-[500px]" />
                    </div>
                    {product.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-4">
                            {product.images.map((img: string, idx: number) => (
                                <div key={idx} className="aspect-square bg-white border border-border/50 rounded-md cursor-pointer hover:border-primary overflow-hidden p-2">
                                    <img src={img} alt="" className="w-full h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted cursor-default">
                                {product.category}
                            </Badge>
                            <Badge variant="outline" className="text-primary border-primary">
                                {product.brand}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold text-secondary mb-2">{product.name}</h1>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex text-yellow-500">
                                <Star className="fill-current w-4 h-4" />
                                <span className="ml-1 text-secondary font-medium">{product.rating}</span>
                            </div>
                            <span className="text-muted-foreground">Cod: #{product.id}</span>
                            <span className="text-green-600 font-medium flex items-center gap-1">
                                <Check size={14} /> Em estoque ({product.stock})
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 py-4 border-t border-b border-border/50">
                        <p className="text-xs text-muted-foreground">Preço à vista com 5% de desconto</p>
                        <div className="text-4xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </div>
                        <p className="text-sm opacity-80">
                            ou <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</span> em até 3x sem juros
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-24">
                            <input type="number" min="1" max="10" defaultValue="1" className="w-full p-2 border border-input rounded-md text-center" />
                        </div>
                        <Button size="lg" className="flex-1 text-lg gap-2 shadow-lg shadow-primary/20">
                            <ShoppingCart size={20} /> Adicionar ao Carrinho
                        </Button>
                    </div>

                    {/* Shipping Sim */}
                    <div className="bg-muted/30 p-4 rounded-md space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Truck size={16} /> Calcular Frete e Prazo
                        </h4>
                        <div className="flex gap-2">
                            <input placeholder="CEP" className="p-2 text-sm border border-input rounded flex-1" />
                            <Button variant="outline" size="sm">Ok</Button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-secondary">Descrição</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {product.fullDescription}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
