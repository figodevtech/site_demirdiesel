"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Boxes, ChevronRight, Headphones, Heart, MessageCircle, PackageCheck, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchInput } from "./SearchInput";
import SidebarDrawer from "./SidebarDrawer";
import CartWidget from "./CartWidget";
import UserWidget from "./UserWidget";
import { PublicCategory } from "@/lib/catalog/types";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { buildWhatsAppUrl } from "@/lib/site-config";
import { formatCategoryName } from "@/lib/utils";

interface HeaderProps {
  categories: PublicCategory[];
}

const FALLBACK_CATEGORIES: PublicCategory[] = [
  { id: -1, name: "Módulos eletrônicos", slug: "modulos", description: null },
  { id: -2, name: "Injeção e bombas", slug: "injecao", description: null },
  { id: -3, name: "Componentes de motor", slug: "motor", description: null },
  { id: -4, name: "Filtros", slug: "filtros", description: null },
];

export function Header({ categories }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const { wishlistIds } = useWishlist();

  const lastScrollYRef = useRef(0);
  const isVisibleRef = useRef(true);
  const isDrawerOpenRef = useRef(false);
  const isSearchActiveRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const storeCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const handleDrawerOpenChange = (open: boolean) => {
    isDrawerOpenRef.current = open;
    if (open) {
      isVisibleRef.current = true;
      setIsVisible(true);
    }
  };

  const handleSearchActiveChange = (active: boolean) => {
    isSearchActiveRef.current = active;
    if (active) {
      isVisibleRef.current = true;
      setIsVisible(true);
    }
  };

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
      className={`sticky top-0 z-50 w-full pt-[env(safe-area-inset-top,0px)] ${
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
              categories={categories}
              onOpenChange={handleDrawerOpenChange}
            />
          </div>

          <Link href="/" className="group flex shrink-0 items-center" aria-label="Demir Diesel - início">
            <Image
              src="/brand/demir-logo.avif"
              alt="Demir Diesel"
              width={256}
              height={99}
              priority
              className="h-auto w-[116px] transition-transform duration-300 group-hover:scale-[1.02] sm:w-[138px]"
              sizes="(max-width: 640px) 116px, 138px"
            />
          </Link>
        </div>

        {/* Centro: Campo de Busca Desktop em Destaque */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <SearchInput onSearchActiveChange={handleSearchActiveChange} />
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
          onSearchActiveChange={handleSearchActiveChange}
        />
      </div>

      <nav aria-label="Navegação da loja" className="hidden border-t border-primary/15 bg-card md:block">
        <div className="container mx-auto flex h-12 items-center gap-2 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-3 text-xs font-bold text-foreground/80 data-[state=open]:bg-muted">
                <Boxes className="size-4" /> Departamentos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-[680px] rounded-md border-t-2 border-t-primary p-0 shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide">Todos os departamentos</span>
                <Link href="/produtos" className="text-xs font-semibold text-primary hover:underline">Ver todos</Link>
              </div>
              <div className="grid max-h-[360px] grid-cols-3 gap-x-2 overflow-y-auto p-2">
                {storeCategories.map((category) => (
                  <DropdownMenuItem asChild key={category.id} className="p-0">
                    <Link href={`/produtos?category=${category.slug}`} className="group flex min-w-0 items-center gap-2 border-b border-border/50 px-3 py-2.5">
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      <span className="min-w-0 truncate text-xs font-semibold text-foreground">{formatCategoryName(category.name)}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
            <NavLink href="/produtos" icon={<PackageSearch className="size-3.5" />}>Catálogo</NavLink>
            <NavLink href="/produtos?estoque=disponivel" icon={<PackageCheck className="size-3.5" />}>Pronta entrega</NavLink>
            {storeCategories.slice(0, 3).map((category) => (
              <NavLink href={`/produtos?category=${category.slug}`} key={category.id}>{formatCategoryName(category.name)}</NavLink>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <NavLink href="/pedidos" icon={<PackageSearch className="size-3.5" />}>Pedidos</NavLink>
            <NavLink href="/fale-conosco" icon={<Headphones className="size-3.5" />} emphasis>Atendimento</NavLink>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}

export default Header;

function NavLink({ href, icon, children, emphasis = false }: { href: string; icon?: React.ReactNode; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <Button asChild variant="ghost" size="sm" className={`h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold ${emphasis ? "text-primary" : "text-foreground/75"}`}>
      <Link href={href}>{icon}{children}</Link>
    </Button>
  );
}
