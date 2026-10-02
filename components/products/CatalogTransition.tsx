"use client";

import React, { createContext, useContext, useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";

interface CatalogTransitionValue {
  isPending: boolean;
  navigate: (url: string, options?: { scroll?: boolean }) => void;
}

const CatalogTransitionContext = createContext<CatalogTransitionValue | null>(null);

/**
 * Filtros, ordenação e paginação navegam dentro de uma transição: a barra de progresso aparece
 * no mesmo instante do toque e a grade atual fica esmaecida até a nova lista chegar
 * (em vez de a tela parecer "travada").
 */
export function CatalogTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (url: string, options?: { scroll?: boolean }) => {
    startTransition(() => {
      router.push(url, { scroll: options?.scroll ?? true });
    });
  };

  return (
    <CatalogTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </CatalogTransitionContext.Provider>
  );
}

export function useCatalogNavigation() {
  const context = useContext(CatalogTransitionContext);
  const router = useRouter();
  if (context) return context;
  // Fora do provider (uso isolado): navega normalmente.
  return { isPending: false, navigate: (url: string) => router.push(url) };
}

export function CatalogPendingArea({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { isPending } = useCatalogNavigation();
  return (
    <div
      aria-busy={isPending}
      className={`transition-opacity duration-150 ${isPending ? "pointer-events-none opacity-55" : "opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}
