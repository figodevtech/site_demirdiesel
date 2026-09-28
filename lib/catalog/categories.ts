import { supabaseAdmin } from "@/lib/supabase/admin";
import { PublicCategory } from "./types";
import { slugify } from "@/lib/utils";

export async function getCategories(): Promise<PublicCategory[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("produtogrupo")
      .select("id, nome, descricao, ativo")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error || !data) {
      console.error("Erro ao carregar categorias:", error);
      return [];
    }

    const excludedGroups = [
      "NÃO RELACIONADO",
      "OUTROS",
      "PESSOA FÍSICA",
      "ESTOQUE",
      "EVENTOS",
      "PEÇAS",
    ];

    return data
      .filter((cat) => cat.nome && !excludedGroups.includes(cat.nome.trim().toUpperCase()))
      .map((cat) => ({
        id: cat.id,
        name: cat.nome.trim(),
        slug: slugify(cat.nome),
        description: cat.descricao,
      }));
  } catch (err) {
    console.error("Exceção ao buscar categorias:", err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

// Categorias prioritárias para destaque na Home (conforme regra 19 da especificação)
export const HOME_HIGHLIGHT_CATEGORIES = [
  {
    name: "Módulos Eletrônicos",
    slug: "modulos",
    description: "Centrais ECM, módulos de injeção, cabine e transmissão",
    tag: "Tecnologia Diesel",
    icon: "Cpu",
    query: "modulo",
  },
  {
    name: "Injeção & Bombas",
    slug: "injecao",
    description: "Bicos injetores, bombas de alta pressão e unidades injetoras",
    tag: "Alta Precisão",
    icon: "Fuel",
    query: "bomba",
  },
  {
    name: "Componentes de Motor",
    slug: "motor",
    description: "Turbinas, pistões, camisas, bronzinas e juntas de cabeçote",
    tag: "Linha Pesada",
    icon: "Settings",
    query: "motor",
  },
  {
    name: "Sensores & Válvulas",
    slug: "sensores",
    description: "Sensores de pressão, temperatura, rotação e válvulas dosadoras",
    tag: "Eletrônica Embarcada",
    icon: "Gauge",
    query: "sensor",
  },
  {
    name: "Filtros & Separação",
    slug: "filtros",
    description: "Filtros de combustível racor, ar, lubrificante e sedimentadores",
    tag: "Proteção do Sistema",
    icon: "Filter",
    query: "filtro",
  },
  {
    name: "Oficina & Diagnóstico",
    slug: "oficina",
    description: "Serviços especializados de bancada, testes e calibração",
    tag: "Laboratório Especializado",
    icon: "Wrench",
    query: "oficina",
  },
];
