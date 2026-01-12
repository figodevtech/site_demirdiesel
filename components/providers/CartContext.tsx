'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type CartItem = {
    product: any; // Using any for flexibility based on current types
    quantity: number;
};

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('demirdiesel-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever items change (after initial load)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('demirdiesel-cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: any, quantity: number) => {
        setItems(current => {
            const existing = current.find(item => item.product.id === product.id);
            if (existing) {
                return current.map(item => 
                    item.product.id === product.id 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...current, { product, quantity }];
        });
        // We can add a toast notification here later if we have a toaster
        console.log(`Added ${quantity} x ${product.name} to cart`);
    };

    const removeFromCart = (productId: string) => {
        setItems(current => current.filter(item => item.product.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
