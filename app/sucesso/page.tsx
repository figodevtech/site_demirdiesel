'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartContext";
import { useEffect, useState } from "react";
import confetti from 'canvas-confetti';

export default function SucessoPage() {
    const { clearCart } = useCart();

    const [hasOpener, setHasOpener] = useState(false);

    useEffect(() => {
        // 0. Clear cart immediately
        clearCart();
        
        // 1. Fire confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#171717'] // Primary and secondary colors
        });

        // 2. Notify opener window (Checkout page)
        if (typeof window !== 'undefined' && window.opener) {
            setHasOpener(true);
            console.log("DEBUG: Notifying main window about success...");
            window.opener.postMessage('payment_success', '*');
            
            // Optional: Close popup after a short delay so user sees success message
            setTimeout(() => {
                window.close();
            }, 5000); // 5s for better visibility during testing
        }
    }, [clearCart]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Pagamento Confirmado!</h1>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
                Obrigado pela sua compra. Enviamos um email com os detalhes do seu pedido e o código de rastreio.
            </p>

            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <Link href="/pedidos">
                        <Button variant="outline" size="lg">Ver Meus Pedidos</Button>
                    </Link>
                    <Link href="/">
                        <Button size="lg" className="px-8">Voltar para Loja</Button>
                    </Link>
                </div>
                {hasOpener && (
                    <p className="text-xs text-muted-foreground animate-pulse">
                        Esta janela deve fechar automaticamente e atualizar seu pedido...
                    </p>
                )}
            </div>
        </div>
    );
}
