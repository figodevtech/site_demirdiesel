import { supabase } from './supabase';
import { Produto, ProdutoGrupo } from './types';
import { slugify } from './utils';

// Helper para transformar produto do DB para o formato do Frontend se necessário
// Ou apenas usar o formato do DB diretamente.
// O frontend usa: id, name, price, image, brand, category, ...

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
      produtogrupo (nome)
    `)
        .eq('is_deleted', false)
        .limit(limite);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }

    return data.map(p => transformarProduto(p));
}

export async function buscarProdutoPorId(id: string) {
    // Tenta encontrar pelo ID primeiro
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
    // Primeiro encontra o ID da categoria pelo slug (implicado pelo nome)
    // Como não temos slug no DB, buscamos todas as categorias e encontramos a correspondência
    // Ou solicitamos que o backend adicione slug. Por enquanto: busca todas as categorias

    const categorias = await buscarCategorias();
    const categoria = categorias.find(c => c.slug === slug);

    if (!categoria) return [];

    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .eq('grupo_produto_id', categoria.id)
        .eq('is_deleted', false);

    if (error) return [];

    return data.map(p => transformarProduto(p));
}

export async function pesquisarProdutos(termo: string) {
    const { data, error } = await supabase
        .from('produto')
        .select(`
      *,
      produtogrupo (nome)
    `)
        .ilike('titulo', `%${termo}%`)
        .eq('is_deleted', false);

    if (error) return [];

    return data.map(p => transformarProduto(p));
}

// Transformador para corresponder ao tipo "Produto" do Frontend de lib/data.ts
// (id, name, price, image, brand, category, stock, rating, shortDescription, fullDescription)
function transformarProduto(dbProduct: any) {
    return {
        id: dbProduct.id.toString(),
        name: dbProduct.titulo,
        price: Number(dbProduct.precovenda),
        image: dbProduct.imgUrl || 'https://placehold.co/400x400/0A7AAC/FFFFFF?text=Sem+Foto',
        brand: dbProduct.fabricante || 'Genérico',
        category: dbProduct.produtogrupo?.nome || 'Geral',
        stock: dbProduct.estoque || 0,
        rating: 5, // Placeholder pois DB não tem avaliação
        shortDescription: dbProduct.descricao || '',
        fullDescription: dbProduct.descricao || '',
        images: dbProduct.produto_imagem?.map((img: any) => img.url) || [],
        compatibility: [] // DB ainda não tem isso
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
        `)
        .eq('is_deleted', false);

    if (opcoes.categorySlug && opcoes.categorySlug !== 'todos') {
        // Precisa encontrar o ID da categoria primeiro pois não temos slug na relação da tabela produto diretamente (é via ID)
        // Otimização: Em um app real, poderíamos fazer join filter, mas aqui vamos buscar a categoria primeiro
        // Ou se tivéssemos o ID do frontend. Mas filtros geralmente usam Slugs.
        const categorias = await buscarCategorias();
        // Correspondência estrita?
        const categoria = categorias.find(c => c.slug === opcoes.categorySlug);
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
    
    // Ordenação padrão?
    query = query.order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar produtos filtrados:', error);
        return [];
    }

    return data.map(p => transformarProduto(p));
}
