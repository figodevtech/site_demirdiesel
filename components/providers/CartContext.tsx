'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type CartItem = {
    product: any; // usando any para flexibilidade com os tipos atuais
    quantity: number;
};

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    shippingInfo: { cep: string, price: number, days: number } | null;
    setShippingInfo: (info: { cep: string, price: number, days: number } | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [shippingInfo, setShippingInfo] = useState<{ cep: string, price: number, days: number } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carrega do localStorage ao montar
    useEffect(() => {
        const savedCart = localStorage.getItem('demirdiesel-cart');
        const savedShipping = localStorage.getItem('demirdiesel-shipping');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart:", e);
            }
        }
        if (savedShipping) {
            try {
                setShippingInfo(JSON.parse(savedShipping));
            } catch (e) {
                console.error("Failed to parse shipping:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Salva no localStorage sempre que items mudar (após o carregamento inicial)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('demirdiesel-cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    // Salva info de frete
    useEffect(() => {
        if (isLoaded) {
            if (shippingInfo) {
                localStorage.setItem('demirdiesel-shipping', JSON.stringify(shippingInfo));
            } else {
                localStorage.removeItem('demirdiesel-shipping');
            }
        }
    }, [shippingInfo, isLoaded]);

    const addToCart = (product: any, quantity: number) => {
        const stock = Number(product?.stock ?? 0);
        const q = Math.max(1, Number(quantity) || 1);

        setItems(current => {
            const existing = current.find(item => item.product.id === product.id);
            const existingQty = existing ? Number(existing.quantity) || 0 : 0;

            if (Number.isFinite(stock) && stock > 0) {
                const canAdd = Math.max(0, stock - existingQty);
                const willAdd = Math.min(q, canAdd);

                if (willAdd <= 0) {
                    toast.error('Quantidade indisponível em estoque.');
                    return current;
                }

                if (willAdd < q) {
                    toast.warning(`Apenas ${canAdd} unidade(s) disponível(is) em estoque.`);
                }

                if (existing) {
                    return current.map(item =>
                        item.product.id === product.id
                            ? { ...item, quantity: existingQty + willAdd }
                            : item
                    );
                }

                return [...current, { product, quantity: willAdd }];
            }

            toast.error('Produto sem estoque.');
            return current;
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const q = Math.max(1, Number(quantity) || 1);
        setItems(current =>
            current.flatMap(item => {
                if (item.product.id !== productId) return [item];

                const stock = Number(item.product?.stock ?? 0);
                if (Number.isFinite(stock) && stock <= 0) {
                    toast.error('Produto sem estoque.');
                    return [];
                }

                if (Number.isFinite(stock) && stock > 0) {
                    const clamped = Math.min(q, stock);
                    if (clamped < q) toast.warning(`Estoque máximo: ${stock}.`);
                    return [{ ...item, quantity: clamped }];
                }

                return [{ ...item, quantity: q }];
            })
        );
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
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, shippingInfo, setShippingInfo }}>
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
