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

  if (isAuthRoute) {
    return <main className="min-h-svh w-full">{children}</main>;
  }

  return (
    <WishlistProvider>
      <CartProvider>
        {navbar}
        <main className="flex w-full flex-1 flex-col pb-16 md:pb-0">{children}</main>
        {footer}
        {bottomNav}
      </CartProvider>
    </WishlistProvider>
  );
}
