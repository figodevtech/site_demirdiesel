import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HOME_HIGHLIGHT_CATEGORIES } from "@/lib/catalog/categories";

export function CategoryShortcuts() {
  const categories = HOME_HIGHLIGHT_CATEGORIES.slice(0, 6);

  return (
    <section className="container mx-auto px-4 py-6 sm:py-8">
      {/* Cabeçalho discreto */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Navegue por Categorias
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Atalhos rápidos para as principais linhas do catálogo
          </p>
        </div>

        <Link
          href="/produtos"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid de 6 atalhos discretos na mesma linha com imagem ocupando 100% do card */}
      <div className="flex md:grid md:grid-cols-6 gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/produtos?category=${cat.slug}`}
            className="group relative flex items-end justify-center p-2.5 sm:p-3 rounded-xl overflow-hidden border border-border/70 hover:border-primary/60 shadow-xs transition-all duration-300 shrink-0 w-[115px] sm:w-[130px] md:w-auto h-20 sm:h-24"
          >
            {/* Imagem preenchendo o card completamente */}
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 130px, 200px"
              className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            />

            {/* Gradiente escuro para legibilidade garantida */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 group-hover:from-black/90 group-hover:via-black/50 transition-colors" />

            {/* Nome da categoria sobreposto */}
            <span className="relative z-10 text-[11px] sm:text-xs font-bold text-white text-center leading-tight drop-shadow-md group-hover:text-amber-400 transition-colors line-clamp-2 px-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryShortcuts;
