"use client";

import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/SearchInput";
import { ShieldCheck, Truck, Wrench, Cpu, ArrowRight } from "lucide-react";

export function HeroSection() {
  const quickTags = [
    { label: "Módulos ECM", query: "modulo" },
    { label: "Bicos Injetores", query: "bico" },
    { label: "Bombas de Alta", query: "bomba" },
    { label: "Filtros Racor", query: "filtro" },
    { label: "Turbinas", query: "turbina" },
    { label: "Sensores", query: "sensor" },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white pt-8 pb-16 md:pt-14 md:pb-24 border-b border-slate-800">
      {/* Background industrial texture / subtle radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-slate-800/40 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
        {/* Badge de Credencial */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Demir Diesel:</span>
          <span>Peças, Eletrônica & Injeção Pesada</span>
        </div>

        {/* Headline Principal */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Tecnologia & Peças para manter sua{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-400 via-primary to-cyan-300">
            operação rodando.
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-4 md:mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Catálogo especializado em linha pesada. Módulos eletrônicos, injeção common rail,
          componentes de motor e oficina com diagnóstico avançado.
        </p>

        {/* Campo de Busca em Destaque no Hero */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <SearchInput
              placeholder="Busque por peça, módulo, referência ou fabricante..."
              className="w-full text-base"
            />
          </div>

          {/* Atalhos rápidos de busca */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">Mais buscados:</span>
            {quickTags.map((tag) => (
              <Link
                key={tag.label}
                href={`/produtos?q=${encodeURIComponent(tag.query)}`}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all font-medium"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Métricas e Credenciais Técnicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 md:mt-16 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto text-left">
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <span className="font-mono text-xl sm:text-2xl font-bold text-white block">
              Catálogo
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Peças e Módulos Diesel
            </span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <span className="font-mono text-xl sm:text-2xl font-bold text-sky-400 block">
              Bancada
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Diagnóstico Computadorizado
            </span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <span className="font-mono text-xl sm:text-2xl font-bold text-white block">
              Nacional
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Envio Aéreo & Rodoviário
            </span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 block">
              Oficina
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Estrutura Física Especializada
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
