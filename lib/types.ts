export interface Produto {
    id: number;
    titulo: string;
    precovenda: number;
    estoque: number;
    descricao: string | null;
    imgUrl: string | null;
    grupo_produto_id: number;
    brand?: string; // Not in DB dump, might need fallback
    // Computed for frontend
    categoryName?: string;
}

export interface ProdutoGrupo {
    id: number;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    // slug?: string; // Not in DB, will need to generate slug from nome
}

export interface ProdutoImagem {
    id: number;
    produto_id: number;
    url: string;
    ordem: number;
}

export interface Database {
    public: {
        Tables: {
            produto: {
                Row: Produto;
                Insert: Omit<Produto, 'id'>;
                Update: Partial<Omit<Produto, 'id'>>;
            };
            produtogrupo: {
                Row: ProdutoGrupo;
                Insert: Omit<ProdutoGrupo, 'id'>;
                Update: Partial<Omit<ProdutoGrupo, 'id'>>;
            };
            produto_imagem: {
                Row: ProdutoImagem;
                Insert: Omit<ProdutoImagem, 'id'>;
                Update: Partial<Omit<ProdutoImagem, 'id'>>;
            };
        };
    };
}
