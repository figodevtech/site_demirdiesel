'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Loader2, Check } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductActions({ product }: { product: any }) {
    const { addToCart } = useCart();
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

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock results
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
                    </div>
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
