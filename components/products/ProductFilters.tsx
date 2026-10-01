"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Filter, Search, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PublicCategory } from "@/lib/catalog/types";
import { formatCategoryName } from "@/lib/utils";

interface ProductFiltersProps {
  categories: PublicCategory[];
  availableBrands?: string[];
  priceBounds: { min: number; max: number };
  onApply?: () => void;
}

const CONDITIONS = [
  { label: "Novo", value: "novo" },
  { label: "Seminovo", value: "usado" },
  { label: "Recondicionado", value: "recondicionado" },
];

export function ProductFilters({ categories, availableBrands = [], priceBounds, onApply }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const condition = searchParams.get("condicao");
  const brand = searchParams.get("marca");
  const stockOnly = searchParams.get("estoque") === "disponivel";
  const currentMin = searchParams.get("precoMin") ?? "";
  const currentMax = searchParams.get("precoMax") ?? "";
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const priceFloor = Math.max(0, Math.floor(priceBounds.min));
  const priceCeiling = Math.max(priceFloor + 1, Math.ceil(priceBounds.max));
  const [selectedPrices, setSelectedPrices] = useState<[number, number]>([
    clampPrice(Number(currentMin) || priceFloor, priceFloor, priceCeiling),
    clampPrice(Number(currentMax) || priceCeiling, priceFloor, priceCeiling),
  ]);

  const shownCategories = useMemo(() => {
    const term = categorySearch.trim().toLocaleLowerCase("pt-BR");
    return term ? categories.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(term)) : categories;
  }, [categories, categorySearch]);
  const shownBrands = useMemo(() => {
    const term = brandSearch.trim().toLocaleLowerCase("pt-BR");
    return term ? availableBrands.filter((item) => item.toLocaleLowerCase("pt-BR").includes(term)) : availableBrands;
  }, [availableBrands, brandSearch]);

  const activeFilters = [
    category ? { key: "category", label: formatCategoryName(categories.find((item) => item.slug === category)?.name ?? category) } : null,
    condition ? { key: "condicao", label: CONDITIONS.find((item) => item.value === condition)?.label ?? condition } : null,
    brand ? { key: "marca", label: brand.toUpperCase() } : null,
    stockOnly ? { key: "estoque", label: "Pronta entrega" } : null,
    currentMin ? { key: "precoMin", label: `A partir de R$ ${currentMin}` } : null,
    currentMax ? { key: "precoMax", label: `Até R$ ${currentMax}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  function navigate(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    mutator(params);
    router.push(params.size ? `/produtos?${params.toString()}` : "/produtos");
    onApply?.();
  }

  function updateParam(key: string, value: string | null) {
    if (!value && key === "precoMin") setSelectedPrices((current) => [priceFloor, current[1]]);
    if (!value && key === "precoMax") setSelectedPrices((current) => [current[0], priceCeiling]);
    navigate((params) => value ? params.set(key, value) : params.delete(key));
  }

  function clearFilters() {
    setSelectedPrices([priceFloor, priceCeiling]);
    navigate((params) => ["category", "condicao", "marca", "estoque", "precoMin", "precoMax"].forEach((key) => params.delete(key)));
  }

  function applyPrice() {
    navigate((params) => {
      if (selectedPrices[0] > priceFloor) params.set("precoMin", String(selectedPrices[0]));
      else params.delete("precoMin");
      if (selectedPrices[1] < priceCeiling) params.set("precoMax", String(selectedPrices[1]));
      else params.delete("precoMax");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Filter className="size-4" /></span>
          <div><h2 className="text-sm font-bold">Filtrar produtos</h2><p className="text-[11px] text-muted-foreground">Refine o catálogo</p></div>
        </div>
        {activeFilters.length > 0 && <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearFilters}>Limpar</Button>}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-y py-3">
          {activeFilters.map((item) => (
            <Badge key={item.key} variant="secondary" className="gap-1 rounded-md py-1 pl-2 pr-1 font-medium">
              {item.label}
              <button type="button" className="rounded-sm p-0.5 hover:bg-background" onClick={() => updateParam(item.key, null)} aria-label={`Remover filtro ${item.label}`}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-card px-3 shadow-md shadow-slate-900/8 dark:shadow-black/25">
        <Accordion type="multiple" defaultValue={["categories", "availability", "condition", "price", "brands"]}>
          <AccordionItem value="categories">
            <AccordionTrigger className="py-3.5 font-semibold hover:no-underline">Categorias</AccordionTrigger>
            <AccordionContent>
              {categories.length > 7 && <FilterSearch value={categorySearch} onChange={setCategorySearch} placeholder="Buscar categoria" />}
              <Options allLabel="Todas as categorias" current={category} options={shownCategories.map((item) => ({ label: formatCategoryName(item.name), value: item.slug }))} onChange={(value) => updateParam("category", value)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="availability">
            <AccordionTrigger className="py-3.5 font-semibold hover:no-underline">Disponibilidade</AccordionTrigger>
            <AccordionContent>
              <Label htmlFor="stock-filter" className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/60">
                <Checkbox id="stock-filter" checked={stockOnly} onCheckedChange={(checked) => updateParam("estoque", checked === true ? "disponivel" : null)} />
                <span className="grid gap-0.5"><span className="text-xs font-semibold">Pronta entrega</span><span className="text-[11px] font-normal text-muted-foreground">Somente itens disponíveis agora</span></span>
              </Label>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="condition">
            <AccordionTrigger className="py-3.5 font-semibold hover:no-underline">Condição da peça</AccordionTrigger>
            <AccordionContent className="flex flex-wrap gap-2">
              <Button size="sm" variant={!condition ? "default" : "outline"} className="h-8 text-xs" onClick={() => updateParam("condicao", null)}>Todas</Button>
              {CONDITIONS.map((item) => <Button key={item.value} size="sm" variant={condition === item.value ? "default" : "outline"} className="h-8 text-xs" onClick={() => updateParam("condicao", condition === item.value ? null : item.value)}>{item.label}</Button>)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="price">
            <AccordionTrigger className="py-3.5 font-semibold hover:no-underline">Faixa de preço</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 px-1 pb-1">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <span className="rounded-md bg-muted px-2 py-1">{formatPrice(selectedPrices[0])}</span>
                  <span className="text-muted-foreground">até</span>
                  <span className="rounded-md bg-muted px-2 py-1">{formatPrice(selectedPrices[1])}</span>
                </div>
                <Slider
                  value={selectedPrices}
                  min={priceFloor}
                  max={priceCeiling}
                  step={Math.max(1, Math.round((priceCeiling - priceFloor) / 100))}
                  minStepsBetweenThumbs={1}
                  onValueChange={(value) => setSelectedPrices([value[0], value[1]])}
                  aria-label="Faixa de preço"
                />
                <Button type="button" onClick={applyPrice} variant="secondary" size="sm" className="h-8 w-full text-xs">Aplicar faixa</Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {availableBrands.length > 0 && (
            <AccordionItem value="brands">
              <AccordionTrigger className="py-3.5 font-semibold hover:no-underline">Fabricante ou marca</AccordionTrigger>
              <AccordionContent>
                {availableBrands.length > 7 && <FilterSearch value={brandSearch} onChange={setBrandSearch} placeholder="Buscar fabricante" />}
                <Options allLabel="Todos os fabricantes" current={brand?.toUpperCase() ?? null} options={shownBrands.map((item) => ({ label: item, value: item }))} onChange={(value) => updateParam("marca", value?.toLowerCase() ?? null)} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
}

function Options({ allLabel, current, options, onChange }: { allLabel: string; current: string | null; options: Array<{ label: string; value: string }>; onChange: (value: string | null) => void }) {
  return <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1"><Option label={allLabel} selected={!current} onClick={() => onChange(null)} />{options.map((item) => { const selected = current?.toLocaleLowerCase("pt-BR") === item.value.toLocaleLowerCase("pt-BR"); return <Option key={item.value} label={item.label} selected={selected} onClick={() => onChange(selected ? null : item.value)} />; })}</div>;
}

function Option({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <Button type="button" variant="ghost" size="sm" onClick={onClick} className={`h-8 w-full justify-between px-2 text-xs font-normal ${selected ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary" : "text-muted-foreground"}`}><span className="truncate">{label}</span>{selected && <Check className="size-3.5 shrink-0" />}</Button>;
}

function FilterSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative mb-2"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-8 pl-8 text-xs" /></div>;
}

function clampPrice(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default ProductFilters;
