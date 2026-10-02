"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Search, Heart, ShoppingBag, UserRound, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { useAuth } from "@/components/providers/AuthContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useVirtualKeyboardOpen } from "@/hooks/use-virtual-keyboard";
import { haptic } from "@/lib/haptics";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number | null;
}

const ACCOUNT_ROUTES = ["/conta", "/pedidos", "/enderecos", "/login", "/registro"];

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { wishlistIds } = useWishlist();
  const isKeyboardOpen = useVirtualKeyboardOpen();

  // Esconder bottom navigation durante checkout e na página de detalhes do produto
  // para dar total visibilidade e prioridade ao CTA de compra fixo mobile (Prioridade 13)
  if (pathname.startsWith("/checkout") || pathname.startsWith("/produto/")) {
    return null;
  }

  const navItems: NavItem[] = [
    { label: "Início", href: "/", icon: Home, isActive: pathname === "/" },
    {
      label: "Buscar",
      href: "/buscar",
      icon: Search,
      isActive:
        pathname.startsWith("/buscar") || pathname.startsWith("/produtos") || pathname.startsWith("/categoria"),
    },
    {
      label: "Favoritos",
      href: "/favoritos",
      icon: Heart,
      isActive: pathname === "/favoritos",
      badge: wishlistIds.length > 0 ? wishlistIds.length : null,
    },
    {
      label: "Carrinho",
      href: "/carrinho",
      icon: ShoppingBag,
      isActive: pathname === "/carrinho",
      badge: totalItems > 0 ? totalItems : null,
    },
    {
      label: "Conta",
      href: user ? "/conta" : "/login?redirect=/conta",
      icon: UserRound,
      isActive: ACCOUNT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    },
  ];

  return (
    <nav
      aria-label="Navegação móvel principal"
      /* Com o teclado virtual aberto a barra recolhe para não cobrir o campo em edição. */
      inert={isKeyboardOpen}
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-border/80 shadow-[0_-2px_12px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] select-none [-webkit-touch-callout:none] transition-transform duration-200 ease-out ${
        isKeyboardOpen ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="grid h-16 grid-cols-5 items-stretch px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              onClick={() => {
                if (!item.isActive) haptic("selection");
              }}
              className={`group relative flex flex-col items-center justify-center gap-1 outline-none transition-colors duration-150 ${
                item.isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className="relative flex h-8 w-14 items-center justify-center">
                {item.isActive && (
                  <motion.span
                    layoutId="bottom-nav-active-pill"
                    className="absolute inset-0 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.8 }}
                  />
                )}
                <span className="relative transition-transform duration-150 ease-out group-active:scale-85">
                  <Icon className={`size-5.5 ${item.isActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
                </span>
                {item.badge != null && (
                  <motion.span
                    key={item.badge}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 18 }}
                    className="absolute -top-1 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </motion.span>
                )}
              </span>
              <span className={`text-[11px] leading-none tracking-tight ${item.isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
