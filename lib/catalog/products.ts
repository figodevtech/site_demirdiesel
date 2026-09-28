import { supabaseAdmin } from "@/lib/supabase/admin";
import { PublicProduct, ProductFilterOptions, PaginatedProducts, ProductCondition } from "./types";
import { slugify } from "@/lib/utils";

// Colunas estritamente públicas selecionadas do ERP
const PUBLIC_PRODUCT_COLUMNS = `
  id,
  titulo,
  tituloMarketplace,
  descricao,
  descricaoMarketplace,
  precovenda,
  estoque,
  referencia,
  fabricante,
  grupo_produto_id,
  imgUrl,
  conservacao,
  destaque,
  exibirPdv,
  is_deleted,
  status_estoque,
  codigobarras,
  produtogrupo (
    id,
    nome
  )
`;

export function formatBrlCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Converte row do ERP em DTO seguro e limpo para o frontend
export function mapRowToPublicProduct(row: any, extraImages: string[] = []): PublicProduct {
  const title = (
    row.tituloMarketplace ||
    row.titulo ||
    row.descricao ||
    "Componente Diesel"
  ).trim();

  const brand = (row.fabricante || "Genuíno").trim();
  const rawCondition = String(row.conservacao || "").trim().toUpperCase();
  const condition: ProductCondition =
    rawCondition === "USADO"
      ? "USADO"
      : rawCondition === "RECONDICIONADO"
      ? "RECONDICIONADO"
      : "NOVO";

  const price = Number(row.precovenda) || 0;
  const stock = Number(row.estoque) || 0;

  const categoryName = row.produtogrupo?.nome?.trim() || "Geral";
  const categoryId = row.grupo_produto_id ? Number(row.grupo_produto_id) : null;
  const categorySlug = slugify(categoryName);

  const mainImage = row.imgUrl || extraImages[0] || "";

  const allImages = [mainImage, ...extraImages].filter(
    (url, index, self) => url && self.indexOf(url) === index
  );

  const cleanDescription = (
    row.descricaoMarketplace ||
    row.descricao ||
    ""
  ).trim();

  // Gera slug amigável como /produto/modulo-scania-dc13-1024
  const referencePart = row.referencia ? `-${slugify(row.referencia)}` : "";
  const productSlug = `${slugify(title)}${referencePart}-${row.id}`;

  return {
    id: String(row.id),
    title,
    name: title,
    slug: productSlug,
    description: cleanDescription,
    shortDescription: cleanDescription ? cleanDescription.slice(0, 160) : "",
    price,
    formattedPrice: formatBrlCurrency(price),
    stock,
    isAvailable: stock > 0,
    statusEstoque: (row.status_estoque as any) || (stock > 0 ? "OK" : "ESGOTADO"),
    reference: row.referencia ? row.referencia.trim() : null,
    brand,
    condition,
    featured: Boolean(row.destaque),
    categoryId,
    categoryName,
    categorySlug,
    image: mainImage,
    images: allImages.length > 0 ? allImages : mainImage ? [mainImage] : [],
    barcode: row.codigobarras || null,
  };
}

/**
 * Busca produtos em destaque com fallback inteligente
 * Regra 10 do prompt: se nenhum produto estiver com destaque=true, usa
 * produtos ativos com estoque e imagem mais recentes.
 */
export async function getFeaturedProducts(limit = 8): Promise<PublicProduct[]> {
  try {
    // 1. Tenta buscar marcados como destaque=true
    const { data: featuredData } = await supabaseAdmin
      .from("produto")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("is_deleted", false)
      .eq("exibirPdv", true)
      .eq("destaque", true)
      .gt("estoque", 0)
      .order("id", { ascending: false })
      .limit(limit);

    if (featuredData && featuredData.length > 0) {
      return featuredData.map((row) => mapRowToPublicProduct(row));
    }

    // 2. Fallback inteligente: produtos recentes, com estoque e com foto
    const { data: fallbackData } = await supabaseAdmin
      .from("produto")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("is_deleted", false)
      .eq("exibirPdv", true)
      .gt("estoque", 0)
      .not("imgUrl", "is", null)
      .neq("imgUrl", "")
      .order("id", { ascending: false })
      .limit(limit);

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData.map((row) => mapRowToPublicProduct(row));
    }

    // 3. Fallback secundário seguro
    const { data: anyData } = await supabaseAdmin
      .from("produto")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("is_deleted", false)
      .eq("exibirPdv", true)
      .order("id", { ascending: false })
      .limit(limit);

    return (anyData || []).map((row) => mapRowToPublicProduct(row));
  } catch (err) {
    console.error("Erro ao carregar produtos em destaque:", err);
    return [];
  }
}

/**
 * Busca detalhe de um produto por ID ou slug
 * Carrega a galeria completa da tabela produto_imagem ordenada por `ordem`
 */
export async function getProductById(idOrSlug: string): Promise<PublicProduct | null> {
  try {
    // Extrai ID se vier no formato amigável slug-1234
    const id = idOrSlug.includes("-")
      ? idOrSlug.split("-").pop() || idOrSlug
      : idOrSlug;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const { data: productRow, error: productError } = await supabaseAdmin
      .from("produto")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("id", numericId)
      .eq("is_deleted", false)
      .eq("exibirPdv", true)
      .single();

    if (productError || !productRow) {
      return null;
    }

    // Busca imagens adicionais da galeria
    const { data: galleryImages } = await supabaseAdmin
      .from("produto_imagem")
      .select("url, ordem")
      .eq("produto_id", numericId)
      .order("ordem", { ascending: true });

    const extraUrls = (galleryImages || []).map((img) => img.url).filter(Boolean);

    return mapRowToPublicProduct(productRow, extraUrls);
  } catch (err) {
    console.error("Erro ao buscar produto por ID:", err);
    return null;
  }
}

/**
 * Busca paginada e filtrada para o catálogo
 */
export async function getPaginatedProducts(
  options: ProductFilterOptions = {}
): Promise<PaginatedProducts> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from("produto")
      .select(PUBLIC_PRODUCT_COLUMNS, { count: "exact" })
      .eq("is_deleted", false)
      .eq("exibirPdv", true);

    // Categoria
    if (options.categoryId) {
      query = query.eq("grupo_produto_id", options.categoryId);
    } else if (options.categorySlug && options.categorySlug !== "todos") {
      const { data: cat } = await supabaseAdmin
        .from("produtogrupo")
        .select("id, nome")
        .eq("ativo", true);

      const matched = (cat || []).find(
        (c) => slugify(c.nome) === options.categorySlug
      );
      if (matched) {
        query = query.eq("grupo_produto_id", matched.id);
      }
    }

    // Termo de busca textual
    if (options.query && options.query.trim()) {
      const term = options.query.trim();
      query = query.or(
        `titulo.ilike.%${term}%,tituloMarketplace.ilike.%${term}%,referencia.ilike.%${term}%,fabricante.ilike.%${term}%,descricao.ilike.%${term}%`
      );
    }

    // Fabricante
    if (options.brand) {
      query = query.ilike("fabricante", `%${options.brand}%`);
    }

    // Condição
    if (options.condition) {
      query = query.eq("conservacao", options.condition.toUpperCase());
    }

    // Disponibilidade
    if (options.inStockOnly) {
      query = query.gt("estoque", 0);
    }

    // Preço
    if (typeof options.minPrice === "number" && !isNaN(options.minPrice)) {
      query = query.gte("precovenda", options.minPrice);
    }
    if (typeof options.maxPrice === "number" && !isNaN(options.maxPrice) && options.maxPrice > 0) {
      query = query.lte("precovenda", options.maxPrice);
    }

    // Ordenação
    switch (options.sort) {
      case "price_asc":
        query = query.order("precovenda", { ascending: true });
        break;
      case "price_desc":
        query = query.order("precovenda", { ascending: false });
        break;
      case "name_asc":
        query = query.order("titulo", { ascending: true });
        break;
      case "featured":
        query = query
          .order("destaque", { ascending: false })
          .order("id", { ascending: false });
        break;
      case "recent":
      default:
        query = query.order("id", { ascending: false });
        break;
    }

    // Paginação
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Erro na busca paginada de produtos:", error);
      return { products: [], totalCount: 0, page, pageSize, totalPages: 0 };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const products = (data || []).map((row) => mapRowToPublicProduct(row));

    return {
      products,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error("Exceção na paginação de produtos:", err);
    return { products: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

/**
 * Lista marcas/fabricantes disponíveis no catálogo ativo
 */
export async function getAvailableBrands(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from("produto")
      .select("fabricante")
      .eq("is_deleted", false)
      .eq("exibirPdv", true)
      .not("fabricante", "is", null);

    if (!data) return [];

    const set = new Set<string>();
    data.forEach((p) => {
      const b = (p.fabricante || "").trim();
      if (b && b !== "-" && b.length > 1) {
        set.add(b.toUpperCase());
      }
    });

    return Array.from(set).sort();
  } catch (err) {
    console.error("Erro ao buscar marcas:", err);
    return [];
  }
}
