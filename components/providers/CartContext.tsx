'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import { availableStock } from '@/lib/stock-client';

export interface CartProduct {
    id: string;
    price: number;
    stock: number;
    name?: string;
    title?: string;
    slug?: string;
    image?: string;
    brand?: string | null;
    category?: string;
    reference?: string | null;
}

export type CartItem = {
    product: CartProduct;
    quantity: number;
};

interface CartContextType {
    items: CartItem[];
    /** false até o carrinho salvo no aparelho ser lido (evita mostrar "vazio" por um instante). */
    isLoaded: boolean;
    /** Retorna a quantidade efetivamente adicionada (0 se não havia estoque). */
    addToCart: (product: CartProduct, quantity: number, options?: { silent?: boolean }) => Promise<number>;
    removeFromCart: (productId: string, options?: { silent?: boolean }) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    shippingInfo: ShippingInfo | null;
    setShippingInfo: (info: ShippingInfo | null) => void;
}

interface ShippingInfo {
    cep: string;
    price: number;
    days: number;
    method?: "delivery" | "pickup";
    label?: string;
    pickupEligible?: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const itemsRef = useRef(items);
    const pending = useRef(new Set<string>());
    const revision = useRef(0);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Carrega do localStorage ao montar
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const savedCart = localStorage.getItem('demirdiesel-cart');
            const savedShipping = localStorage.getItem('demirdiesel-shipping');
            if (savedCart) {
                try {
                    setItems(JSON.parse(savedCart) as CartItem[]);
                } catch (e) {
                    console.error("Failed to parse cart:", e);
                }
            }
            if (savedShipping) {
                try {
                    setShippingInfo(JSON.parse(savedShipping) as ShippingInfo);
                } catch (e) {
                    console.error("Failed to parse shipping:", e);
                }
            }
            setIsLoaded(true);
        }, 0);
        return () => window.clearTimeout(timer);
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

    const addToCart = async (product: CartProduct, quantity: number, options?: { silent?: boolean }) => {
        if(pending.current.has(product.id)) return 0;
        pending.current.add(product.id);
        const startedRevision=revision.current;
        try {
        const stock = await availableStock(product.id);
        if(startedRevision!==revision.current) return 0;
        product={...product,stock};
        const q = Math.max(1, Number(quantity) || 1);
        const current = itemsRef.current;
        const existing = current.find(item => item.product.id === product.id);
        const existingQty = existing ? Number(existing.quantity) || 0 : 0;

        if (!Number.isFinite(stock) || stock <= 0) {
            haptic('error');
            toast.error('Produto sem estoque.');
            return 0;
        }

        const canAdd = Math.max(0, stock - existingQty);
        const willAdd = Math.min(q, canAdd);

        if (willAdd <= 0) {
            haptic('error');
            toast.error('Quantidade indisponível em estoque.');
            return 0;
        }

        const next = existing
            ? current.map(item =>
                item.product.id === product.id ? { ...item, quantity: existingQty + willAdd } : item
            )
            : [...current, { product, quantity: willAdd }];
        itemsRef.current = next;
        setItems(next);
        haptic('success');

        if (willAdd < q) {
            toast.warning(`Apenas ${canAdd} unidade(s) disponível(is) em estoque.`);
        } else if (!options?.silent) {
            toast.success('Adicionado ao carrinho', {
                id: 'cart-added',
                description: product.title || product.name,
                action: pathname === '/carrinho'
                    ? undefined
                    : { label: 'Ver carrinho', onClick: () => router.push('/carrinho') },
            });
        }

        return willAdd;
        } catch(error) {toast.error(error instanceof Error?error.message:'Não foi possível consultar o estoque.');return 0;}
        finally {pending.current.delete(product.id);}
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if(pending.current.has(productId)) return;
        pending.current.add(productId);
        const startedRevision=revision.current;
        try {
        const q = Math.max(1, Number(quantity) || 1);
        const stock = await availableStock(productId);
        if(startedRevision!==revision.current) return;
        const item = itemsRef.current.find(entry => entry.product.id === productId);
        if (!item) return;

        if (Number.isFinite(stock) && stock <= 0) {
            toast.error('Produto sem estoque.');
            removeFromCart(productId, { silent: true });
            return;
        }

        const clamped = Number.isFinite(stock) && stock > 0 ? Math.min(q, stock) : q;
        if (clamped < q) toast.warning(`Estoque máximo: ${stock}.`);
        if (clamped === item.quantity) return;

        haptic('selection');
        const next = itemsRef.current.map(entry =>
            entry.product.id === productId ? { ...entry, product:{...entry.product,stock}, quantity: clamped } : entry
        );
        itemsRef.current = next;
        setItems(next);
        } catch(error) {toast.error(error instanceof Error?error.message:'Não foi possível consultar o estoque.');}
        finally {pending.current.delete(productId);}
    };

    const removeFromCart = (productId: string, options?: { silent?: boolean }) => {
        revision.current++;
        const current = itemsRef.current;
        const index = current.findIndex(item => item.product.id === productId);
        if (index < 0) return;

        const removed = current[index];
        const next = current.filter(item => item.product.id !== productId);
        itemsRef.current = next;
        setItems(next);
        if (options?.silent) return;

        haptic('light');
        toast('Item removido do carrinho', {
            id: `cart-removed-${productId}`,
            description: removed.product.title || removed.product.name,
            action: {
                label: 'Desfazer',
                onClick: () => {
                    const restored = [...itemsRef.current];
                    if (restored.some(item => item.product.id === productId)) return;
                    restored.splice(Math.min(index, restored.length), 0, removed);
                    itemsRef.current = restored;
                    setItems(restored);
                },
            },
        });
    };

    const clearCart = () => {
        revision.current++;
        itemsRef.current = [];
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, isLoaded, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, shippingInfo, setShippingInfo }}>
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
