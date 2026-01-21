export interface Produto {
    id: number;
    codigo: string;
    codigobarras: string | null;
    descricao: string; // usado como nome
    grupoid: number | null;
    unidademedidaid: number | null;
    precovenda: number;
    precocusto: number | null;
    estoqueatual: number;
    estoqueminimo: number;
    exibirPdv: boolean;
    ncm: string | null;
    marca: string | null;
    localizacao: string | null;
    grupo_produto_id: number | null; // FK para produtogrupo
}

export interface ProdutoGrupo {
    id: number;
    nome: string;
    descricao: string | null;
    ativo: boolean;
}

export interface ProdutoImagem {
    id: number;
    produto_id: number;
    url: string;
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
