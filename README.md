# Demir Diesel Storefront

Loja de pecas diesel em Next.js 16, React 19, TypeScript, Tailwind CSS 4 e
Supabase.

## Arquitetura

O banco da loja e independente do ERP:

- Supabase da loja: login, clientes, enderecos, favoritos, pedidos e catalogo
  espelhado;
- ERP: envia apenas categorias, produtos, precos, estoque e imagens;
- Asaas: processa PIX, cartão e boleto, com confirmação por webhook e split opcional de comissão.

Leia [docs/ARQUITETURA_LOJA_ERP.md](docs/ARQUITETURA_LOJA_ERP.md) para o fluxo
completo e o contrato de sincronizacao.

## Configuracao local

1. Copie `.env.example` para `.env.local`.
2. Crie um projeto Supabase exclusivo para a loja.
3. Execute `supabase/storefront/0001_storefront_schema.sql` no SQL Editor desse
   projeto.
4. Preencha as chaves do Supabase da loja, Asaas e o segredo de sincronizacao.
5. Instale e execute:

```powershell
$env:NODE_USE_SYSTEM_CA = "1"
npm.cmd install
npm.cmd run dev
```

`NODE_USE_SYSTEM_CA` e necessario nesta maquina porque o Kaspersky inspeciona a
conexao HTTPS do registry do npm.

## Pagamentos com Asaas

Configure no servidor:

- `ASAAS_ENVIRONMENT=sandbox` durante a homologacao;
- `ASAAS_API_KEY` com a chave privada da conta;
- `ASAAS_WEBHOOK_TOKEN` com um token forte e exclusivo;
- `CENTRAL_STOREFRONT_CONFIG_URL`, `CENTRAL_INSTALLATION_ID` e
  `CENTRAL_STOREFRONT_TOKEN` para receber a configuração publicada pela Central.

Esses valores são gerados na Central em **Empresas → empresa → Instalação do site
de vendas**. A instalação da loja possui identificador e token próprios e continua
vinculada à instalação do ERP que fornece o catálogo.

No painel do Asaas, cadastre o webhook HTTPS:

```text
POST https://SEU-DOMINIO/api/webhooks/asaas
Header asaas-access-token: mesmo valor de ASAAS_WEBHOOK_TOKEN
```

Para um banco da loja que ja existe, execute também
`supabase/migrations/20260929_configure_asaas_payments.sql` e
`supabase/migrations/20260930_add_central_store_payment_config.sql`. A URL de retorno
apenas devolve o cliente ao site; o pedido só é confirmado pelo webhook.

O percentual e a Wallet ID não ficam mais no ambiente da loja. Eles são
versionados em **Integrações → Loja virtual** na Central. A loja busca a revisão
mais recente e mantém uma cópia local para continuar vendendo se a Central
estiver temporariamente indisponível.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Sincronizacao do ERP

O ERP envia lotes de ate 500 produtos para:

```text
POST /api/integrations/erp/catalog
Authorization: Bearer <ERP_CATALOG_SYNC_SECRET>
```

O navegador nunca recebe uma chave ou conexao direta com o ERP.
