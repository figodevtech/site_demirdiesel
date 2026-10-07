# Migrations da loja Demir

Execute na raiz de `site_demirdiesel`. O runner usa somente `supabase/migrations`, sem buscar arquivos no ERP, Central ou `supabase/storefront`.

## Configuração

Copie `.env.migrations.example` para `.env.migrations.local` e preencha:

```ini
MIGRATIONS_PROJECT_REF=referencia_do_projeto_supabase_da_loja
MIGRATIONS_DATABASE_URL=postgresql://postgres.REFERENCIA:SENHA@HOST_DO_SESSION_POOLER:5432/postgres
```

Use a conexão PostgreSQL fornecida em Supabase → Connect → Session pooler (porta 5432) ou Direct Connection. Codifique caracteres especiais da senha na URL. A service-role key e a chave Asaas não substituem a senha PostgreSQL. Esse arquivo é ignorado pelo Git e não precisa ser publicado na Vercel.

O runner verifica a referência do projeto antes de conectar. Não use credenciais do ERP na loja.

## Comandos

```bash
npm run db:status
npm run db:dry-run
npm run db:deploy
npm run db:test
```

`status` e `dry-run` são somente leitura. O dry-run mostra pendências e verifica checksums; não executa SQL nem comprova que o schema aceitará a migration.

`deploy` lista as pendências e pede que você digite a referência do projeto. Cada arquivo é aplicado com o registro de histórico na mesma transação; falhas interrompem a execução e revertem aquele arquivo. Arquivos anteriores já concluídos permanecem aplicados. Um lock impede duas execuções simultâneas.

## Banco já atualizado manualmente: primeiro baseline

Este runner mantém histórico próprio em `project_migrations.history`, por nome completo e checksum. Não utiliza nem modifica `supabase_migrations.schema_migrations`. Isso permite distinguir arquivos com a mesma data no nome. Não alterne runners sem reconciliar os respectivos históricos.

Na primeira utilização, todos os arquivos aparecem pendentes até que o histórico próprio seja inicializado. Antes do primeiro deploy, registre **somente os arquivos que você já aplicou e conferiu**:

```bash
npm run db:baseline -- 20261006_site_order_refund_request.sql 20261007_refund_physical_stock_guard.sql
```

O exemplo não representa toda a situação do banco: inclua também as outras migrations já aplicadas. Baseline registra o checksum sem executar SQL e sem verificar os objetos; não use para migrations pendentes. O comando exige confirmação da referência. Depois rode `db:status` e confira a lista restante antes do deploy.

Para um banco realmente novo, sem migrations anteriores:

```bash
npm run db:baseline -- --empty
```

As migrations desta pasta podem depender do schema inicial de `supabase/storefront`; este comando não cria esse schema automaticamente.

Automação com autorização prévia pode adicionar `-- --yes` ao deploy. Não edite um arquivo já registrado: crie uma nova migration. O runner interrompe diante de checksum divergente ou arquivo aplicado ausente.

Nenhuma conexão real ou baseline é criada automaticamente pela instalação dos scripts.
