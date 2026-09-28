import { getPaginatedProducts } from "./products";
import { PublicProduct, PaginatedProducts } from "./types";

/**
 * Busca flexível em colunas públicas do ERP (título, marketplace, referência, fabricante, descriçãoMarketplace)
 */
export async function searchCatalog(
  term: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedProducts> {
  const cleanTerm = (term || "").trim();
  if (!cleanTerm) {
    return {
      products: [],
      totalCount: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }

  return getPaginatedProducts({
    query: cleanTerm,
    page,
    pageSize,
  });
}

/**
 * Sugestões rápidas para autocomplete (busca instantânea no header/hero)
 */
export async function quickSearch(term: string, limit = 6): Promise<PublicProduct[]> {
  const cleanTerm = (term || "").trim();
  if (cleanTerm.length < 2) return [];

  const res = await getPaginatedProducts({
    query: cleanTerm,
    page: 1,
    pageSize: limit,
  });

  return res.products;
}
