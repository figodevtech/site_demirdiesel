import {
  getFeaturedProducts,
  getProductById,
  getPaginatedProducts,
  mapRowToPublicProduct,
} from "./catalog/products";
import { getCategories, getCategoryBySlug } from "./catalog/categories";
import { searchCatalog, quickSearch } from "./catalog/search";
import { PublicProduct, PublicCategory } from "./catalog/types";

// Re-exporta funções do novo domínio preservando compatibilidade
export {
  getFeaturedProducts,
  getProductById,
  getPaginatedProducts,
  getCategories,
  getCategoryBySlug,
  searchCatalog,
  quickSearch,
};

export async function buscarCategorias(): Promise<PublicCategory[]> {
  return getCategories();
}

export async function buscarProdutos(limite = 10): Promise<PublicProduct[]> {
  const result = await getPaginatedProducts({ pageSize: limite });
  return result.products;
}

export async function buscarProdutosDestaque(limite = 10): Promise<PublicProduct[]> {
  return getFeaturedProducts(limite);
}

export async function buscarProdutoPorId(id: string): Promise<PublicProduct | null> {
  return getProductById(id);
}

export async function buscarProdutosPorCategoria(slug: string): Promise<PublicProduct[]> {
  const result = await getPaginatedProducts({ categorySlug: slug, pageSize: 50 });
  return result.products;
}

export async function searchProducts(termo: string): Promise<PublicProduct[]> {
  const result = await searchCatalog(termo, 1, 50);
  return result.products;
}

export const pesquisarProdutos = searchProducts;

export async function buscarProdutosFiltrados(
  opcoes: {
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    brand?: string;
    condition?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PublicProduct[]> {
  const result = await getPaginatedProducts({
    categorySlug: opcoes.categorySlug,
    minPrice: opcoes.minPrice,
    maxPrice: opcoes.maxPrice,
    sort: opcoes.sort as any,
    brand: opcoes.brand,
    condition: opcoes.condition,
    page: opcoes.page || 1,
    pageSize: opcoes.pageSize || 24,
  });
  return result.products;
}
