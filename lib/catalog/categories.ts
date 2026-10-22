import { supabaseAdmin } from "@/lib/supabase/admin";
import { PublicCategory } from "./types";
import { slugify } from "@/lib/utils";

export async function getCategories(): Promise<PublicCategory[]> {
  try {
    const [{ data, error }, productCounts] = await Promise.all([
      supabaseAdmin
        .from("produtogrupo")
        .select("id, nome, descricao, ativo")
        .eq("ativo", true)
        .order("nome", { ascending: true }),
      getPublishedProductCounts(),
    ]);

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
      .filter((cat) => cat.nome && !excludedGroups.includes(cat.nome.trim().toUpperCase()) && (productCounts.get(Number(cat.id)) ?? 0) > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.nome.trim(),
        slug: slugify(cat.nome),
        description: cat.descricao,
        productCount: productCounts.get(Number(cat.id)) ?? 0,
      }));
  } catch (err) {
    console.error("Exceção ao buscar categorias:", err);
    return [];
  }
}

async function getPublishedProductCounts() {
  const counts = new Map<number, number>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from("produto")
      .select("grupo_produto_id")
      .eq("is_deleted", false)
      .eq("visible", true)
      .not("imgUrl", "is", null)
      .not("imgUrl", "match", "^[[:space:]]*$")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    for (const product of data ?? []) {
      const groupId = Number(product.grupo_produto_id);
      if (groupId > 0) counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
    if ((data ?? []).length < pageSize) break;
  }

  return counts;
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

// Categorias prioritárias para destaque na Home com fotos realistas de catálogo
export const HOME_HIGHLIGHT_CATEGORIES = [
  {
    name: "Módulos ECM",
    slug: "modulos",
    description: "Centrais ECM, módulos de injeção, cabine e transmissão",
    tag: "Tecnologia Diesel",
    icon: "Cpu",
    query: "modulo",
    image: "/images/categories/modulos.jpg",
  },
  {
    name: "Injeção Diesel",
    slug: "injecao",
    description: "Bicos injetores, bombas de alta pressão e unidades injetoras",
    tag: "Alta Precisão",
    icon: "Fuel",
    query: "bomba",
    image: "/images/categories/injecao.jpg",
  },
  {
    name: "Peças de Motor",
    slug: "motor",
    description: "Turbinas, pistões, camisas, bronzinas e juntas de cabeçote",
    tag: "Linha Pesada",
    icon: "Settings",
    query: "motor",
    image: "/images/categories/motor.jpg",
  },
  {
    name: "Filtros Racor",
    slug: "filtros",
    description: "Filtros de combustível racor, ar, lubrificante e sedimentadores",
    tag: "Proteção do Sistema",
    icon: "Filter",
    query: "filtro",
    image: "/images/categories/filtros.jpg",
  },
  {
    name: "Sensores",
    slug: "sensores",
    description: "Sensores de pressão de rail, temperatura e rotação",
    tag: "Eletrônica Embarcada",
    icon: "Gauge",
    query: "sensor",
    image: "/images/categories/sensores.jpg",
  },
  {
    name: "Válvulas",
    slug: "valvulas",
    description: "Válvulas dosadoras MPROP, alívio de pressão e solenoides",
    tag: "Controle de Pressão",
    icon: "Settings",
    query: "valvula",
    image: "/images/categories/valvulas.jpg",
  },
  {
    name: "ARLA 32 & Aditivos",
    slug: "arla",
    description: "Fluidos ARLA 32 automotivos e aditivos para linha pesada",
    tag: "Emissões & Tratamento",
    icon: "Fuel",
    query: "arla",
    image: "/images/categories/arla.jpg",
  },
  {
    name: "Óleos & Lubrificantes",
    slug: "lubrificantes",
    description: "Lubrificantes minerais e sintéticos para motores diesel pesados",
    tag: "Manutenção & Vida Útil",
    icon: "Wrench",
    query: "lubrificante",
    image: "/images/categories/lubrificantes.jpg",
  },
];
