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
  title = "Pronta entrega",
  subtitle = "Produtos disponíveis agora, com preço e estoque atualizados.",
}: FeaturedSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-slate-50 py-8 shadow-[inset_0_12px_24px_-24px_rgba(15,23,42,0.35),inset_0_-12px_24px_-24px_rgba(15,23,42,0.35)] dark:bg-slate-900/40 sm:py-12">
      <div className="container mx-auto px-4">
        {/* Header da Seção */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Estoque Imediato</span>
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1 hidden max-w-xl text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          </div>

          <Link
            href="/produtos"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-md shadow-slate-900/8 transition-all hover:-translate-y-0.5 hover:text-primary hover:shadow-lg dark:bg-slate-800 dark:shadow-black/25"
          >
            <span className="hidden sm:inline">Ver catálogo completo</span>
            <span className="sm:hidden">Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 10).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 5}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
