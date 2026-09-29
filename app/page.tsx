import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryShortcuts } from "@/components/home/CategoryShortcuts";
import { BestSellersSection } from "@/components/home/BestSellersSection";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { DieselLaboratory } from "@/components/home/DieselLaboratory";
import { WorkshopLocation } from "@/components/home/WorkshopLocation";
import { getFeaturedProducts, getBestSellerProducts } from "@/lib/catalog/products";

// Revalidação periódica do catálogo na Home
export const revalidate = 60;

export default async function HomePage() {
  const [featuredProducts, bestSellerProducts] = await Promise.all([
    getFeaturedProducts(10),
    getBestSellerProducts(10),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero com busca instantânea e métricas */}
      <HeroSection />

      {/* 2. Atalhos das principais linhas diesel */}
      <CategoryShortcuts />

      {/* 2.5 Seção de Mais Vendidos da Demir Diesel */}
      <BestSellersSection products={bestSellerProducts} />

      {/* 3. Vitrine real de peças e módulos */}
      <FeaturedSection products={featuredProducts} />

      {/* 4. Bloco Institucional do Laboratório & Oficina */}
      <DieselLaboratory />

      {/* 5. Localização física, mapa e contato */}
      <WorkshopLocation />
    </div>
  );
}
