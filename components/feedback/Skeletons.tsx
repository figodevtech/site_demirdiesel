// Skeletons que reproduzem o layout real das telas: a estrutura aparece no mesmo instante do toque
// e o conteúdo entra no lugar sem "pular" (CLS). Usam .skeleton-shimmer (app/globals.css).

function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-md shadow-slate-900/8">
      <Bone className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3 sm:p-4">
        <Bone className="h-2.5 w-1/2" />
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-3/4" />
        <Bone className="mt-3 h-5 w-24" />
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="container mx-auto px-4 pb-8 pt-3 md:pb-10 md:pt-5" aria-busy="true" aria-label="Carregando catálogo">
      <Bone className="mb-4 h-3.5 w-40" />
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Bone className="h-8 w-64 max-w-full" />
          <Bone className="h-3.5 w-40" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-40 rounded-xl" />
          <Bone className="h-10 w-24 rounded-xl md:hidden" />
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[260px_1fr]">
        <div className="hidden space-y-3 md:block">
          {Array.from({ length: 8 }).map((_, index) => (
            <Bone key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 pb-8 pt-3 md:pb-10 md:pt-5" aria-busy="true" aria-label="Carregando produto">
      <Bone className="mb-6 h-3.5 w-56 max-w-full" />
      <div className="mb-16 grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-12">
        <div className="md:col-span-6 lg:col-span-7">
          <Bone className="aspect-square w-full rounded-2xl" />
        </div>
        <div className="space-y-6 md:col-span-6 lg:col-span-5">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
            <Bone className="h-7 w-full" />
            <Bone className="h-7 w-2/3" />
            <Bone className="h-3.5 w-48" />
          </div>
          <Bone className="h-28 w-full rounded-2xl" />
          <div className="flex gap-3">
            <Bone className="h-11 w-32 rounded-xl" />
            <Bone className="h-11 flex-1 rounded-xl" />
            <Bone className="size-11 rounded-xl" />
          </div>
          <Bone className="h-11 w-full rounded-xl" />
        </div>
      </div>
      {/* Reserva o espaço do CTA fixo do mobile para não "saltar" quando a página chegar. */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <Bone className="h-2.5 w-2/3" />
            <Bone className="h-4 w-28" />
          </div>
          <Bone className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Lista genérica (pedidos, endereços, favoritos, cartões). */
export function ListSkeleton({ rows = 3, variant = "card" }: { rows?: number; variant?: "card" | "row" }) {
  return (
    <div className={variant === "card" ? "space-y-3" : "divide-y divide-border/60"} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, index) =>
        variant === "card" ? (
          <div key={index} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-32" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-3 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
        ) : (
          <div key={index} className="flex items-center gap-3 py-3">
            <Bone className="size-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-11/12" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Bone className="h-3.5 w-28" />
          <Bone className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Bone className="h-11 w-40 rounded-lg" />
    </div>
  );
}
