'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, Truck, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { useCart } from "@/components/providers/CartContext";
import { useState } from "react";

import { useRouter } from "next/navigation";

export default function PaginaCarrinho() {
    const { items, removeFromCart, updateQuantity, subtotal, totalItems, shippingInfo, setShippingInfo } = useCart();
    const router = useRouter();
    const [cep, setCep] = useState(shippingInfo?.cep || '');
    const [isSimulating, setIsSimulating] = useState(false);

    const handleShippingCalc = async () => {
        if (cep.length < 8) return;
        setIsSimulating(true);
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock logic
        const price = 25.90; // Fixed mock price
        setShippingInfo({ cep, price, days: 5 });
        setIsSimulating(false);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-secondary mb-8 flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-primary" />
                Seu Carrinho
            </h1>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg shadow-sm border border-border/50">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground">
                        <ShoppingCart size={40} />
                    </div>
                    <h2 className="text-xl font-semibold text-secondary mb-2">Seu carrinho está vazio</h2>
                    <p className="text-muted-foreground mb-8 text-sm max-w-md">
                        Você ainda não adicionou nenhum produto ao seu carrinho. Explore nossa loja para encontrar as melhores peças.
                    </p>
                    <Link href="/produtos">
                        <Button className="font-semibold px-8">
                            Ver Produtos
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista de Itens do Carrinho */}
                    <div className="lg:col-span-2 space-y-4">
                       <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Itens ({totalItems})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 divide-y">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="h-20 w-20 bg-muted rounded-md overflow-hidden shrink-0 border border-border/50">
                                            <img 
                                                src={item.product.image} 
                                                alt={item.product.name} 
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-secondary truncate">{item.product.name}</h4>
                                            <p className="text-xs text-muted-foreground mb-2">Marca: {item.product.brand}</p>
                                            <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-8 w-8" 
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={14} />
                                                </Button>
                                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-8 w-8" 
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.product.stock || 10)}
                                                >
                                                    <Plus size={14} />
                                                </Button>
                                            </div>
                                            <div className="font-bold text-primary">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                                            </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:text-destructive h-8 w-8 self-center"
                                            onClick={() => removeFromCart(item.product.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                       </Card>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground">Frete</span>
                                    {shippingInfo ? (
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingInfo.price)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Não calculado</span>
                                    )}
                                </div>
                                
                                <div className="space-y-2 pt-2">
                                     <label className="text-xs font-medium text-muted-foreground">Calcular Frete</label>
                                     <div className="flex gap-2">
                                        <Input 
                                            placeholder="CEP" 
                                            className="h-8 text-sm" 
                                            value={cep} 
                                            onChange={(e) => setCep(e.target.value)}
                                            maxLength={9}
                                        />
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-8"
                                            onClick={handleShippingCalc}
                                            disabled={isSimulating}
                                        >
                                            {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck size={14} />}
                                        </Button>
                                     </div>
                                </div>

                                <Separator />
                                <div className="flex justify-between font-bold text-lg pt-2">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal + (shippingInfo?.price || 0))}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                                <Button 
                                    className="w-full text-base py-6 font-bold shadow-md hover:shadow-lg transition-all"
                                    onClick={handleCheckout}
                                >
                                    Finalizar Compra
                                </Button>
                                <Link href="/produtos" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Continuar Comprando
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
