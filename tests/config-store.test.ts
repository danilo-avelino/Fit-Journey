import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { ConfigStore, validateConfig } from '../src/main/config-store';
import { DEFAULT_CONFIG } from '../src/shared/workspace';
import type { AppConfig } from '../src/shared/types';

function temporaryStore(t: TestContext): ConfigStore {
  const parent = mkdtempSync(join(tmpdir(), 'mosaico-config-store-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  return new ConfigStore(join(parent, 'nested', 'profile'));
}

function configuredWorkspace(): AppConfig {
  return {
    version: 1,
    launchAtLogin: false,
    targetDisplayId: 42,
    panels: [
      { id: 'principal', title: 'Painel principal', url: 'https://example.com/dashboard', zoomFactor: 1.25, reloadIntervalSec: 60 },
      { id: 'secundario', title: 'Operação', url: 'http://localhost:8080/status', zoomFactor: 0.75, reloadIntervalSec: 0 },
    ],
    layout: {
      type: 'split', id: 'divisao', direction: 'row', ratio: 0.65,
      first: { type: 'leaf', panelId: 'principal' },
      second: { type: 'leaf', panelId: 'secundario' },
    },
  };
}

test('first run creates the profile directory and returns independent defaults without writing a layout', (t) => {
  const store = temporaryStore(t);
  assert.ok(existsSync(store.directory));
  const first = store.load();
  assert.deepEqual(first, { config: DEFAULT_CONFIG, firstRun: true, warning: null });
  assert.equal(existsSync(store.path), false);

  first.config.launchAtLogin = false;
  first.config.panels.push(configuredWorkspace().panels[0]);
  assert.deepEqual(store.load().config, DEFAULT_CONFIG);
  assert.equal(DEFAULT_CONFIG.launchAtLogin, true);
  assert.deepEqual(DEFAULT_CONFIG.panels, []);
});

test('saved workspace restores both panel layout and Windows preferences on a new store instance', (t) => {
  const store = temporaryStore(t);
  const expected = configuredWorkspace();
  store.save(expected);

  const reopened = new ConfigStore(store.directory).load();
  assert.deepEqual(reopened, { config: expected, firstRun: false, warning: null });
  assert.deepEqual(JSON.parse(readFileSync(store.path, 'utf8')), expected);
  assert.notEqual(reopened.config, expected);
  assert.notEqual(reopened.config.panels[0], expected.panels[0]);

  reopened.config.panels[0].title = 'Not saved';
  assert.deepEqual(store.load().config, expected);
});

test('replacement saves leave one complete JSON document and no temporary file', (t) => {
  const store = temporaryStore(t);
  const config = configuredWorkspace();
  store.save(DEFAULT_CONFIG);

  for (let update = 0; update < 12; update += 1) {
    config.panels[0].title = `Atualização ${update}`;
    config.launchAtLogin = update % 2 === 0;
    config.targetDisplayId = update === 11 ? null : update;
    store.save(config);
    assert.deepEqual(JSON.parse(readFileSync(store.path, 'utf8')), config);
    assert.deepEqual(readdirSync(store.directory), ['workspace.json']);
  }
  assert.deepEqual(new ConfigStore(store.directory).load().config, config);
});

test('unreadable configurations are preserved byte-for-byte before a fresh workspace can be saved', async (t) => {
  const damagedFiles = [
    { name: 'empty file', contents: '' },
    { name: 'truncated JSON', contents: '{"version":1,"panels":[' },
    { name: 'unsupported version', contents: JSON.stringify({ ...configuredWorkspace(), version: 2 }) },
    { name: 'wrong document shape', contents: 'null\n' },
    { name: 'invalid page reference', contents: JSON.stringify({ ...configuredWorkspace(), layout: { type: 'leaf', panelId: 'missing' } }) },
  ];

  for (const damaged of damagedFiles) {
    await t.test(damaged.name, (subtest) => {
      const store = temporaryStore(subtest);
      writeFileSync(store.path, damaged.contents);

      const result = store.load();
      assert.deepEqual(result.config, DEFAULT_CONFIG);
      assert.equal(result.firstRun, false);
      assert.match(result.warning ?? '', /recuperação/);
      assert.equal(existsSync(store.path), false);
      const files = readdirSync(store.directory);
      assert.equal(files.length, 1);
      assert.match(files[0], /^workspace-recovery-\d+-[a-f\d-]+\.json$/);
      const backup = join(store.directory, files[0]);
      assert.equal(readFileSync(backup, 'utf8'), damaged.contents);

      store.save(result.config);
      assert.equal(readFileSync(backup, 'utf8'), damaged.contents);
      assert.deepEqual(store.load(), { config: DEFAULT_CONFIG, firstRun: false, warning: null });
    });
  }
});

test('corrupt loads in the same millisecond retain separate recoverable files', (t) => {
  const store = temporaryStore(t);
  t.mock.method(Date, 'now', () => 1_700_000_000_000);
  const originals = ['first damaged layout', '{"second":"truncated'];

  for (const contents of originals) {
    writeFileSync(store.path, contents);
    const recovered = store.load();
    assert.deepEqual(recovered.config, DEFAULT_CONFIG);
    assert.match(recovered.warning ?? '', /recuperação/);
  }

  const backups = readdirSync(store.directory);
  assert.equal(backups.length, originals.length);
  assert.ok(backups.every(name => name.startsWith('workspace-recovery-1700000000000-')));
  assert.deepEqual(
    backups.map(name => readFileSync(join(store.directory, name), 'utf8')).sort(),
    [...originals].sort(),
  );
});

test('failed validation never changes the previous valid file or leaves a partial replacement', (t) => {
  const store = temporaryStore(t);
  const previous = configuredWorkspace();
  store.save(previous);
  const before = readFileSync(store.path);
  const invalid = [
    { ...configuredWorkspace(), version: 99 },
    { ...configuredWorkspace(), launchAtLogin: 'true' },
    { ...configuredWorkspace(), targetDisplayId: '42' },
    { ...configuredWorkspace(), panels: [] },
    { ...configuredWorkspace(), layout: null },
    { ...configuredWorkspace(), panels: [{ ...configuredWorkspace().panels[0], url: 'javascript:alert(1)' }] },
  ];

  for (const config of invalid) {
    assert.throws(() => store.save(config as AppConfig));
    assert.deepEqual(readFileSync(store.path), before);
    assert.deepEqual(readdirSync(store.directory), ['workspace.json']);
    assert.deepEqual(store.load().config, previous);
  }
});

test('display identifiers are required nullable safe integers and never coerced', () => {
  for (const targetDisplayId of [null, 0, 42, Number.MAX_SAFE_INTEGER]) {
    assert.equal(validateConfig({ ...DEFAULT_CONFIG, targetDisplayId }).targetDisplayId, targetDisplayId);
  }
  for (const targetDisplayId of [undefined, '', '42', true, {}, [], 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, targetDisplayId }), /Monitor/);
  }
  const { targetDisplayId: _omitted, ...missingDisplay } = DEFAULT_CONFIG;
  assert.throws(() => validateConfig(missingDisplay), /Monitor/);
});

test('config validation requires schema version and a boolean startup preference', () => {
  for (const version of [undefined, null, '1', 0, 2]) {
    assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, version }), /Versão/);
  }
  for (const launchAtLogin of [undefined, null, 'true', 1, 0]) {
    assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, launchAtLogin }), /Inicialização/);
  }
  for (const value of [null, undefined, true, 42, 'configuration']) {
    assert.throws(() => validateConfig(value), /Configuração/);
  }
});
