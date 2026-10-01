# Arquitetura da loja e integracao com o ERP

## Decisao principal

O site nao usa o banco do ERP para autenticacao, clientes, enderecos,
favoritos, carrinho, pagamentos ou pedidos.

O Supabase configurado em `NEXT_PUBLIC_STORE_SUPABASE_*` e
`STORE_SUPABASE_SERVICE_ROLE_KEY` pertence exclusivamente a loja.

## Fluxo de dados

```text
ERP
  |  envia somente categoria, produto, preco, estoque e imagens
  v
POST /api/integrations/erp/catalog
  |
  v
Banco da loja (espelho do catalogo)
  |-- Supabase Auth
  |-- clientes e enderecos
  |-- favoritos
  |-- catalogo espelhado
  |-- pedidos e itens
  `-- status do pagamento
          ^
          |
         Asaas
```

O navegador nunca recebe credencial do ERP e nunca consulta o ERP diretamente.
Uma indisponibilidade do ERP nao derruba login, conta, historico de pedidos ou
checkout. O checkout valida preco e estoque no espelho mais recente da loja.

## O que ja existe no projeto

- Next.js 16, React 19, TypeScript e Tailwind CSS 4.
- Catalogo real, categorias, busca, pagina de produto e galeria.
- Carrinho e favoritos.
- Supabase Auth, cadastro, perfil e enderecos.
- Checkout com validacao de preco/estoque no servidor.
- Integração Asaas com cobrança hospedada, webhook autenticado e processamento idempotente.
- Area de pedidos e consulta de status.
- DTO publico de produto que evita expor campos fiscais/internos.
- RLS e migracoes iniciais de seguranca.

## Acoplamento encontrado

Antes desta separacao, um unico Supabase era usado para catalogo do ERP e para
`cliente`, `cliente_endereco`, `favorito`, `venda` e `vendaproduto`. Trocar as
credenciais para um projeto exclusivo da loja remove o acoplamento sem exigir a
reescrita imediata de toda a interface.

## Contrato de sincronizacao

Endpoint: `POST /api/integrations/erp/catalog`

```http
Authorization: Bearer <ERP_CATALOG_SYNC_SECRET>
Content-Type: application/json
```

```json
{
  "categories": [
    { "id": 10, "name": "Injecao diesel", "active": true }
  ],
  "products": [
    {
      "id": 123,
      "title": "Bico injetor",
      "marketplaceTitle": "Bico injetor linha pesada",
      "marketplaceDescription": "Descricao comercial publica",
      "price": 850.9,
      "stock": 4,
      "reference": "ABC-123",
      "manufacturer": "Fabricante",
      "categoryId": 10,
      "imageUrl": "https://exemplo.com/produto.jpg",
      "condition": "NOVO",
      "visible": true,
      "deleted": false,
      "updatedAt": "2026-09-29T18:00:00Z",
      "images": []
    }
  ]
}
```

Cada chamada aceita ate 500 produtos. Para cargas maiores, o ERP envia lotes.
O endpoint faz `upsert` pelo ID original do ERP, mas grava somente na loja.

## Ativacao

1. Criar um projeto Supabase exclusivo para a loja.
2. Aplicar `supabase/storefront/0001_storefront_schema.sql` no SQL Editor.
3. Configurar `NEXT_PUBLIC_STORE_SUPABASE_URL`,
   `NEXT_PUBLIC_STORE_SUPABASE_ANON_KEY` e
   `STORE_SUPABASE_SERVICE_ROLE_KEY`.
4. Configurar `ERP_CATALOG_SYNC_SECRET` nos dois lados.
5. Configurar `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` e cadastrar
   `/api/webhooks/asaas` no painel do Asaas.
6. Configurar o token da loja nos dois lados e publicar carteira e percentual
   em **Integrações → Loja virtual** na Central.
7. Fazer a carga inicial do catalogo em lotes.
8. Trocar a sincronizacao para incremental por alteracao.
9. Validar e remover as variaveis Supabase legadas.

## Regra para pedidos

O pedido nasce e permanece no banco da loja. Se for necessario registrar uma
venda no ERP, isso ocorre por integracao assincrona apos o pagamento, enviando
uma copia do pedido. O ERP nao e a fonte de verdade para conta ou historico.
