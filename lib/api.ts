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

// Helper para buscar imagens manualmente (Mantido como fallback ou para imagens adicionais se a tabela existir)
async function buscarImagensParaProdutos(produtos: any[]) {
    if (!produtos.length) return {};
    
    // Tenta buscar da tabela produto_imagem se ela existir, caso contrário retorna vazio
    try {
        const ids = produtos.map(p => p.id);
        const { data, error } = await supabase
            .from('produto_imagem')
            .select('produto_id, url')
            .in('produto_id', ids);

        if (error || !data) {
            return {};
        }

        const imagensMap: Record<number, string[]> = {};
        data.forEach((img: any) => {
            if (!imagensMap[img.produto_id]) {
                imagensMap[img.produto_id] = [];
            }
            imagensMap[img.produto_id].push(img.url);
        });

        return imagensMap;
    } catch (e) {
        console.warn('Erro ao buscar imagens extras ou tabela não existe.');
        return {};
    }
}

export async function buscarProdutos(limite = 10) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('exibirPdv', true)
        .limit(limite);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }

    const imagensMap = await buscarImagensParaProdutos(data);
    return data.map(p => transformarProduto(p, imagensMap[p.id] || []));
}

export async function buscarProdutoPorId(id: string) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('id', id)
        .single();

    if (error) return null;

    const imagensMap = await buscarImagensParaProdutos([data]);
    return transformarProduto(data, imagensMap[data.id] || []);
}

export async function buscarProdutosPorCategoria(slug: string) {
    const categorias = await buscarCategorias();
    const categoria = categorias.find((c: any) => c.slug === slug);

    if (!categoria) return [];

    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('grupo_produto_id', categoria.id)
        .eq('exibirPdv', true);

    if (error) return [];

    const imagensMap = await buscarImagensParaProdutos(data);
    return data.map(p => transformarProduto(p, imagensMap[p.id] || []));
}

export async function searchProducts(termo: string) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%`)
        .eq('exibirPdv', true);

    if (error) {
        console.error('Erro ao pesquisar produtos:', error);
        return [];
    }

    const imagensMap = await buscarImagensParaProdutos(data);
    return data.map(p => transformarProduto(p, imagensMap[p.id] || []));
}

// Deprecated alias just in case
export const pesquisarProdutos = searchProducts;

function transformarProduto(dbProduct: any, extraImages: string[] = []) {
    // Prefer imgUrl from product table, fallback to first extra image
    const mainImage = dbProduct.imgUrl || extraImages[0] || 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Sem+Foto';
    
    // Combine main image with extra images for gallery, filtering duplicates
    const allImages = [mainImage, ...extraImages].filter((url, index, self) => 
        url && url !== 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Sem+Foto' && self.indexOf(url) === index
    );

    return {
        id: dbProduct.id.toString(),
        name: dbProduct.tituloMarketplace || dbProduct.titulo || dbProduct.descricao || 'Produto sem nome', // Prioritize tituloMarketplace
        price: Number(dbProduct.precovenda),
        image: mainImage,
        brand: dbProduct.marca || dbProduct.fabricante || 'Genérico',
        category: dbProduct.produtogrupo?.nome || 'Geral',
        stock: dbProduct.estoque || 0, // Schema says 'estoque', not 'estoqueatual'
        rating: 5,
        shortDescription: dbProduct.descricao || dbProduct.titulo || '',
        fullDescription: dbProduct.descricao || dbProduct.descricaoMarketplace || '',
        images: allImages.length > 0 ? allImages : [mainImage],
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
            produtogrupo (nome)
        `);
        // Filter removed: 'ativo' column missing on live DB

    if (opcoes.categorySlug && opcoes.categorySlug !== 'todos') {
        const categorias = await buscarCategorias();
        const categoria = categorias.find((c: any) => c.slug === opcoes.categorySlug);
        if (categoria) {
            query = query.eq('grupo_produto_id', categoria.id);
        }
    }

    if (opcoes.minPrice !== undefined && !isNaN(opcoes.minPrice)) {
        query = query.gte('precovenda', opcoes.minPrice);
    }
    if (opcoes.maxPrice !== undefined && opcoes.maxPrice > 0 && !isNaN(opcoes.maxPrice)) {
        query = query.lte('precovenda', opcoes.maxPrice);
    }

    query = query.order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar produtos filtrados (Detalhes):', JSON.stringify(error, null, 2));
        return [];
    }

    const imagensMap = await buscarImagensParaProdutos(data);
    return data.map(p => transformarProduto(p, imagensMap[p.id] || []));
}
