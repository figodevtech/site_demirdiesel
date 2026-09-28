import React from "react";
import Link from "next/link";
import { Cpu, Fuel, Wrench, ShieldCheck, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";

export function DieselLaboratory() {
  const services = [
    {
      icon: Cpu,
      title: "Módulos ECM & Eletrônica",
      desc: "Reparo, programação, clonagem e testes em bancada de centrais Scania, Volvo, Mercedes-Benz, Cummins e Iveco.",
    },
    {
      icon: Fuel,
      title: "Injeção Diesel Common Rail",
      desc: "Calibração e diagnóstico de bicos injetores indutivos e piezoelétricos, bombas de alta pressão e unidades UIS/UPS.",
    },
    {
      icon: Wrench,
      title: "Oficina & Mecânica Pesada",
      desc: "Retífica, montagem e revisão completa de motores pesados, turbinas, compressores e sistemas de freio pneumático.",
    },
    {
      icon: ShieldCheck,
      title: "Laudo & Garantia Técnica",
      desc: "Peças e serviços acompanhados de relatório técnico de estanqueidade, vazão e curva de pressão comprovadas.",
    },
  ];

  return (
    <section className="bg-slate-950 text-white py-16 md:py-24 relative overflow-hidden border-b border-slate-800">
      {/* Detalhes de iluminação técnica */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Lado Esquerdo: Conteúdo Institucional */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-400 font-semibold font-mono">
              <span>DEMIR DIESEL LAB</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Laboratório Avançado de Eletrônica & Injeção Diesel
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Combinamos bancadas computadorizadas de teste com sólida experiência técnica
              em mecânica pesada. Diagnosticamos e solucionamos falhas complexas com precisão cirúrgica.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simuladores de sinal de virabrequim e comando para ECM</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Estoque imediato de peças para reposição rápida</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Atendimento especializado para transportadoras, oficinas e frotistas</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={buildWhatsAppUrl("Olá, gostaria de consultar o laboratório Demir Diesel sobre um módulo ou bomba.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com o Laboratório</span>
              </a>

              <Link
                href="/fale-conosco"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-white font-medium transition-colors"
              >
                <span>Conheça nossa estrutura física</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Lado Direito: Grid de Capacidades Técnicas */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
