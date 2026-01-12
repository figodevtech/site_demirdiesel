'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { useCart } from '@/components/providers/CartContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, MapPin } from 'lucide-react';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const { user, isLoading } = useAuth();
    const { items, subtotal, clearCart } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login?redirect=/checkout');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
                <Button onClick={() => router.push('/produtos')}>Voltar para loja</Button>
            </div>
        );
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        // Simulator Stripe Processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        clearCart();
        router.push('/sucesso');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold text-secondary mb-8">Finalizar Pedido</h1>
            
            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Forms */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Address Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-4">
                            <MapPin className="text-primary h-5 w-5" />
                            <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>CEP</Label>
                                    <Input placeholder="00000-000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rua</Label>
                                    <Input placeholder="Endereço" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Número</Label>
                                    <Input placeholder="123" />
                                </div>
                                <div className="space-y-2.">
                                    <Label>Bairro</Label>
                                    <Input placeholder="Bairro" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Cidade/Estado</Label>
                                <Input placeholder="Cidade - UF" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Section - MOCKED for Demo */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-4">
                            <CreditCard className="text-primary h-5 w-5" />
                            <CardTitle className="text-lg">Pagamento Seguro (Stripe)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-md border border-border/50 text-sm mb-4">
                                <p className="flex items-center gap-2 text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    Ambiente seguro garantido pela Stripe. Seus dados são criptografados.
                                </p>
                            </div>

                            {/* Mock Card UI */}
                            <div className="space-y-4 border p-4 rounded bg-white">
                                <div className="space-y-2">
                                    <Label>Número do Cartão</Label>
                                    <Input placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Validade</Label>
                                        <Input placeholder="MM/AA" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVC</Label>
                                        <Input placeholder="123" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                           
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column: Order Summary */}
                <div className="md:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="truncate max-w-[180px] text-muted-foreground">{item.quantity}x {item.product.name}</span>
                                        <span className="font-medium shrink-0">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-primary">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button 
                                className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20" 
                                onClick={handlePayment}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                                    </>
                                ) : (
                                    `Pagar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
