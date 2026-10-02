"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, CreditCard, Heart, KeyRound, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const accountNavigation = [
  { href: "/conta", label: "Meu perfil", icon: UserRound },
  { href: "/enderecos", label: "Endereços", icon: MapPin },
  { href: "/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/conta/cartoes", label: "Cartões salvos", icon: CreditCard },
  { href: "/conta/seguranca", label: "Segurança", icon: KeyRound },
];

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const metadataName = typeof metadata?.name === "string" ? metadata.name : "";
  const customerName = profile?.nomerazaosocial || metadataName || "Cliente";

  return (
    <div className="container mx-auto max-w-7xl px-4 pb-10 pt-3 md:pt-5">
      <div className="grid min-h-[calc(100vh-12rem)] items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)]">
          <Card className="overflow-hidden border-0 py-0 shadow-lg shadow-slate-900/8 dark:shadow-black/25 lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col">
            <div className="shrink-0 bg-primary px-5 pb-5 pt-4 text-primary-foreground">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
                Área do cliente
              </span>
              <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-12 bg-primary-foreground/15 shadow-sm ring-2 ring-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/15 text-sm font-bold text-primary-foreground">{getInitials(customerName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{customerName}</p>
                <p className="truncate text-xs text-primary-foreground/70">{user?.email || ""}</p>
              </div>
              </div>
            </div>
            <Separator className="hidden lg:block" />
            <nav aria-label="Navegação da conta" className="flex gap-2 overflow-x-auto p-2.5 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:p-3">
              {accountNavigation.map((item) => {
                const isActive = item.href === "/conta" ? pathname === "/conta" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Button key={item.href} asChild variant="ghost" className={cn(
                    "h-10 shrink-0 justify-start gap-2.5 px-3 text-xs font-semibold lg:w-full lg:text-sm",
                    isActive ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:bg-primary/[0.07] hover:text-foreground",
                  )}>
                    <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                      <Icon className="size-4" /><span>{item.label}</span>
                      <ChevronRight className="ml-auto hidden size-4 opacity-60 lg:block" />
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <div className="hidden shrink-0 px-3 pb-3 lg:block">
              <Separator className="mb-3" />
              <Button type="button" variant="ghost" onClick={() => void signOut()} className="h-10 w-full justify-start gap-2.5 px-3 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="size-4" />Sair da conta
              </Button>
            </div>
          </Card>
        </aside>
        <main className="min-w-0 lg:min-h-[calc(100vh-12rem)]">{children}</main>
      </div>
    </div>
  );
}

export function AccountSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
