"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Search, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { useWishlist } from "@/lib/hooks/useWishlist";

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { wishlistIds } = useWishlist();

  // Esconder bottom navigation durante tela de pagamento/checkout para evitar distração (Regra 26)
  if (pathname.startsWith("/checkout")) {
    return null;
  }

  const navItems = [
    {
      label: "Início",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Catálogo",
      href: "/produtos",
      icon: Package,
      isActive: pathname.startsWith("/produtos") || pathname.startsWith("/categoria"),
    },
    {
      label: "Buscar",
      href: "/buscar",
      icon: Search,
      isActive: pathname.startsWith("/buscar"),
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
  ];

  return (
    <nav
      aria-label="Navegação móvel principal"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full relative transition-colors active:scale-95 ${
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
