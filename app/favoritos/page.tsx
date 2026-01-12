'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

export default function PaginaFavoritos() {
    // Placeholder para lista de favoritos (futuramente vindo de localStorage ou backend)
    const favoritos: any[] = []; // Array vazio para mostrar estado vazio inicial

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-secondary mb-8 flex items-center gap-3">
                <Heart className="w-8 h-8 text-destructive fill-destructive" />
                Meus Favoritos
            </h1>

            {favoritos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg shadow-sm border border-border/50">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground/50">
                        <Heart size={40} />
                    </div>
                    <h2 className="text-xl font-semibold text-secondary mb-2">Sua lista de desejos está vazia</h2>
                    <p className="text-muted-foreground mb-8 text-sm max-w-md">
                        Você ainda não marcou nenhum produto como favorito. Salve os itens que você mais gostou para ver depois.
                    </p>
                    <Link href="/produtos">
                        <Button className="font-semibold px-8">
                            Explorar Produtos
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder para itens quando houver */}
                    {favoritos.map((item, idx) => (
                         <Card key={idx}>
                            <CardContent className="p-4">
                                {/* Item content */}
                            </CardContent>
                         </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
