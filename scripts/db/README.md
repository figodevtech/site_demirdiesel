# Migrations do projeto

Execute os comandos na raiz deste projeto, nao na raiz do ERP.

Configure apenas a URL PostgreSQL com usuario e senha em `.env.migrations` ou `.env.migrations.local`:

```ini
DATABASE_URL=postgresql://postgres.REFERENCIA:SENHA@HOST_DO_SESSION_POOLER:5432/postgres
```

Aceita tambem o nome anterior `MIGRATIONS_DATABASE_URL`. A referencia usada para confirmar o banco e extraida da URL. Os arquivos reais de ambiente sao ignorados pelo Git; codifique caracteres especiais da senha na URL. Nao use API key nem service-role key como senha PostgreSQL.

```bash
npm run db:status
npm run db:dry-run
npm run db:deploy
npm run db:test
```

O script compara os arquivos de `supabase/migrations` com `supabase_migrations.schema_migrations`, o historico oficial da nuvem, por versao (prefixo numerico do arquivo). Mostra pendentes, aplicadas e versoes somente na nuvem. Nao usa o historico separado da primeira versao deste runner. Nao baixa automaticamente os arquivos remotos nem compara o schema completo como a auditoria de multiplos bancos do ERP.

Status e dry-run nao alteram o banco; dry-run lista o plano, sem executar o SQL. Deploy usa a conexao configurada sem pedir confirmacao digitada, aplica cada arquivo em transacao junto com seu registro oficial e para em caso de erro. Migrations so na nuvem ou versoes duplicadas bloqueiam escritas para evitar repetir ou ignorar SQL. Recupere os arquivos remotos e concilie as versoes antes do deploy.

SQL aplicado manualmente pelo SQL Editor nao cria registro no historico oficial e nao pode ser deduzido automaticamente pelos arquivos. Registre somente arquivos ja aplicados e conferidos:

```bash
npm run db:baseline -- NOME_EXATO_DA_MIGRATION.sql
```

Baseline nao executa SQL nem comprova os objetos. Para banco realmente novo, inicialize com `npm run db:baseline -- --empty`. O schema inicial pode precisar existir antes das migrations desta pasta. Arquivos com a mesma data devem receber versoes distintas, conciliando primeiro registros existentes; nunca renomeie migrations registradas sem revisar o historico.

A opcao `-- --yes` dispensa a confirmacao para automacao previamente autorizada. Nenhuma migration e aplicada automaticamente ao instalar estes scripts.
