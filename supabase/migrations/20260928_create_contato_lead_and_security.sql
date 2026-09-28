-- ==============================================================================
-- MIGRATION: 20260928_create_contato_lead_and_security.sql
-- Demir Diesel: Criação da tabela de leads de contato e reforço de RLS
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

-- Política de RLS: Apenas service_role pode consultar todos os contatos
DROP POLICY IF EXISTS "service_role_all_contato_lead" ON public.contato_lead;
CREATE POLICY "service_role_all_contato_lead" ON public.contato_lead
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Permite inserção anônima através da API backend com validação
DROP POLICY IF EXISTS "allow_anon_insert_contato_lead" ON public.contato_lead;
CREATE POLICY "allow_anon_insert_contato_lead" ON public.contato_lead
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ==============================================================================
-- 2. REFORÇO DE POLÍTICAS DE RLS PARA TABELAS DO CLIENTE
-- ==============================================================================

-- CLIENTE: Cada usuário autenticado pode ver e atualizar apenas seu próprio perfil
ALTER TABLE IF EXISTS public.cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_select_own" ON public.cliente;
CREATE POLICY "cliente_select_own" ON public.cliente
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cliente_update_own" ON public.cliente;
CREATE POLICY "cliente_update_own" ON public.cliente
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cliente_insert_own" ON public.cliente;
CREATE POLICY "cliente_insert_own" ON public.cliente
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- CLIENTE_ENDERECO: Apenas o dono do perfil acessa e gerencia seus endereços
ALTER TABLE IF EXISTS public.cliente_endereco ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_endereco_select_own" ON public.cliente_endereco;
CREATE POLICY "cliente_endereco_select_own" ON public.cliente_endereco
    FOR SELECT
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cliente_endereco_insert_own" ON public.cliente_endereco;
CREATE POLICY "cliente_endereco_insert_own" ON public.cliente_endereco
    FOR INSERT
    TO authenticated
    WITH CHECK (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cliente_endereco_update_own" ON public.cliente_endereco;
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

DROP POLICY IF EXISTS "cliente_endereco_delete_own" ON public.cliente_endereco;
CREATE POLICY "cliente_endereco_delete_own" ON public.cliente_endereco
    FOR DELETE
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

-- FAVORITO: Apenas o dono pode ver e alternar favoritos
ALTER TABLE IF EXISTS public.favorito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorito_select_own" ON public.favorito;
CREATE POLICY "favorito_select_own" ON public.favorito
    FOR SELECT
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "favorito_insert_own" ON public.favorito;
CREATE POLICY "favorito_insert_own" ON public.favorito
    FOR INSERT
    TO authenticated
    WITH CHECK (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "favorito_delete_own" ON public.favorito;
CREATE POLICY "favorito_delete_own" ON public.favorito
    FOR DELETE
    TO authenticated
    USING (
        cliente_id IN (
            SELECT id FROM public.cliente WHERE user_id = auth.uid()
        )
    );

-- VENDA: Apenas o dono pode consultar suas vendas. NUNCA liberar SELECT global.
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

-- VENDAPRODUTO: Apenas itens pertencentes às vendas do usuário autenticado
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
