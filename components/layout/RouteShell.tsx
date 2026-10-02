"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/providers/CartContext";
import { WishlistProvider } from "@/components/providers/WishlistContext";

const AUTH_ROUTES = new Set(["/login", "/registro"]);

interface RouteShellProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
  bottomNav: React.ReactNode;
}

export function RouteShell({
  children,
  navbar,
  footer,
  bottomNav,
}: RouteShellProps) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  // No mobile há sempre uma barra fixa inferior (BottomNav ou CTA do produto), exceto no checkout.
  const hasFixedBottomBar = !pathname.startsWith("/checkout");

  if (isAuthRoute) {
    return <main className="min-h-svh w-full">{children}</main>;
  }

  return (
    <WishlistProvider>
      <CartProvider>
        {navbar}
        <main className="flex w-full flex-1 flex-col">{children}</main>
        {footer}
        {hasFixedBottomBar && (
          // Reserva o espaço da barra fixa + área de gestos para não cobrir o fim do rodapé.
          <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] shrink-0 bg-secondary md:hidden" />
        )}
        {bottomNav}
      </CartProvider>
    </WishlistProvider>
  );
}
