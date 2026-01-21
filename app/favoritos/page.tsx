'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useWishlist } from '@/lib/hooks/useWishlist';

export default function FavoritosPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);
    const { toggleWishlist } = useWishlist();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (profile?.id) {
                fetchFavorites();
            } else {
                setLoading(false);
            }
        }
    }, [user?.id, profile?.id, authLoading, router]);

    // Se quiser, pode mostrar um loading enquanto autentica:
    // if (authLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('favorito')
                .select(`
                    produto_id,
                    produto (
                        id,
                        tituloMarketplace,
                        descricao,
                        precovenda,
                        produto_imagem (
                            url
                        )
                    )
                `)
                .eq('cliente_id', profile.id);
            
            if (error) throw error;
            
            // Format data for easier usage
            const formattedFavorites = data?.map((item: any) => ({
                id: item.produto_id,
                name: item.produto?.tituloMarketplace || item.produto?.descricao || 'Produto sem nome',
                price: item.produto?.precovenda || 0,
                image: item.produto?.produto_imagem?.[0]?.url || null
            })) || [];

            setFavorites(formattedFavorites);

        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar favoritos");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="container mx-auto py-10 px-4">
             <div className="flex items-center gap-2 mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-red-600">
                    <Heart className="fill-current" /> Meus Favoritos
                </h1>
                <span className="text-sm text-muted-foreground">({favorites.length} itens)</span>
             </div>
            
            {(loading || authLoading) && favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted-foreground animate-pulse">Sincronizando seus favoritos...</p>
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
                    Sua lista de desejos está vazia.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {favorites.map((product) => (
                        <FavoriteItem 
                            key={product.id} 
                            product={product} 
                            onRemove={() => {
                                toggleWishlist(product.id);
                                setFavorites(prev => prev.filter(p => p.id !== product.id));
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function FavoriteItem({ product, onRemove }: { product: any, onRemove: () => void }) {
    return (
        <Card className="relative group overflow-hidden hover:shadow-lg transition-all">
             <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                        Sem imagem
                    </div>
                )}
                 <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onRemove}
                >
                    <Trash2 size={16} />
                </Button>
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1 text-sm" title={product.name}>{product.name}</h3>
                <p className="text-primary font-bold mt-1">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </p>
                <Link href={`/produto/${product.id}`}>
                    <Button variant="outline" className="w-full mt-3 text-xs">Ver Detalhes</Button>
                </Link>
            </CardContent>
        </Card>
    )
}
