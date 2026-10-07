import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import pg from 'pg';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledger = 'supabase_migrations.schema_migrations';

export function listMigrations(directory) {
  return fs.readdirSync(directory).filter(name => /^\d+_.+\.sql$/.test(name)).sort().map(name => {
    const sql = fs.readFileSync(path.join(directory, name), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const [, version, migrationName] = name.match(/^(\d+)_(.+)\.sql$/);
    return { name, version, migrationName, sql, checksum: crypto.createHash('sha256').update(sql).digest('hex') };
  });
}

export function transactionSql(sql) {
  // Only remove an outer transaction wrapper; preserve BEGIN inside functions.
  return sql.replace(/^(\s*(?:(?:--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*)begin\s*;/i, '$1')
    .replace(/commit\s*;\s*$/i, '');
}

export function connectionConfiguration(url) {
  if (!url) throw new Error('Configure DATABASE_URL em .env.migrations ou .env.migrations.local.');
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('A conexao deve ser PostgreSQL.');
  const direct = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  const pooler = parsed.hostname.endsWith('.pooler.supabase.com') ? decodeURIComponent(parsed.username).match(/^postgres\.([a-z0-9]+)$/) : null;
  const ref = direct?.[1] || pooler?.[1];
  if (!ref) throw new Error('Use a URL Supabase Direct Connection ou Session Pooler.');
  return { url, ref };
}

function configuration() {
  const values = {};
  for (const name of ['.env.migrations', '.env.migrations.local']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return connectionConfiguration(process.env.DATABASE_URL || values.DATABASE_URL || process.env.MIGRATIONS_DATABASE_URL || values.MIGRATIONS_DATABASE_URL);
}

export function compareHistory(migrations, history) {
  const applied = new Set(history.map(entry => String(entry.version)));
  const local = new Set(migrations.map(item => item.version));
  const duplicateVersions = [...local].filter(version => migrations.filter(item => item.version === version).length > 1);
  return {
    pending: migrations.filter(item => !applied.has(item.version)),
    remoteOnly: history.filter(entry => !local.has(String(entry.version))),
    duplicateVersions,
  };
}

export async function main() {
  const [command = 'status', ...args] = process.argv.slice(2);
  if (!['status', 'dry-run', 'deploy', 'baseline'].includes(command)) throw new Error('Comando invalido. Use status, dry-run, deploy ou baseline.');
  const yes = args.includes('--yes');
  const names = args.filter(arg => arg !== '--yes');
  if (command !== 'baseline' && names.length) throw new Error('Este comando nao recebe nomes de arquivos.');
  if (command === 'baseline' && !names.length) throw new Error('Informe os nomes exatos das migrations ja aplicadas manualmente.');
  const migrations = listMigrations(path.join(root, 'supabase/migrations'));
  const config = configuration();
  const client = new pg.Client({ connectionString: config.url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query("select pg_advisory_lock(hashtext('supabase_migrations.schema_migrations'))");
    const exists = (await client.query("select to_regclass('supabase_migrations.schema_migrations') as relation")).rows[0].relation;
    const history = exists ? (await client.query(`select version from ${ledger} order by version`)).rows : [];
    const { pending, remoteOnly, duplicateVersions } = compareHistory(migrations, history);
    console.log(`Projeto: ${config.ref} | Aplicadas na nuvem: ${history.length} | Pendentes: ${pending.length} | Somente na nuvem: ${remoteOnly.length}`);
    for (const item of pending) console.log(`  PENDENTE ${item.name}`);
    for (const entry of remoteOnly) console.log(`  SOMENTE NA NUVEM ${entry.version}`);
    for (const version of duplicateVersions) console.log(`  VERSAO DUPLICADA ${version}: ${migrations.filter(item => item.version === version).map(item => item.name).join(', ')}`);
    if (!exists) console.log('Sem historico oficial do Supabase. SQL aplicado manualmente nao e detectado automaticamente; registre-o antes do deploy.');
    if (command === 'status' || command === 'dry-run') {
      if (command === 'dry-run') console.log('Simulacao: compara historicos; nao executa SQL nem valida o schema.');
      return;
    }
    if (remoteOnly.length) throw new Error('Ha migrations somente na nuvem. Recupere e confira esses arquivos antes de alterar o banco.');
    if (duplicateVersions.length) throw new Error('O Supabase exige uma versao unica por arquivo. Corrija as versoes duplicadas conciliando primeiro o historico remoto.');
    if (command === 'deploy' && !exists) throw new Error('Sem historico remoto: registre migrations manuais com db:baseline. Para banco novo, use db:baseline -- --empty.');
    let selected = pending;
    if (command === 'baseline') {
      if (names.includes('--empty') && names.length !== 1) throw new Error('--empty nao pode acompanhar arquivos.');
      selected = names[0] === '--empty' ? [] : names.map(name => {
        const item = migrations.find(file => file.name === name);
        if (!item) throw new Error(`Arquivo nao encontrado: ${name}`);
        return item;
      });
      console.log('Baseline registra o historico SEM executar ou comprovar o SQL. Use somente para arquivos ja aplicados.');
    }
    console.log(`${command}: ${selected.length} arquivo(s) no projeto ${config.ref}.`);
    if (!yes && command === 'baseline') {
      const input = createInterface({ input: process.stdin, output: process.stdout });
      try {
        if ((await input.question(`Digite ${config.ref} para confirmar: `)).trim() !== config.ref) throw new Error('Operacao cancelada.');
      } finally { input.close(); }
    }
    await client.query('begin');
    try {
      await client.query(`create schema if not exists supabase_migrations;
        revoke all on schema supabase_migrations from public, anon, authenticated;
        create table if not exists ${ledger}(version text primary key, statements text[], name text);
        revoke all on ${ledger} from public, anon, authenticated;`);
      await client.query('commit');
    } catch (error) { await client.query('rollback'); throw error; }
    for (const item of selected) {
      if (history.some(entry => String(entry.version) === item.version)) continue;
      await client.query('begin');
      try {
        if (command === 'deploy') await client.query(transactionSql(item.sql));
        await client.query(`insert into ${ledger}(version,name,statements) values($1,$2,$3)`, [item.version, item.migrationName, command === 'deploy' ? [item.sql] : []]);
        await client.query('commit');
        console.log(`${command === 'deploy' ? 'APLICADA' : 'REGISTRADA'} ${item.name}`);
      } catch (error) {
        await client.query('rollback');
        console.error(`Falha em ${item.name}. SQLSTATE: ${error.code || 'indisponivel'}. Alteracoes deste arquivo revertidas.`);
        throw new Error('Operacao interrompida; as migrations anteriores permanecem registradas.');
      }
    }
  } finally { await client.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    // Do not print URLs, credentials, SQL bodies or database driver details.
    const message = String(error.message || "");
    if (/timeout|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH/i.test(message) || ['ETIMEDOUT','ENETUNREACH','EHOSTUNREACH'].includes(error.code)) {
      console.error('Conexao PostgreSQL indisponivel ou expirou. Se usa db.PROJETO.supabase.co (IPv6), copie a URL Session Pooler, porta 5432, do painel Supabase.');
    } else if (error.code === '28P01' || /password authentication/i.test(message)) {
      console.error('Senha PostgreSQL recusada. Confira a senha e a codificacao de caracteres especiais na URL.');
    } else if (/tenant or user not found/i.test(message)) {
      console.error('Projeto ou usuario nao encontrado nesse pooler. Copie host e usuario exatos do Session Pooler no painel Supabase.');
    } else {
      console.error(message.includes('postgres') || message.includes('password') ? 'Falha na conexao PostgreSQL. Verifique a configuracao.' : message);
    }
    process.exitCode = 1;
  });
}
