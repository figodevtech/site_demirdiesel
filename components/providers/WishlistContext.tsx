"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: number[];
  isLoading: boolean;
  loading: boolean;
  toggleWishlist: (produtoId: string | number) => Promise<void>;
  isInWishlist: (produtoId: string | number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlistIds = useCallback(async () => {
    if (!profile?.id) {
      setWishlistIds([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorito")
        .select("produto_id")
        .eq("cliente_id", profile.id);

      if (error) {
        console.error("Erro ao carregar favoritos:", error);
      } else {
        setWishlistIds((data || []).map((item) => Number(item.produto_id)).filter(Boolean));
      }
    } catch (err) {
      console.error("Exceção ao buscar favoritos:", err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchWishlistIds();
    } else {
      setWishlistIds([]);
    }
  }, [profile?.id, fetchWishlistIds]);

  const toggleWishlist = async (produtoId: string | number) => {
    if (!user || !profile) {
      toast.error("Faça login para adicionar produtos aos favoritos.");
      return;
    }

    const idAsNumber = Number(produtoId);
    if (isNaN(idAsNumber) || idAsNumber <= 0) {
      console.error("ID de produto inválido para favoritos:", produtoId);
      return;
    }

    const isFavorited = wishlistIds.includes(idAsNumber);

    // Atualização otimista imediata compartilhada por todos os cards
    setWishlistIds((prev) =>
      isFavorited ? prev.filter((id) => id !== idAsNumber) : [...prev, idAsNumber]
    );

    setIsLoading(true);
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorito")
          .delete()
          .eq("cliente_id", profile.id)
          .eq("produto_id", idAsNumber);

        if (error) {
          // Reverte otimismo em caso de falha
          setWishlistIds((prev) => [...prev, idAsNumber]);
          throw error;
        }
        toast.success("Removido dos favoritos.");
      } else {
        const { error } = await supabase.from("favorito").insert({
          cliente_id: profile.id,
          produto_id: idAsNumber,
        });

        if (error) {
          if (error.code === "23505") {
            // Violação de chave duplicada (já adicionado)
            toast.success("Já está nos seus favoritos!");
          } else {
            // Reverte otimismo em caso de falha
            setWishlistIds((prev) => prev.filter((id) => id !== idAsNumber));
            throw error;
          }
        } else {
          toast.success("Adicionado aos favoritos!");
        }
      }
    } catch (error: any) {
      console.error("Erro ao alternar favorito:", error);
      toast.error("Não foi possível atualizar favoritos: " + (error.message || "Tente novamente"));
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlist = useCallback(
    (produtoId: string | number) => {
      return wishlistIds.includes(Number(produtoId));
    },
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isLoading,
        loading: isLoading,
        toggleWishlist,
        isInWishlist,
        refreshWishlist: fetchWishlistIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist deve ser utilizado dentro de um <WishlistProvider />.");
  }
  return context;
}
