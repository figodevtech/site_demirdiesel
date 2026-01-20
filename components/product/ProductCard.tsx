'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { toast } from "sonner";
import { useState } from "react";

interface ProductCardProps {
    product: any; // Ideally use proper type
}

export function ProductCard({ product }: ProductCardProps) {
    const { toggleWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product.id);
    };

    return (
        <Link href={`/produto/${product.id}`} className="block h-full">
            <Card className="h-full hover:shadow-xl transition-all duration-300 group border-border/50 bg-white overflow-hidden flex flex-col relative">
                <div className="aspect-square relative bg-white flex items-center justify-center p-4">
                    <div className="w-full h-full bg-gray-100 rounded-md relative overflow-hidden">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">Sem Imagem</div>
                        )}

                        {/* Quick Actions Overlay (Mobile friendly: always visible or button) */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                             <Button 
                                size="icon" 
                                variant="secondary"
                                className={`h-8 w-8 rounded-full shadow-sm ${isInWishlist(product.id) ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-gray-100'}`}
                                onClick={handleToggleWishlist}
                                disabled={wishlistLoading}
                            >
                                <Heart size={16} className={isInWishlist(product.id) ? "fill-current" : ""} />
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                    <h3 className="font-semibold text-secondary line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
