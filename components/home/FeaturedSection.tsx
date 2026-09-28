import React from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { PublicProduct } from "@/lib/catalog/types";

interface FeaturedSectionProps {
  products: PublicProduct[];
  title?: string;
  subtitle?: string;
}

export function FeaturedSection({
  products,
  title = "Destaques & Oportunidades em Estoque",
  subtitle = "Componentes diesel revisados e genuínos com disponibilidade imediata.",
}: FeaturedSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-slate-50 dark:bg-slate-900/40 py-14 md:py-20 border-y border-border/60">
      <div className="container mx-auto px-4">
        {/* Header da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Estoque Imediato</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-border/80 hover:border-primary text-foreground hover:text-primary transition-all shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.slice(0, 8).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
