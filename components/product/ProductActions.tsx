'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Loader2, Check, Heart } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductActions({ product }: { product: any }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
    const [quantity, setQuantity] = useState(1);
    const [cep, setCep] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [shippingResult, setShippingResult] = useState<{ type: string, price: number, days: number }[] | null>(null);

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setIsAdded(true);
        toast.success("Produto adicionado ao carrinho!");
        
        setTimeout(() => {
            setIsAdded(false);
        }, 2000);
    };

    const handleShippingSim = async () => {
        if (cep.length < 8) return;
        
        setIsSimulating(true);
        setShippingResult(null);

        // Simula latência da API
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Resultados mockados
        setShippingResult([
            { type: 'PAC', price: 25.90, days: 7 },
            { type: 'SEDEX', price: 45.50, days: 3 },
        ]);
        setIsSimulating(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="space-y-2">
                    {product.stock > 0 ? (
                        <>
                            <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-24">
                                    <Input 
                                        id="quantity"
                                        type="number" 
                                        min="1" 
                                        max={product.stock || 10} 
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full text-center" 
                                    />
                                </div>
                                <Button 
                                    size="lg" 
                                    className={`flex-1 text-lg gap-2 shadow-lg transition-all duration-300 ${isAdded ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'shadow-primary/20'}`}
                                    onClick={handleAddToCart}
                                    disabled={isAdded}
                                >
                                    {isAdded ? (
                                        <>
                                            <Check size={20} /> Adicionado!
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={20} /> Adicionar ao Carrinho
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    className={`w-14 px-0 border-2 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600 hover:border-red-300' : 'hover:bg-muted'}`}
                                    onClick={() => toggleWishlist(product.id)}
                                    disabled={wishlistLoading}
                                >
                                    {wishlistLoading ? <Loader2 className="animate-spin" size={20} /> : <Heart size={20} className={isInWishlist(product.id) ? "fill-current" : ""} />}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="p-4 bg-muted text-muted-foreground rounded-md text-center border border-border/50">
                            <p className="font-semibold text-red-500">Produto Indisponível</p>
                            <p className="text-sm">Avise-me quando chegar (Funcionalidade em breve)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Shipping Sim */}
            <div className="bg-muted/30 p-5 rounded-md space-y-4 border border-border/50">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Truck size={16} /> Calcular Frete e Prazo
                </h4>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Digite seu CEP" 
                        className="max-w-[200px] bg-background" 
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        maxLength={9}
                    />
                    <Button variant="secondary" size="sm" onClick={handleShippingSim} disabled={isSimulating}>
                        {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calcular'}
                    </Button>
                </div>
                
                {shippingResult && (
                    <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                        {shippingResult.map((res, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-background rounded border border-border/50">
                                <div>
                                    <span className="font-semibold text-secondary">{res.type}</span>
                                    <span className="text-muted-foreground ml-2">({res.days} dias úteis)</span>
                                </div>
                                <span className="font-bold text-primary">{formatCurrency(res.price)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
