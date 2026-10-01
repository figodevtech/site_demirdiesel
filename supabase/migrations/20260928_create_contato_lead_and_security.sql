-- ==============================================================================
-- MIGRATION: 20260928_create_contato_lead_and_security.sql
-- Demir Diesel: Criação de leads de contato, RPC transacional e reforço de RLS/Grants
-- ==============================================================================

-- 1. TABELA DE CONTATOS / LEADS
CREATE TABLE IF NOT EXISTS public.contato_lead (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    assunto TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOVO', -- 'NOVO', 'EM_ATENDIMENTO', 'RESPONDIDO', 'ARQUIVADO'
    origem TEXT DEFAULT 'SITE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consulta ágil no painel administrativo
CREATE INDEX IF NOT EXISTS idx_contato_lead_created_at ON public.contato_lead (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contato_lead_status ON public.contato_lead (status);
CREATE INDEX IF NOT EXISTS idx_contato_lead_email ON public.contato_lead (email);

-- Habilita RLS na tabela contato_lead
ALTER TABLE public.contato_lead ENABLE ROW LEVEL SECURITY;

-- Permissões estritas: Apenas o backend (service_role) acessa e grava leads
DROP POLICY IF EXISTS "service_role_all_contato_lead" ON public.contato_lead;
CREATE POLICY "service_role_all_contato_lead" ON public.contato_lead
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Remove qualquer política ou permissão de inserção anônima direta do browser
DROP POLICY IF EXISTS "allow_anon_insert_contato_lead" ON public.contato_lead;
REVOKE ALL ON public.contato_lead FROM anon, authenticated, public;
GRANT ALL ON public.contato_lead TO service_role;


-- ==============================================================================
-- 2. OPERAÇÃO ATÔMICA / TRANSACIONAL: CRIAÇÃO DE PEDIDO DO SITE
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_criar_pedido_site(
    p_cliente_id integer,
    p_endereco_snapshot jsonb,
    p_itens jsonb,
    p_subtotal numeric,
    p_total numeric,
    p_canal text DEFAULT 'ONLINE',
    p_forma_pagamento text DEFAULT 'Asaas'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venda_id integer;
    v_item jsonb;
    v_produtoid integer;
    v_quantidade integer;
    v_sub_total numeric;
    v_valor_total numeric;
    v_canal public.enum_canal_venda;
    v_now timestamptz := now();
BEGIN
    IF p_cliente_id IS NULL OR p_cliente_id <= 0 THEN
        RAISE EXCEPTION 'Cliente inválido para criação de pedido.';
    END IF;

    IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
        RAISE EXCEPTION 'Pedido deve conter pelo menos um item.';
    END IF;

    -- Converte canal com fallback seguro para ONLINE
    BEGIN
        v_canal := COALESCE(p_canal, 'ONLINE')::public.enum_canal_venda;
    EXCEPTION WHEN OTHERS THEN
        v_canal := 'ONLINE'::public.enum_canal_venda;
    END;

    -- 1. Cria a venda com status PENDENTE (transação única)
    INSERT INTO public.venda (
        clienteid,
        status,
        valortotal,
        sub_total,
        datavenda,
        createdat,
        updatedat,
        forma_pagamento,
        endereco_entrega_snapshot,
        canal
    ) VALUES (
        p_cliente_id,
        'PENDENTE'::public.enum_status_venda,
        p_total,
        p_subtotal,
        v_now,
        v_now,
        v_now,
        p_forma_pagamento,
        p_endereco_snapshot,
        v_canal
    )
    RETURNING id INTO v_venda_id;

    -- 2. Insere todos os itens. Se qualquer item falhar, rollback total automático do plpgsql
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        v_produtoid := (v_item->>'produtoid')::integer;
        v_quantidade := (v_item->>'quantidade')::integer;
        v_sub_total := (v_item->>'sub_total')::numeric;
        v_valor_total := (v_item->>'valor_total')::numeric;

        IF v_produtoid IS NULL OR v_quantidade IS NULL OR v_quantidade <= 0 THEN
            RAISE EXCEPTION 'Item com produto ou quantidade inválida no pedido: produto % quantidade %', v_produtoid, v_quantidade;
        END IF;

        INSERT INTO public.vendaproduto (
            venda_id,
            produtoid,
            quantidade,
            sub_total,
            valor_total,
            valor_frete,
            created_at,
            updated_at
        ) VALUES (
            v_venda_id,
            v_produtoid,
            v_quantidade,
            v_sub_total,
            v_valor_total,
            0,
            v_now,
            v_now
        );
    END LOOP;

    RETURN v_venda_id;
END;
$$;

-- Restringe a execução da RPC atômica apenas para service_role (não exposta ao browser)
REVOKE ALL ON FUNCTION public.fn_criar_pedido_site FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_criar_pedido_site TO service_role;


-- ==============================================================================
-- 3. REFORÇO DE RLS E POLÍTICAS DE OWNERSHIP (VINCULADAS A auth.uid())
-- ==============================================================================

-- CLIENTE
ALTER TABLE IF EXISTS public.cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_select_own" ON public.cliente;
CREATE POLICY "cliente_select_own" ON public.cliente
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cliente_insert_own" ON public.cliente;
CREATE POLICY "cliente_insert_own" ON public.cliente
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cliente_update_own" ON public.cliente;
CREATE POLICY "cliente_update_own" ON public.cliente
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- CLIENTE_ENDERECO
ALTER TABLE IF EXISTS public.cliente_endereco ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas legadas com permissão ampla
DROP POLICY IF EXISTS "Endereços: Ver seus próprios" ON public.cliente_endereco;
DROP POLICY IF EXISTS "Endereços: Inserir seus próprios" ON public.cliente_endereco;
DROP POLICY IF EXISTS "Endereços: Atualizar seus próprios" ON public.cliente_endereco;
DROP POLICY IF EXISTS "Endereços: Deletar seus próprios" ON public.cliente_endereco;
DROP POLICY IF EXISTS "cliente_endereco_select_own" ON public.cliente_endereco;
DROP POLICY IF EXISTS "cliente_endereco_insert_own" ON public.cliente_endereco;
DROP POLICY IF EXISTS "cliente_endereco_update_own" ON public.cliente_endereco;
DROP POLICY IF EXISTS "cliente_endereco_delete_own" ON public.cliente_endereco;

CREATE POLICY "cliente_endereco_select_own" ON public.cliente_endereco
    FOR SELECT
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cliente_endereco_insert_own" ON public.cliente_endereco
    FOR INSERT
    TO authenticated
    WITH CHECK (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cliente_endereco_update_own" ON public.cliente_endereco
    FOR UPDATE
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "cliente_endereco_delete_own" ON public.cliente_endereco
    FOR DELETE
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );


-- FAVORITO
ALTER TABLE IF EXISTS public.favorito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Favoritos: Ver seus próprios" ON public.favorito;
DROP POLICY IF EXISTS "Favoritos: Gerenciar seus próprios" ON public.favorito;
DROP POLICY IF EXISTS "favorito_select_own" ON public.favorito;
DROP POLICY IF EXISTS "favorito_insert_own" ON public.favorito;
DROP POLICY IF EXISTS "favorito_delete_own" ON public.favorito;

CREATE POLICY "favorito_select_own" ON public.favorito
    FOR SELECT
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "favorito_insert_own" ON public.favorito
    FOR INSERT
    TO authenticated
    WITH CHECK (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "favorito_delete_own" ON public.favorito
    FOR DELETE
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );


-- VENDA: Apenas leitura das próprias compras pelo cliente autenticado
ALTER TABLE IF EXISTS public.venda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venda_select_own" ON public.venda;
CREATE POLICY "venda_select_own" ON public.venda
    FOR SELECT
    TO authenticated
    USING (
        clienteid IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );


-- VENDAPRODUTO: Apenas leitura de itens de pedidos pertencentes ao cliente autenticado
ALTER TABLE IF EXISTS public.vendaproduto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendaproduto_select_own" ON public.vendaproduto;
CREATE POLICY "vendaproduto_select_own" ON public.vendaproduto
    FOR SELECT
    TO authenticated
    USING (
        venda_id IN (
            SELECT v.id FROM public.venda v
            JOIN public.cliente c ON c.id = v.clienteid
            WHERE c.user_id = auth.uid()
        )
    );


-- ==============================================================================
-- 4. GRANTS MÍNIMOS NECESSÁRIOS
-- ==============================================================================

-- Papel authenticated: Apenas os comandos estritamente necessários
GRANT SELECT, INSERT, UPDATE ON public.cliente TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_endereco TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorito TO authenticated;
GRANT SELECT ON public.venda TO authenticated;
GRANT SELECT ON public.vendaproduto TO authenticated;

-- Nunca permitir INSERT/UPDATE/DELETE em vendas pelo browser
REVOKE INSERT, UPDATE, DELETE ON public.venda FROM authenticated, anon, public;
REVOKE INSERT, UPDATE, DELETE ON public.vendaproduto FROM authenticated, anon, public;
REVOKE ALL ON public.venda FROM anon;
REVOKE ALL ON public.vendaproduto FROM anon;
REVOKE ALL ON public.cliente FROM anon;
REVOKE ALL ON public.cliente_endereco FROM anon;
REVOKE ALL ON public.favorito FROM anon;

-- Permite avanço de sequências públicas para inserções legítimas
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Garante que o service_role continue com acesso integral para operações de retaguarda
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
