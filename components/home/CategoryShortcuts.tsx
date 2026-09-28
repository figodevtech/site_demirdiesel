import React from "react";
import Link from "next/link";
import { Cpu, Fuel, Settings, Gauge, Filter, Wrench, ArrowRight } from "lucide-react";
import { HOME_HIGHLIGHT_CATEGORIES } from "@/lib/catalog/categories";

const iconMap: Record<string, React.ElementType> = {
  Cpu,
  Fuel,
  Settings,
  Gauge,
  Filter,
  Wrench,
};

export function CategoryShortcuts() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Especialidades Comerciais
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Navegue por Linhas de Componentes
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Peças catalogadas e categorizadas para facilitar o diagnóstico e a manutenção rápida.
          </p>
        </div>

        <Link
          href="/produtos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>Explorar todos os grupos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {HOME_HIGHLIGHT_CATEGORIES.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Settings;

          return (
            <Link
              key={cat.slug}
              href={`/produtos?q=${encodeURIComponent(cat.query)}`}
              className="group relative flex flex-col p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                <IconComponent className="w-5 h-5 stroke-[1.75]" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {cat.tag}
              </span>

              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                {cat.name}
              </h3>

              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed hidden sm:block">
                {cat.description}
              </p>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver peças</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
