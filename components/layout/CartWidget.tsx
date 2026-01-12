'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/CartContext";

export default function CartWidget() {
    const { totalItems } = useCart();

    return (
        <Link href="/carrinho">
            <Button size="icon" variant="ghost" className="relative text-primary hover:text-primary hover:bg-primary/10" aria-label="Carrinho">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white border-2 border-background rounded-full text-[10px]">
                        {totalItems}
                    </Badge>
                )}
            </Button>
        </Link>
    );
}
