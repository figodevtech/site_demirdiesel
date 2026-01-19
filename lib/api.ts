import { supabase } from './supabase';
import { Produto, ProdutoGrupo } from './types';
import { slugify } from './utils';
// Note: Produto type now matches DB schema (descricao, marca, etc.)

export async function buscarCategorias() {
    const { data, error } = await supabase
        .from('produtogrupo')
        .select('*')
        .eq('ativo', true);

    if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
    }

    return data.map(cat => ({
        ...cat,
        slug: slugify(cat.nome)
    }));
}

export async function buscarProdutos(limite = 10) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome),
      produto_imagem (url)
    `)
        .eq('exibirPdv', true)
        .limit(limite);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }

    return data.map(p => transformarProduto(p));
}

export async function buscarProdutoPorId(id: string) {
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

    return transformarProduto(data);
}

export async function buscarProdutosPorCategoria(slug: string) {
    const categorias = await buscarCategorias();
    const categoria = categorias.find((c: any) => c.slug === slug);

    if (!categoria) return [];

    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome),
      produto_imagem (url)
    `)
        .eq('grupo_produto_id', categoria.id)
        .eq('exibirPdv', true);

    if (error) return [];

    return data.map(p => transformarProduto(p));
}

export async function searchProducts(termo: string) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome),
      produto_imagem (url)
    `)
        .ilike('descricao', `%${termo}%`)
        .eq('exibirPdv', true);

    if (error) {
        console.error('Erro ao pesquisar produtos:', error);
        return [];
    }

    return data.map(p => transformarProduto(p));
}

// Deprecated alias just in case
export const pesquisarProdutos = searchProducts;

function transformarProduto(dbProduct: any) {
    const images = dbProduct.produto_imagem?.map((img: any) => img.url) || [];
    return {
        id: dbProduct.id.toString(),
        name: dbProduct.descricao,
        price: Number(dbProduct.precovenda),
        image: images[0] || 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Sem+Foto',
        brand: dbProduct.marca || 'Genérico',
        category: dbProduct.produtogrupo?.nome || 'Geral',
        stock: dbProduct.estoqueatual || 0,
        rating: 5,
        shortDescription: dbProduct.descricao || '',
        fullDescription: dbProduct.descricao || '',
        images: images,
        compatibility: []
    };
}

export async function buscarProdutosFiltrados(opcoes: {
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
} = {}) {
    let query = supabase
        .from('produto')
        .select(`
            *,
            produtogrupo (nome),
            produto_imagem (url)
        `)
        .eq('exibirPdv', true);

    if (opcoes.categorySlug && opcoes.categorySlug !== 'todos') {
        const categorias = await buscarCategorias();
        const categoria = categorias.find((c: any) => c.slug === opcoes.categorySlug);
        if (categoria) {
            query = query.eq('grupo_produto_id', categoria.id);
        }
    }

    if (opcoes.minPrice !== undefined) {
        query = query.gte('precovenda', opcoes.minPrice);
    }
    if (opcoes.maxPrice !== undefined && opcoes.maxPrice > 0) {
        query = query.lte('precovenda', opcoes.maxPrice);
    }

    query = query.order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar produtos filtrados:', error);
        return [];
    }

    return data.map(p => transformarProduto(p));
}
