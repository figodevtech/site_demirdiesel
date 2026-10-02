"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingBag, ArrowLeft, ArrowUpRight } from "lucide-react";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { useAuth } from "@/components/providers/AuthContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useCart } from "@/components/providers/CartContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";
import { Card, CardContent } from "@/components/ui/card";

interface FavoriteItem {
  id: string;
  title: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  brand: string | null;
  reference: string | null;
  category: string;
  image: string;
}

interface FavoriteRelation {
  produto_id: number;
  produto: {
    titulo: string | null;
    tituloMarketplace: string | null;
    precovenda: number | null;
    estoque: number | null;
    referencia: string | null;
    fabricante: string | null;
    imgUrl: string | null;
    produtogrupo: { nome: string | null } | null;
  } | null;
}

export default function FavoritosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const fetchFavorites = useCallback(async () => {
    if (!profile?.id) return;
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

      const formatted = ((data || []) as unknown as FavoriteRelation[]).map((item) => {
        const p = item.produto;
        const stock = Number(p?.estoque) || 0;
        return {
          id: String(item.produto_id),
          title: p?.tituloMarketplace || p?.titulo || "Peça Diesel",
          price: Number(p?.precovenda) || 0,
          stock,
          isAvailable: stock > 0,
          brand: p?.fabricante || null,
          reference: p?.referencia ?? null,
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
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login?redirect=/favoritos");
    else if (profile?.id) void fetchFavorites();
    else setLoading(false);
  }, [authLoading, fetchFavorites, profile?.id, router, user]);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddToCart = (item: FavoriteItem) => {
    if (item.price <= 0) {
      toast.info("Este item é sob consulta. Entre em contato pelo WhatsApp para consultar o valor.");
      return;
    }
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
    <AccountShell>
      <AccountSectionHeader
        icon={Heart}
        title="Favoritos"
        description={`${favorites.length} ${favorites.length === 1 ? "item salvo" : "itens salvos"}`}
        action={
          <Button asChild variant="outline" className="h-10 w-full gap-2 sm:w-auto">
            <Link href="/produtos"><ArrowLeft className="size-4" />Explorar catálogo</Link>
          </Button>
        }
      />

      <Card className="min-h-[32rem] border-0 py-0 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
        <CardContent className="p-5 sm:p-6">

      {loading || authLoading ? (
        <ListSkeleton rows={4} variant="row" />
      ) : favorites.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Heart className="size-7 stroke-[1.5]" />
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col justify-between gap-3 rounded-2xl bg-card p-4 shadow-lg shadow-slate-900/8 transition-shadow hover:shadow-xl dark:shadow-black/25"
            >
              <div className="flex gap-3 items-start">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1 shadow-sm shadow-slate-900/6 dark:bg-slate-900 dark:shadow-black/20">
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
                  {product.brand && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      {product.brand}
                    </span>
                  )}
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
                  {product.price > 0 ? (
                    <span className="font-bold text-sm text-foreground block mt-1">
                      {formatCurrency(product.price)}
                    </span>
                  ) : product.isAvailable ? (
                    <Link
                      href={`/produto/${product.id}`}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors block mt-1"
                    >
                      Consulte Valor
                    </Link>
                  ) : (
                    <span className="font-semibold text-xs text-rose-600 dark:text-rose-400 block mt-1">
                      Sem estoque
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                {product.price > 0 ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.isAvailable && product.stock <= 0}
                    className="flex-1 text-xs font-semibold h-8 rounded-xl gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </Button>
                ) : product.isAvailable ? (
                  <Button
                    asChild
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs font-semibold h-8 rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-xs"
                  >
                    <Link href={`/produto/${product.id}`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Ver Produto</span>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="flex-1 text-xs font-semibold h-8 rounded-xl"
                  >
                    Indisponível
                  </Button>
                )}

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
        </CardContent>
      </Card>
    </AccountShell>
  );
}
