"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
  const pathname = usePathname();
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

  // Ao mudar de rota: garante header visível, fecha drawer, zera referências e limpa foco residual
  useEffect(() => {
    setIsVisible(true);
    isVisibleRef.current = true;
    lastScrollYRef.current = typeof window !== "undefined" ? Math.max(0, window.scrollY) : 0;
    setIsDrawerOpen(false);
    setIsSearchActive(false);

    if (
      document.activeElement instanceof HTMLElement &&
      headerRef.current?.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
  }, [pathname]);

  useEffect(() => {
    let frameId: number | null = null;
    const TOP_THRESHOLD = 50; // scrollY < 50px -> sempre visível
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

        // 1. Próximo ao topo (< 50px): NUNCA esconder
        if (currentScrollY <= TOP_THRESHOLD) {
          if (!isVisibleRef.current) {
            isVisibleRef.current = true;
            setIsVisible(true);
          }
          lastScrollYRef.current = currentScrollY;
          frameId = null;
          return;
        }

        // 2. Se houver interação ativa (drawer aberto, busca em uso ou input focado no header): manter visível
        const isInputFocused =
          headerRef.current &&
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA") &&
          headerRef.current.contains(document.activeElement);

        if (isDrawerOpenRef.current || isSearchActiveRef.current || isInputFocused) {
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
          // Scroll PARA BAIXO -> subir suavemente
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

    lastScrollYRef.current = typeof window !== "undefined" ? Math.max(0, window.scrollY) : 0;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <motion.header
      ref={headerRef}
      initial={false}
      animate={{
        y: isVisible ? 0 : "-100%",
      }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`sticky top-0 z-50 w-full ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
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

          <Link href="/" className="flex items-center gap-2 group py-1" aria-label="Demir Diesel Página Inicial">
            {/* Logotipo Oficial Demir Diesel */}
            <div className="relative h-10 flex items-center">
              <Image
                src="/images/demir-logo.png"
                alt="Demir Diesel - Injeção Eletrônica a Diesel"
                width={200}
                height={77}
                priority
                className="h-9 sm:h-10 w-auto object-contain dark:hidden transition-transform duration-300 group-hover:scale-105"
              />
              <Image
                src="/images/demir-logo-dark.png"
                alt="Demir Diesel - Injeção Eletrônica a Diesel"
                width={200}
                height={77}
                priority
                className="h-9 sm:h-10 w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
              />
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
    </motion.header>
  );
}

export default Header;
