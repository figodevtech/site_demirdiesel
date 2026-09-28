"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageCircle, Heart, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import SidebarDrawer from "./SidebarDrawer";
import CartWidget from "./CartWidget";
import UserWidget from "./UserWidget";
import { PublicCategory } from "@/lib/catalog/types";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";

interface HeaderProps {
  categories: PublicCategory[];
}

export function Header({ categories }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { wishlistIds } = useWishlist();
  const isScrolledRef = useRef(false);

  useEffect(() => {
    let frameId: number | null = null;
    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        const nextIsScrolled = window.scrollY > 20;
        if (nextIsScrolled !== isScrolledRef.current) {
          isScrolledRef.current = nextIsScrolled;
          setIsScrolled(nextIsScrolled);
        }
        frameId = null;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300 ease-in-out ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-white dark:bg-slate-900 border-b border-border/60"
      }`}
    >
      {/* Top Banner de Engenharia / Suporte */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 hidden md:block border-b border-slate-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Laboratório Especializado:</span>
            <span className="text-slate-300">
              Venda e Reparo de Módulos, Injeção Eletrônica e Motores Diesel
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-primary" />
              <span>{siteConfig.address.city} - {siteConfig.address.state}</span>
            </span>
            <span className="h-3 w-px bg-slate-700" />
            <a
              href={buildWhatsAppUrl("Olá, gostaria de um orçamento de peças diesel.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Plantão Técnico WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Esquerda: Menu Drawer Mobile & Logotipo Demir Diesel */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarDrawer categories={categories as any} />
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
          <SearchInput />
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
        <SearchInput placeholder="Buscar peça, módulo ou referência..." />
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
