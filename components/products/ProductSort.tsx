"use client";

import { useSearchParams } from "next/navigation";
import { useCatalogNavigation } from "./CatalogTransition";
import { ArrowUpDown, Rows3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProductSort() {
  const { navigate } = useCatalogNavigation();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "recent";
  const currentPageSize = searchParams.get("porPagina") || "20";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    navigate(`/produtos?${params.toString()}`, { scroll: false });
  }

  function handlePageSizeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("porPagina", value);
    params.delete("page");
    navigate(`/produtos?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="size-3.5 text-muted-foreground" />
        <span className="hidden text-muted-foreground lg:inline">Ordenar:</span>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-9 w-[148px] rounded-lg text-xs" aria-label="Ordenação de produtos">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="price_asc">Menor preço</SelectItem>
            <SelectItem value="price_desc">Maior preço</SelectItem>
            <SelectItem value="name_asc">Nome (A–Z)</SelectItem>
            <SelectItem value="featured">Destaques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Rows3 className="size-3.5 text-muted-foreground" />
        <span className="hidden text-muted-foreground lg:inline">Exibir:</span>
        <Select value={currentPageSize} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="h-9 w-[104px] rounded-lg text-xs" aria-label="Quantidade de produtos por página">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 itens</SelectItem>
            <SelectItem value="20">20 itens</SelectItem>
            <SelectItem value="36">36 itens</SelectItem>
            <SelectItem value="48">48 itens</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
