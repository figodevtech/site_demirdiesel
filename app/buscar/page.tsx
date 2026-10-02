import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchScreen } from "@/components/search/SearchScreen";
import { HOME_HIGHLIGHT_CATEGORIES } from "@/lib/catalog/categories";

export const metadata: Metadata = {
  title: "Buscar peças",
};

export default function BuscarPage() {
  const categories = HOME_HIGHLIGHT_CATEGORIES.map(({ name, slug, image }) => ({ name, slug, image }));

  return (
    // useSearchParams exige Suspense; o fallback é a própria tela vazia (sem "Carregando...").
    <Suspense fallback={<SearchScreenFallback />}>
      <SearchScreen categories={categories} />
    </Suspense>
  );
}

function SearchScreenFallback() {
  return (
    <div className="container mx-auto max-w-3xl px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:pt-6" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="size-11 shrink-0 rounded-xl" />
        <div className="h-11 flex-1 rounded-xl bg-slate-100/90" />
      </div>
    </div>
  );
}
