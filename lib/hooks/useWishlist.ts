import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthContext';
import { toast } from 'sonner';

export function useWishlist() {
    const { user, profile } = useAuth();
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            fetchWishlistIds();
        } else {
            setWishlistIds([]);
        }
    }, [profile]);

    const fetchWishlistIds = async () => {
        if (!profile) return;
        const { data, error } = await supabase
            .from('favorito')
            .select('produto_id')
            .eq('cliente_id', profile.id);
        
        if (error) {
            console.error('Error fetching wishlist:', error);
        } else {
             // Ensure we store as numbers
            setWishlistIds(data.map(item => Number(item.produto_id)));
        }
    };

    const toggleWishlist = async (produtoId: string | number) => {
        if (!user || !profile) {
            toast.error("Faça login para adicionar aos favoritos.");
            return;
        }

        // Convert to number for consistency with DB and State
        const idAsNumber = Number(produtoId);
        if (isNaN(idAsNumber)) {
            console.error("Invalid product ID:", produtoId);
            return;
        }

        const isFavorited = wishlistIds.includes(idAsNumber);
        setLoading(true);

        try {
            if (isFavorited) {
                const { error } = await supabase
                    .from('favorito')
                    .delete()
                    .eq('cliente_id', profile.id)
                    .eq('produto_id', idAsNumber);
                
                if (error) throw error;
                setWishlistIds(prev => prev.filter(id => id !== idAsNumber));
                toast.success("Removido dos favoritos.");
            } else {
                const { error } = await supabase
                    .from('favorito')
                    .insert({
                        cliente_id: profile.id,
                        produto_id: idAsNumber
                    });
                
                if (error) {
                    // Check for duplicate key violation just in case
                    if (error.code === '23505') { // Unique violation
                         toast.success("Já está nos favoritos!");
                         // Sync state
                         if (!wishlistIds.includes(idAsNumber)) {
                             setWishlistIds(prev => [...prev, idAsNumber]);
                         }
                    } else {
                        throw error;
                    }
                } else {
                    setWishlistIds(prev => [...prev, idAsNumber]);
                    toast.success("Adicionado aos favoritos!");
                }
            }
        } catch (error: any) {
            console.error("Wishlist Error:", error);
            toast.error("Erro ao atualizar favoritos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isInWishlist = (produtoId: string | number) => {
        return wishlistIds.includes(Number(produtoId));
    };

    return {
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        loading
    };
}
