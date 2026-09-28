"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageCircle, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import SidebarDrawer from "./SidebarDrawer";
import CartWidget from "./CartWidget";
import UserWidget from "./UserWidget";
import { PublicCategory } from "@/lib/catalog/types";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { buildWhatsAppUrl } from "@/lib/site-config";

interface HeaderProps {
  categories: PublicCategory[];
}

export function Header({ categories }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { wishlistIds } = useWishlist();

  const lastScrollYRef = useRef(0);
  const isVisibleRef = useRef(true);
  const isDrawerOpenRef = useRef(false);
  const isSearchActiveRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  // Sincroniza refs para acesso imediato no loop de animação do scroll
  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
    if (isDrawerOpen) {
      isVisibleRef.current = true;
      setIsVisible(true);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    isSearchActiveRef.current = isSearchActive;
    if (isSearchActive) {
      isVisibleRef.current = true;
      setIsVisible(true);
    }
  }, [isSearchActive]);

  useEffect(() => {
    let frameId: number | null = null;
    const TOP_THRESHOLD = 60; // scrollY < 60px -> sempre visível
    const DELTA_TOLERANCE = 8; // tolerância para evitar flicker em micro-movimentos e touch

    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY);
        const lastScrollY = lastScrollYRef.current;
        const diff = currentScrollY - lastScrollY;

        // Atualiza estilização de sombra/blur quando rolar além de 10px
        const nextIsScrolled = currentScrollY > 10;
        setIsScrolled(nextIsScrolled);

        // 1. Próximo ao topo (< 60px): NUNCA esconder
        if (currentScrollY <= TOP_THRESHOLD) {
          if (!isVisibleRef.current) {
            isVisibleRef.current = true;
            setIsVisible(true);
          }
          lastScrollYRef.current = currentScrollY;
          frameId = null;
          return;
        }

        // 2. Se houver interação ativa (drawer aberto, busca em uso ou foco no header): manter visível
        if (
          isDrawerOpenRef.current ||
          isSearchActiveRef.current ||
          (headerRef.current && headerRef.current.contains(document.activeElement))
        ) {
          if (!isVisibleRef.current) {
            isVisibleRef.current = true;
            setIsVisible(true);
          }
          lastScrollYRef.current = currentScrollY;
          frameId = null;
          return;
        }

        // 3. Ignora micro-oscilações menores que a tolerância (evita flickering em touch e scroll)
        if (Math.abs(diff) < DELTA_TOLERANCE) {
          frameId = null;
          return;
        }

        // 4. Detecção de direção do scroll:
        if (diff > 0) {
          // Scroll PARA BAIXO -> esconder suavemente
          if (isVisibleRef.current) {
            isVisibleRef.current = false;
            setIsVisible(false);
          }
        } else {
          // Scroll PARA CIMA -> exibir imediatamente
          if (!isVisibleRef.current) {
            isVisibleRef.current = true;
            setIsVisible(true);
          }
        }

        lastScrollYRef.current = currentScrollY;
        frameId = null;
      });
    };

    lastScrollYRef.current = Math.max(0, window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      onFocusCapture={() => {
        isVisibleRef.current = true;
        setIsVisible(true);
      }}
      className={`sticky top-0 z-50 w-full transform transition-[transform,background-color,border-color,box-shadow] duration-300 ease-in-out motion-reduce:transition-none ${
        isVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
      } ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-white dark:bg-slate-900 border-b border-border/60"
      }`}
    >
      {/* Main Header Row */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Esquerda: Menu Drawer Mobile & Logotipo Demir Diesel */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarDrawer
              categories={categories as any}
              onOpenChange={(open) => setIsDrawerOpen(open)}
            />
          </div>

          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Símbolo Industrial 'D' */}
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm border border-slate-700/50 group-hover:scale-105 transition-transform duration-300">
              <span className="text-primary dark:text-white">D</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  DEMIR
                </span>
                <span className="font-bold text-xl tracking-tight text-primary">
                  DIESEL
                </span>
              </div>
              <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-mono -mt-1">
                Peças & Tecnologia
              </span>
            </div>
          </Link>
        </div>

        {/* Centro: Campo de Busca Desktop em Destaque */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <SearchInput onSearchActiveChange={(active) => setIsSearchActive(active)} />
        </div>

        {/* Direita: Ações (WhatsApp Especialista, Favoritos, Usuário, Carrinho) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Botão rápido WhatsApp Desktop */}
          <a
            href={buildWhatsAppUrl("Olá, preciso de ajuda técnica para encontrar uma peça diesel.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-600/20 transition-colors mr-1"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span>Falar com Técnico</span>
          </a>

          {/* Favoritos com Contador */}
          <Link href="/favoritos" className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 rounded-xl"
              aria-label="Favoritos"
            >
              <Heart className="h-5 w-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Widget de Usuário */}
          <UserWidget />

          {/* Widget do Carrinho */}
          <CartWidget />
        </div>
      </div>

      {/* Barra de Busca no Mobile */}
      <div className="md:hidden px-4 pb-3">
        <SearchInput
          placeholder="Buscar peça, módulo ou referência..."
          onSearchActiveChange={(active) => setIsSearchActive(active)}
        />
      </div>

      {/* Menu Secundário Desktop */}
      <nav className="hidden md:flex border-t border-border/50 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-6 h-10 text-xs font-semibold text-slate-600 dark:text-slate-300 w-full overflow-x-auto no-scrollbar">
            <li>
              <Link
                href="/produtos"
                className="hover:text-primary transition-colors flex items-center gap-1.5 py-1 text-slate-900 dark:text-white"
              >
                <span>Todos os Produtos</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-sm font-mono">
                  Catálogo
                </span>
              </Link>
            </li>
            <li className="h-3 w-px bg-border/80 shrink-0" />
            <li>
              <Link
                href="/produtos?category=modulos"
                className="hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Módulos Eletrônicos</span>
              </Link>
            </li>
            <li>
              <Link
                href="/produtos?category=injecao"
                className="hover:text-primary transition-colors"
              >
                Injeção & Bombas
              </Link>
            </li>
            <li>
              <Link
                href="/produtos?category=motor"
                className="hover:text-primary transition-colors"
              >
                Componentes de Motor
              </Link>
            </li>
            <li>
              <Link
                href="/produtos?category=filtros"
                className="hover:text-primary transition-colors"
              >
                Filtros Racor & Ar
              </Link>
            </li>
            <li className="ml-auto">
              <Link
                href="/fale-conosco"
                className="text-primary hover:underline transition-colors"
              >
                Laboratório & Oficina
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;
