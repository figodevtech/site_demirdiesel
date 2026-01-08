create table public.cliente (
  id integer generated always as identity not null,
  tipopessoa public.enum_tipopessoa not null,
  cpfcnpj character varying not null,
  nomerazaosocial character varying not null,
  email character varying not null,
  telefone character varying not null,
  endereco character varying null,
  cidade character varying not null,
  estado character varying not null,
  cep character varying null,
  inscricaoestadual character varying null,
  inscricaomunicipal character varying null,
  codigomunicipio character varying null,
  createdat timestamp without time zone null default now(),
  updatedat timestamp without time zone null default now(),
  status public.enum_status_cliente null default 'ATIVO'::enum_status_cliente,
  endereconumero text null,
  enderecocomplemento text null,
  bairro text null,
  created_by uuid null,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  rank public.cliente_rank null,
  ranked_by uuid null,
  ranked_at timestamp with time zone null,
  constraint cliente_pkey primary key (id),
  constraint cliente_cpfcnpj_key unique (cpfcnpj),
  constraint cliente_nomerazaosocial_key unique (nomerazaosocial),
  constraint cliente_telefone_key unique (telefone),
  constraint cliente_created_by_fkey foreign KEY (created_by) references usuario (id),
  constraint cliente_ranked_by_fkey foreign KEY (ranked_by) references usuario (id),
  constraint cliente_deleted_by_fkey foreign KEY (deleted_by) references usuario (id),
  constraint cliente_updated_by_fkey foreign KEY (updated_by) references usuario (id)
) TABLESPACE pg_default;

create index IF not exists idx_cliente_cpfcnpj on public.cliente using btree (cpfcnpj) TABLESPACE pg_default;

create table public.empresa (
  id integer generated always as identity not null,
  cnpj character varying not null,
  razaosocial character varying not null,
  nomefantasia character varying null,
  inscricaoestadual character varying null,
  inscricaomunicipal character varying null,
  endereco character varying not null,
  codigomunicipio character varying not null,
  regimetributario character varying not null,
  certificadocaminho character varying null,
  cschomologacao character varying null,
  cscproducao character varying null,
  ambiente character varying null default 'HOMOLOGACAO'::character varying,
  createdat timestamp without time zone null default now(),
  updatedat timestamp without time zone null default now(),
  bairro character varying null,
  numero character varying null,
  complemento character varying null,
  cep character varying null,
  uf character varying(2) null,
  codigopais character varying null default '1058'::character varying,
  nomepais character varying null default 'BRASIL'::character varying,
  telefone character varying null,
  cnae character varying null,
  inscricaoestadualst character varying null,
  certificadosenha character varying null,
  constraint empresa_pkey primary key (id),
  constraint empresa_cnpj_key unique (cnpj),
  constraint empresa_ambiente_check check (
    (
      (ambiente)::text = any (
        array[
          ('HOMOLOGACAO'::character varying)::text,
          ('PRODUCAO'::character varying)::text
        ]
      )
    )
  ),
  constraint empresa_regimetributario_check check (
    (
      (regimetributario)::text = any (
        array[
          ('1'::character varying)::text,
          ('2'::character varying)::text,
          ('3'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.produto (
  id integer generated always as identity not null,
  descricao text null,
  precovenda numeric not null,
  estoque integer not null default 0,
  estoqueminimo integer not null default 0,
  ncm text null,
  unidade public.unidade_medida not null default 'UN'::unidade_medida,
  cest text null,
  csosn text null,
  codigobarras text null,
  createdat timestamp with time zone null default now(),
  updatedat timestamp with time zone null default now(),
  referencia text null,
  titulo text not null,
  status_estoque public.estoque_status not null default 'OK'::estoque_status,
  fabricante text null,
  grupo public.grupo_produto null default 'OUTROS'::grupo_produto,
  "exibirPdv" boolean not null default false,
  "tituloMarketplace" text not null default ''::text,
  "descricaoMarketplace" text not null default ''::text,
  "cClassTrib" text null,
  "cstIbs" text null,
  "cstCbs" text null,
  cst text null,
  aliquotaicms numeric null,
  cfop text null,
  cst_pis text null,
  aliquota_pis numeric(5, 2) null,
  cst_cofins text null,
  aliquota_cofins numeric(5, 2) null,
  "imgUrl" text null,
  updated_by uuid null,
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  grupo_produto_id integer not null default 1,
  tipo_unidade_id integer not null default 1,
  constraint produto_pkey primary key (id),
  constraint produto_created_by_fkey foreign KEY (created_by) references usuario (id),
  constraint produto_deleted_by_fkey foreign KEY (deleted_by) references usuario (id),
  constraint produto_grupo_produto_id_fkey foreign KEY (grupo_produto_id) references produtogrupo (id) on update CASCADE,
  constraint produto_tipo_unidade_id_fkey foreign KEY (tipo_unidade_id) references unidademedida (id) on update CASCADE,
  constraint produto_updated_by_fkey foreign KEY (updated_by) references usuario (id)
) TABLESPACE pg_default;

create trigger trg_fill_titulo_marketplace BEFORE INSERT
or
update OF "tituloMarketplace",
titulo on produto for EACH row
execute FUNCTION fn_fill_titulo_marketplace ();

create trigger trg_set_status_estoque BEFORE INSERT
or
update OF estoque,
estoqueminimo on produto for EACH row
execute FUNCTION fn_set_status_estoque ();

create table public.produto_imagem (
  id bigint generated always as identity not null,
  produto_id integer not null,
  url text not null,
  path text not null,
  ordem integer not null default 0,
  createdat timestamp with time zone not null default now(),
  constraint produto_imagem_pkey primary key (id),
  constraint produto_imagem_produto_id_fkey foreign KEY (produto_id) references produto (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists produto_imagem_produto_id_idx on public.produto_imagem using btree (produto_id) TABLESPACE pg_default;

create unique INDEX IF not exists produto_imagem_produto_path_uq on public.produto_imagem using btree (path) TABLESPACE pg_default;

create table public.produtogrupo (
  id integer generated always as identity not null,
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  createdat timestamp without time zone not null default now(),
  updatedat timestamp without time zone not null default now(),
  constraint produtogrupo_pkey primary key (id)
) TABLESPACE pg_default;

create table public.unidademedida (
  id integer generated always as identity not null,
  sigla character varying not null,
  descricao text null,
  ativo boolean not null default true,
  createdat timestamp without time zone not null default now(),
  updatedat timestamp without time zone not null default now(),
  constraint unidademedida_pkey primary key (id),
  constraint unidademedida_sigla_key unique (sigla)
) TABLESPACE pg_default;

create table public.usuario (
  id uuid not null default gen_random_uuid (),
  email character varying not null,
  nome character varying not null,
  setorid integer null,
  perfilid integer null,
  createdat timestamp without time zone null default now(),
  updatedat timestamp without time zone null default now(),
  ativo boolean not null default true,
  salario numeric(12, 2) null,
  comissao_percent numeric(5, 2) null,
  data_admissao date null,
  data_demissao date null,
  constraint usuario_pkey primary key (id),
  constraint usuario_email_key unique (email),
  constraint usuario_auth_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint usuario_perfilid_fkey foreign KEY (perfilid) references perfil (id),
  constraint usuario_setorid_fkey foreign KEY (setorid) references setor (id)
) TABLESPACE pg_default;

create index IF not exists idx_usuario_email on public.usuario using btree (email) TABLESPACE pg_default;

create table public.venda (
  id integer generated always as identity not null,
  clienteid integer not null,
  status public.enum_status_venda not null,
  valortotal numeric not null,
  datavenda timestamp with time zone null,
  createdat timestamp with time zone null,
  updatedat timestamp with time zone null,
  created_by uuid null,
  desconto_tipo public.enum_tipo_desconto_venda null,
  desconto_valor numeric null,
  sub_total numeric not null,
  constraint vendaonline_pkey primary key (id),
  constraint fk_venda_online_cliente foreign KEY (clienteid) references cliente (id),
  constraint venda_created_by_fkey foreign KEY (created_by) references usuario (id)
) TABLESPACE pg_default;

create table public.vendaproduto (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  venda_id integer not null,
  produtoid integer not null,
  sub_total numeric not null,
  valor_total numeric not null,
  valor_desconto numeric null,
  tipo_desconto public.enum_tipo_desconto_venda null,
  quantidade integer not null,
  constraint vendaproduto_pkey primary key (id),
  constraint vendaproduto_produtoid_fkey foreign KEY (produtoid) references produto (id),
  constraint vendaproduto_venda_id_fkey foreign KEY (venda_id) references venda (id) on delete CASCADE
) TABLESPACE pg_default;

