import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listMigrations, transactionSql, connectionConfiguration, compareHistory } from './migrate.mjs';

test('same-day files remain distinct and CRLF does not change checksum', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-test-'));
  try {
    fs.writeFileSync(path.join(directory, '20261007_a.sql'), 'select 1;\r\n');
    fs.writeFileSync(path.join(directory, '20261007_b.sql'), 'select 2;\n');
    fs.writeFileSync(path.join(directory, 'README.md'), 'ignored');
    const files = listMigrations(directory);
    assert.equal(files.length, 2);
    assert.deepEqual(files.map(file => file.name), ['20261007_a.sql','20261007_b.sql']);
    fs.writeFileSync(path.join(directory, '20261007_a.sql'), 'select 1;\n');
    assert.equal(listMigrations(directory)[0].checksum, files[0].checksum);
    fs.writeFileSync(path.join(directory, '20261007_a.sql'), 'select 3;\n');
    assert.notEqual(listMigrations(directory)[0].checksum, files[0].checksum);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('removes outer transaction, keeps PL/pgSQL block and comments', () => {
  const sql = '-- comment\nbegin;\ncreate function f() returns void language plpgsql as $$\nbegin\n  perform 1;\nend;\n$$;\ncommit;\n';
  const result = transactionSql(sql);
  assert.ok(result.startsWith('-- comment\n'));
  assert.ok(result.includes('$$\nbegin\n  perform 1;\nend;\n$$;'));
  assert.ok(!result.includes('begin;'));
  assert.ok(!result.includes('commit;'));
  assert.equal(transactionSql('select 1;'), 'select 1;');
});


test('extracts reference from one URL and compares official cloud history', () => {
  assert.equal(connectionConfiguration('postgresql://postgres:secret@db.abc.supabase.co:5432/postgres').ref, 'abc');
  assert.equal(connectionConfiguration('postgresql://postgres.abc:secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres').ref, 'abc');
  assert.throws(() => connectionConfiguration('https://example.com'));
  const result = compareHistory([{version:'1',name:'1_a.sql'},{version:'2',name:'2_b.sql'}],[{version:'1'},{version:'3'}]);
  assert.deepEqual(result.pending.map(x=>x.version), ['2']);
  assert.deepEqual(result.remoteOnly.map(x=>x.version), ['3']);
  assert.deepEqual(compareHistory([{version:'1'},{version:'1'}],[]).duplicateVersions,['1']);
});
