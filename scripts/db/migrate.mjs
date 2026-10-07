import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import pg from 'pg';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledger = 'project_migrations.history';

export function listMigrations(directory) {
  return fs.readdirSync(directory).filter(name => /^\d+_.+\.sql$/.test(name)).sort().map(name => {
    const sql = fs.readFileSync(path.join(directory, name), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    return { name, sql, checksum: crypto.createHash('sha256').update(sql).digest('hex') };
  });
}

export function transactionSql(sql) {
  // Only remove an outer transaction wrapper; preserve BEGIN inside functions.
  return sql.replace(/^(\s*(?:(?:--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*)begin\s*;/i, '$1')
    .replace(/commit\s*;\s*$/i, '');
}

function configuration() {
  const file = path.join(root, '.env.migrations.local');
  const values = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  const url = process.env.MIGRATIONS_DATABASE_URL || values.MIGRATIONS_DATABASE_URL;
  const ref = process.env.MIGRATIONS_PROJECT_REF || values.MIGRATIONS_PROJECT_REF;
  if (!url || !ref) throw new Error('Configure MIGRATIONS_DATABASE_URL e MIGRATIONS_PROJECT_REF em .env.migrations.local.');
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('A conexao deve ser PostgreSQL.');
  const user = decodeURIComponent(parsed.username);
  if (parsed.hostname !== `db.${ref}.supabase.co` && !(parsed.hostname.endsWith('.pooler.supabase.com') && user === `postgres.${ref}`)) {
    throw new Error('A conexao nao corresponde ao projeto Supabase informado. Use Direct Connection ou Session Pooler.');
  }
  return { url, ref };
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
  const client = new pg.Client({ connectionString: config.url, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query("select pg_advisory_lock(hashtext('project_migrations'))");
    const exists = (await client.query("select to_regclass('project_migrations.history') as relation")).rows[0].relation;
    const history = exists ? (await client.query(`select name, checksum from ${ledger} order by name`)).rows : [];
    for (const entry of history) {
      const file = migrations.find(item => item.name === entry.name);
      if (!file) throw new Error(`Migration registrada ausente: ${entry.name}`);
      if (file.checksum !== entry.checksum) throw new Error(`Migration aplicada foi alterada: ${entry.name}. Crie uma nova migration.`);
    }
    const pending = migrations.filter(item => !history.some(entry => entry.name === item.name));
    console.log(`Projeto: ${config.ref} | Registradas: ${history.length} | Pendentes: ${pending.length}`);
    for (const item of pending) console.log(`  PENDENTE ${item.name}`);
    if (!exists) console.log('Historico deste runner ainda nao inicializado. Registre primeiro os arquivos ja aplicados com db:baseline.');
    if (command === 'status' || command === 'dry-run') {
      if (command === 'dry-run') console.log('Simulacao: lista e verifica o historico; nao executa SQL nem valida o schema.');
      return;
    }
    if (command === 'deploy' && !exists) throw new Error('Inicialize o historico com db:baseline para um banco existente. Para banco novo, use db:baseline -- --empty.');
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
    if (!yes) {
      const input = createInterface({ input: process.stdin, output: process.stdout });
      try {
        if ((await input.question(`Digite ${config.ref} para confirmar: `)).trim() !== config.ref) throw new Error('Operacao cancelada.');
      } finally { input.close(); }
    }
    await client.query('begin');
    try {
      await client.query(`create schema if not exists project_migrations;
        revoke all on schema project_migrations from public, anon, authenticated;
        create table if not exists ${ledger}(name text primary key, checksum text not null, applied_at timestamptz not null default now(), source text not null);
        revoke all on ${ledger} from public, anon, authenticated;`);
      await client.query('commit');
    } catch (error) { await client.query('rollback'); throw error; }
    for (const item of selected) {
      if (history.some(entry => entry.name === item.name)) continue;
      await client.query('begin');
      try {
        if (command === 'deploy') await client.query(transactionSql(item.sql));
        await client.query(`insert into ${ledger}(name,checksum,source) values($1,$2,$3)`, [item.name, item.checksum, command]);
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
    console.error(error.message?.includes('postgres') || error.message?.includes('password') ? 'Falha na conexao PostgreSQL. Verifique a configuracao.' : error.message);
    process.exitCode = 1;
  });
}
