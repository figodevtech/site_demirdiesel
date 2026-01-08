import { supabase } from './supabase';
import { Produto, ProdutoGrupo } from './types';
import { slugify } from './utils';

// Helper to transform DB product to Frontend Product shape if needed
// Or just use the DB shape directly.
// The frontend uses: id, name, price, image, brand, category, ...

export async function getCategories() {
    const { data, error } = await supabase
        .from('produtogrupo')
        .select('*')
        .eq('ativo', true);

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data.map(cat => ({
        ...cat,
        slug: slugify(cat.nome)
    }));
}

export async function getProducts(limit = 10) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('is_deleted', false)
        .limit(limit);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data.map(p => transformProduct(p));
}

export async function getProductById(id: string) {
    // Try to find by ID first
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome),
      produto_imagem (url)
    `)
        .eq('id', id)
        .single();

    if (error) return null;

    return transformProduct(data);
}

export async function getProductsByCategory(slug: string) {
    // First find category ID by slug (implied by name)
    // Since we don't have slug in DB, we fetch all categories and find match
    // Or request that backend adds slug. For now: fetch all categories

    const categories = await getCategories();
    const category = categories.find(c => c.slug === slug);

    if (!category) return [];

    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('grupo_produto_id', category.id)
        .eq('is_deleted', false);

    if (error) return [];

    return data.map(p => transformProduct(p));
}

export async function searchProducts(query: string) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .ilike('titulo', `%${query}%`)
        .eq('is_deleted', false);

    if (error) return [];

    return data.map(p => transformProduct(p));
}

// Transformer to match the Frontend "Product" type from lib/data.ts
// (id, name, price, image, brand, category, stock, rating, shortDescription, fullDescription)
function transformProduct(dbProduct: any) {
    return {
        id: dbProduct.id.toString(),
        name: dbProduct.titulo,
        price: Number(dbProduct.precovenda),
        image: dbProduct.imgUrl || 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Sem+Foto',
        brand: dbProduct.fabricante || 'Genérico',
        category: dbProduct.produtogrupo?.nome || 'Geral',
        stock: dbProduct.estoque || 0,
        rating: 5, // Placeholder as DB doesn't have rating
        shortDescription: dbProduct.descricao || '',
        fullDescription: dbProduct.descricao || '',
        images: dbProduct.produto_imagem?.map((img: any) => img.url) || [],
        compatibility: [] // DB doesn't have this yet
    };
}
