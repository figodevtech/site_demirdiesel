export type ProductCondition = "NOVO" | "USADO" | "RECONDICIONADO";

export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount?: number;
}

export interface PublicProduct {
  id: string;
  name: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  formattedPrice: string;
  stock: number;
  isAvailable: boolean;
  statusEstoque: "OK" | "BAIXO" | "CRITICO" | "ESGOTADO";
  reference: string | null;
  brand: string;
  condition: ProductCondition;
  featured: boolean;
  categoryId: number | null;
  categoryName: string;
  categorySlug: string;
  image: string;
  images: string[];
  barcode: string | null;
}

export interface ProductFilterOptions {
  query?: string;
  categorySlug?: string;
  categoryId?: number;
  brand?: string;
  condition?: string;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "name_asc" | "featured";
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  products: PublicProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
