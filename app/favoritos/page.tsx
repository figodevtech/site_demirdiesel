"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingBag, Loader2, ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useCart } from "@/components/providers/CartContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";

export default function FavoritosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/favoritos");
      } else if (profile?.id) {
        fetchFavorites();
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorito")
        .select(`
          produto_id,
          produto (
            id,
            titulo,
            tituloMarketplace,
            precovenda,
            estoque,
            referencia,
            fabricante,
            imgUrl,
            produtogrupo (
              nome
            )
          )
        `)
        .eq("cliente_id", profile.id);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => {
        const p = item.produto;
        return {
          id: String(item.produto_id),
          title: p?.tituloMarketplace || p?.titulo || "Peça Diesel",
          price: Number(p?.precovenda) || 0,
          stock: Number(p?.estoque) || 0,
          brand: p?.fabricante || "Genuíno",
          reference: p?.referencia,
          category: p?.produtogrupo?.nome || "Geral",
          image: p?.imgUrl || "",
        };
      });

      setFavorites(formatted);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar sua lista de favoritos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddToCart = (item: any) => {
    addToCart(
      {
        id: item.id,
        name: item.title,
        price: item.price,
        image: item.image,
        brand: item.brand,
        stock: item.stock,
      },
      1
    );
    toast.success("Item adicionado ao carrinho!");
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500/20" />
            <span>Peças Favoritas</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {favorites.length} {favorites.length === 1 ? "item salvo" : "itens salvos"}
          </p>
        </div>

        <Link
          href="/produtos"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explorar Catálogo</span>
        </Link>
      </div>

      {loading || authLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Sincronizando seus favoritos...</span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-border/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Heart className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Sua lista está vazia</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Salve os componentes diesel e módulos que deseja acompanhar ou comprar mais tarde.
          </p>
          <Button asChild className="rounded-xl px-6 font-semibold text-xs h-9">
            <Link href="/produtos">Ver Catálogo de Peças</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs flex flex-col justify-between gap-3 group"
            >
              <div className="flex gap-3 items-start">
                <div className="relative w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <ProductFallbackImage category={product.category} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    {product.brand}
                  </span>
                  <Link
                    href={`/produto/${product.id}`}
                    className="font-bold text-xs text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug block"
                  >
                    {product.title}
                  </Link>
                  {product.reference && (
                    <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                      Ref: {product.reference}
                    </span>
                  )}
                  <span className="font-bold text-sm text-foreground block mt-1">
                    {product.price > 0 ? formatCurrency(product.price) : "Sob Consulta"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 text-xs font-semibold h-8 rounded-xl gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(product.id)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 rounded-xl"
                  aria-label="Remover dos favoritos"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
