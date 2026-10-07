# Roteiro rápido — banco da loja Demir Diesel

Execute os comandos na raiz de `site_demirdiesel`. As migrations ficam em
`supabase/migrations` e são aplicadas somente no banco informado neste projeto.
Os comandos do ERP e da Central não atualizam o banco da loja.

## 1. Configurar a conexão

Copie `.env.migrations.example` para `.env.migrations` e preencha a URL fornecida
em Supabase → Connect → Session pooler (porta 5432), ou Direct Connection:

```ini
DATABASE_URL=postgresql://postgres.REFERENCIA:SENHA@HOST_DO_SESSION_POOLER:5432/postgres
```

Use o banco da loja, não o banco do ERP Demir. A senha é a senha PostgreSQL,
não uma API key do Asaas ou uma chave service-role. Caracteres especiais da senha
precisam ser codificados na URL. `.env.migrations.local` também é aceito e tem
precedência sobre `.env.migrations` para a mesma variável; `DATABASE_URL` do
ambiente do terminal tem precedência sobre os arquivos.

## 2. Antes do commit/merge

```powershell
npm run db:test
npm run db:status
npm run db:dry-run
```

Confira a referência do projeto exibida. O status compara versões dos arquivos
locais com `supabase_migrations.schema_migrations`. Pode haver uma migration nova
pendente; versões duplicadas ou somente na nuvem precisam ser conciliadas antes
do deploy. O dry-run lista o plano, sem executar ou validar o SQL no banco.

## 3. Primeira utilização: SQL já aplicado manualmente

SQL executado no SQL Editor pode ter alterado o schema sem registrar a migration
no histórico oficial. Portanto, “pendente” não comprova que o SQL nunca foi executado.

Antes de aplicar, compare tabelas, colunas, definições de funções, triggers,
permissões e eventuais alterações de dados de cada arquivo com o banco. Uma
migration posterior pode substituir uma função anterior; a comparação deve
considerar essa sequência. Não registre todas apenas porque algumas tabelas existem.

Após conferir uma migration já aplicada, registre somente seu histórico:

```powershell
npm run db:baseline -- NOME_EXATO_DA_MIGRATION.sql
npm run db:status
```

`baseline` não executa SQL nem realiza essa auditoria automaticamente. Ele pede
a referência do projeto para confirmar a operação. É possível informar vários
nomes de arquivos no mesmo comando.

### Versões duplicadas da loja

Há arquivos com a mesma data como prefixo. O Supabase exige uma versão única
por migration, preferencialmente `AAAAMMDDHHMMSS_descricao.sql`. Antes de renomear,
confira se a versão antiga está registrada na nuvem. Preserve registros existentes
e concilie os nomes com o histórico; não renomeie migrations já registradas às cegas.
O script bloqueia deploy e baseline enquanto houver versões duplicadas.

Para um banco realmente novo, use `npm run db:baseline -- --empty`. Isso não cria
o schema inicial: os arquivos em `supabase/storefront` não são aplicados por este
runner e podem ser pré-requisitos. Não use `--empty` para pular a conferência de um
banco existente.

## 4. Aplicar migrations pendentes

Depois de atualizar o checkout/repositório para a versão desejada:

```powershell
npm ci
npm run db:status
npm run db:dry-run
npm run db:deploy
```

Digite a referência do projeto quando solicitado. Cada arquivo é aplicado em
transação junto com seu registro no histórico. Se falhar, aquele arquivo é
revertido; migrations anteriores concluídas permanecem aplicadas. Não marque
manualmente como aplicada uma migration que falhou.

## 5. Conferência final

```powershell
npm run db:status
```

O esperado é zero pendências, zero versões somente na nuvem e nenhuma duplicada.
Depois publique o código compatível e valide checkout, pagamento, baixa de estoque,
integração ERP, consulta de estorno, recusa e nova tentativa no sandbox. Aplicar
SQL não publica código nem configura variáveis no deploy.

## Regras

- Execute cada projeto com a conexão do respectivo banco.
- Use o runner para novas migrations; reserve baseline para SQL já aplicado e conferido.
- Não edite uma migration registrada: crie uma nova.
- Não apague registros remotos para esconder divergências; recupere os arquivos ausentes.
- Não coloque migrations novas em subpastas: o runner lê somente arquivos da pasta principal.
- Nunca versionar `.env`, `.env.local`, `.env.migrations` ou `.env.migrations.local`.
- A conexão usa TLS com o mesmo tratamento de cadeia de certificados dos scripts do ERP.

Detalhes do runner: [scripts/db/README.md](scripts/db/README.md).
