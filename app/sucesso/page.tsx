'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import confetti from 'canvas-confetti';

export default function SucessoPage() {
    useEffect(() => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#171717'] // Primary and secondary colors
        });
    }, []);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Pagamento Confirmado!</h1>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
                Obrigado pela sua compra. Enviamos um email com os detalhes do seu pedido e o código de rastreio.
            </p>

            <div className="flex gap-4">
                <Link href="/pedidos">
                    <Button variant="outline" size="lg">Ver Meus Pedidos</Button>
                </Link>
                <Link href="/">
                    <Button size="lg" className="px-8">Voltar para Loja</Button>
                </Link>
            </div>
        </div>
    );
}
