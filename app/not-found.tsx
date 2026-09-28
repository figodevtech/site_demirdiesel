import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/SearchInput";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center font-mono font-black text-2xl mb-4 border border-border shadow-xs">
        404
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Página ou Peça não Encontrada
      </h1>

      <p className="text-xs sm:text-sm text-muted-foreground mt-2 mb-6">
        O componente ou endereço solicitado não está disponível ou foi movido. Use a busca abaixo para localizar a peça desejada.
      </p>

      <div className="w-full mb-6">
        <SearchInput placeholder="Buscar por peça, módulo ou referência..." />
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild variant="default" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-9">
          <Link href="/">
            <Home className="w-3.5 h-3.5" />
            <span>Página Inicial</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-9">
          <Link href="/produtos">
            <Package className="w-3.5 h-3.5" />
            <span>Ver Catálogo</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
