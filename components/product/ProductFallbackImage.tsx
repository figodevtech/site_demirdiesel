import React from "react";
import { Cpu, Cog } from "lucide-react";

interface ProductFallbackImageProps {
  className?: string;
  category?: string;
}

export function ProductFallbackImage({ className = "", category = "" }: ProductFallbackImageProps) {
  const isModule = category.toLowerCase().includes("módulo") || category.toLowerCase().includes("modulo") || category.toLowerCase().includes("sensor");

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-linear-to-b from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-900 text-slate-400 p-6 relative overflow-hidden select-none ${className}`}
      aria-label="Foto em atualização técnica"
    >
      {/* Background blueprint subtle grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #94A3B8 1px, transparent 0)`,
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary shadow-md shadow-slate-900/10 dark:bg-slate-800 dark:shadow-black/30">
          {isModule ? (
            <Cpu className="w-7 h-7 stroke-[1.5]" />
          ) : (
            <Cog className="w-7 h-7 stroke-[1.5] animate-[spin_12s_linear_infinite]" />
          )}
        </div>
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block">
            Demir Diesel
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            Foto Técnica em Atualização
          </span>
        </div>
      </div>
    </div>
  );
}
