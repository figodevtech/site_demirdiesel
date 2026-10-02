"use client";

import Link from "next/link";
import { CreditCard, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { SearchInput } from "@/components/layout/SearchInput";
import { HeroProductStack } from "./HeroProductStack";
import type { PublicProduct } from "@/lib/catalog/types";

const QUICK_TAGS = [
  { label: "Módulos", query: "modulo" },
  { label: "Bicos", query: "bico" },
  { label: "Bombas", query: "bomba" },
  { label: "Filtros", query: "filtro" },
  { label: "Turbinas", query: "turbina" },
];

const BENEFITS = [
  { icon: Truck, label: "Envio nacional" },
  { icon: CreditCard, label: "PIX, cartão ou boleto" },
  { icon: ShieldCheck, label: "Compra protegida" },
  { icon: PackageCheck, label: "Estoque atualizado" },
];

export function HeroSection({ featuredProducts = [] }: { featuredProducts?: PublicProduct[] }) {
  return (
    <section className="relative overflow-hidden border-b border-secondary bg-secondary text-white">
      <div className="pointer-events-none absolute -right-32 -top-48 size-[34rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-primary via-sky-400 to-cyan-300" />
      <div className="container mx-auto grid grid-cols-1 gap-7 px-4 pb-7 pt-6 md:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)] md:items-center md:gap-10 md:pb-10 md:pt-10">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/25 px-3 py-1.5 text-[11px] font-semibold text-white">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Peças diesel para pronta entrega
          </div>

          <h1 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
            Encontre a peça certa para manter seu veículo rodando.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Busque por nome, referência ou fabricante. Catálogo especializado em módulos,
            injeção e componentes para linha diesel pesada.
          </p>

          <div className="mt-6 max-w-2xl rounded-2xl bg-white/8 p-2 shadow-2xl shadow-black/25">
            <SearchInput
              className="w-full"
              inputClassName="h-12 border-0 bg-white text-sm font-medium text-slate-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-base"
              placeholder="Qual peça você está procurando?"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_TAGS.map((tag) => (
              <Link
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-blue-100 transition hover:border-primary hover:bg-primary/20 hover:text-white"
                href={"/produtos?q=" + encodeURIComponent(tag.query)}
                key={tag.label}
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        <HeroProductStack products={featuredProducts} />
      </div>

      <div className="border-t border-white/10 bg-white/5">
        <div className="container mx-auto grid grid-cols-2 divide-x divide-y divide-white/10 px-4 sm:grid-cols-4 sm:divide-y-0">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <div className="flex items-center gap-2 px-3 py-3 text-[11px] font-medium text-slate-300 sm:justify-center sm:text-xs" key={label}>
              <Icon className="size-4 shrink-0 text-cyan-300" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
