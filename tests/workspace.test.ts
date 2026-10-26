import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPanel, DEFAULT_CONFIG, MAX_PANELS, normalizeUrl, removeLeaf, splitLeaf, updateRatio, validateWorkspace } from '../src/shared/workspace';
import type { LayoutNode, Panel, Workspace } from '../src/shared/types';

function panel(id: string): Panel {
  return { id, title: `Página ${id}`, url: `https://example.com/${id}`, zoomFactor: 1, reloadIntervalSec: 0 };
}

function leaf(panelId: string): LayoutNode { return { type: 'leaf', panelId }; }

function fixture(): Workspace {
  return {
    panels: [panel('a'), panel('b'), panel('c')],
    layout: {
      type: 'split', id: 'outer', direction: 'row', ratio: 0.65, first: leaf('a'),
      second: { type: 'split', id: 'inner', direction: 'column', ratio: 0.3, first: leaf('b'), second: leaf('c') },
    },
  };
}

test('normalizes web addresses while retaining path, query and fragment', () => {
  assert.equal(normalizeUrl('Example.com/painel?turno=2#hoje'), 'https://example.com/painel?turno=2#hoje');
  assert.equal(normalizeUrl('HTTP://example.com:80/'), 'http://example.com/');
  assert.equal(normalizeUrl('example.com:8443/panel'), 'https://example.com:8443/panel');
  assert.equal(normalizeUrl('localhost:3000'), 'http://localhost:3000/');
  assert.equal(normalizeUrl('127.0.0.1:8080/status'), 'http://127.0.0.1:8080/status');
  assert.equal(normalizeUrl('[::1]:3000'), 'http://[::1]:3000/');
  assert.equal(normalizeUrl('https://intranet/dashboard'), 'https://intranet/dashboard');
});

test('rejects dangerous protocols, credentials, whitespace and malformed addresses', () => {
  for (const url of [
    '', ' ', ' example.com', 'example.com/hello world', 'https://example.com\n',
    'javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'ftp://example.com',
    'http:example.com', '//example.com', 'https://', 'https://example.com:99999',
    'https://user:secret@example.com', 'user@example.com', 'https://user@example.com',
    'https:\\example.com', 'https://example.com/\u0000', 'https://example.com/' + 'a'.repeat(4096),
  ]) assert.throws(() => normalizeUrl(url), Error, url);
});

test('creates independent page IDs and usable defaults', () => {
  const first = createPanel('example.com');
  const second = createPanel('example.com', '  Recepção  ');
  assert.notEqual(first.id, second.id);
  assert.equal(first.title, 'example.com');
  assert.equal(second.title, 'Recepção');
  assert.equal(first.zoomFactor, 1);
  assert.equal(first.reloadIntervalSec, 0);
  assert.throws(() => createPanel('example.com', 'a'.repeat(161)));
  assert.throws(() => createPanel('example.com', 'duas\nlinhas'));
  assert.deepEqual(validateWorkspace({ panels: [first], layout: leaf(first.id) }).panels[0], first);
  assert.equal(DEFAULT_CONFIG.launchAtLogin, true);
  assert.deepEqual(validateWorkspace(DEFAULT_CONFIG), { panels: [], layout: null });
});

test('splits only the selected panel and preserves other layout branches', () => {
  const original = fixture().layout!;
  const originalJson = JSON.stringify(original);
  const result = splitLeaf(original, 'b', 'd', 'row', 'new-split')!;
  assert.equal(JSON.stringify(original), originalJson);
  assert.equal(result.type, 'split');
  if (result.type !== 'split' || original.type !== 'split') return;
  assert.equal(result.ratio, 0.65);
  assert.equal(result.first, original.first);
  assert.equal(result.second.type, 'split');
  if (result.second.type !== 'split') return;
  assert.equal(result.second.ratio, 0.3);
  assert.deepEqual(result.second.first, {
    type: 'split', id: 'new-split', direction: 'row', ratio: 0.5, first: leaf('b'), second: leaf('d'),
  });
  assert.doesNotThrow(() => validateWorkspace({ panels: [...fixture().panels, panel('d')], layout: result }));
  assert.equal(splitLeaf(original, 'missing', 'd', 'row', 'new-split'), original);
  assert.deepEqual(splitLeaf(null, '', 'a', 'column', 'initial'), leaf('a'));
});

test('removing a page collapses its split and fills the freed region', () => {
  const initial = fixture().layout!;
  const withoutB = removeLeaf(initial, 'b');
  assert.deepEqual(withoutB, { type: 'split', id: 'outer', direction: 'row', ratio: 0.65, first: leaf('a'), second: leaf('c') });
  assert.deepEqual(removeLeaf(withoutB, 'a'), leaf('c'));
  assert.equal(removeLeaf(leaf('c'), 'c'), null);
  assert.equal(removeLeaf(null, 'a'), null);
  assert.equal(removeLeaf(initial, 'missing'), initial);
  assert.doesNotThrow(() => validateWorkspace({ panels: [panel('a'), panel('c')], layout: withoutB }));
});

test('resizing one split is immutable and keeps both children visible', () => {
  const initial = fixture().layout!;
  const result = updateRatio(initial, 'inner', 0.78)!;
  assert.equal(initial.type, 'split');
  if (initial.type !== 'split' || result.type !== 'split') return;
  assert.equal(result.first, initial.first);
  assert.equal(result.ratio, 0.65);
  assert.equal(result.second.type === 'split' && result.second.ratio, 0.78);
  assert.equal(initial.second.type === 'split' && initial.second.ratio, 0.3);
  const minimum = updateRatio(initial, 'outer', -5)!;
  const maximum = updateRatio(initial, 'outer', 5)!;
  assert.equal(minimum.type === 'split' && minimum.ratio, 0.1);
  assert.equal(maximum.type === 'split' && maximum.ratio, 0.9);
  assert.equal(updateRatio(initial, 'missing', 0.7), initial);
  for (const bad of [NaN, Infinity, -Infinity]) assert.throws(() => updateRatio(initial, 'outer', bad));
});

test('validation makes a sanitized deep copy with exact coverage of all pages', () => {
  const original = fixture();
  const validated = validateWorkspace({ ...original, unexpected: 'ignored' });
  assert.deepEqual(validated, original);
  assert.notEqual(validated, original);
  assert.notEqual(validated.layout, original.layout);
  assert.notEqual(validated.panels[0], original.panels[0]);
  original.panels[0].title = 'changed';
  assert.equal(validated.panels[0].title, 'Página a');
  assert.throws(() => validateWorkspace({ panels: [panel('a')], layout: null }));
  assert.throws(() => validateWorkspace({ panels: [], layout: leaf('a') }));
  assert.throws(() => validateWorkspace({ panels: [panel('a'), panel('b')], layout: leaf('a') }));
  assert.throws(() => validateWorkspace({ panels: [panel('a'), panel('a')], layout: leaf('a') }));
  assert.throws(() => validateWorkspace({ panels: [panel('a')], layout: { type: 'split', id: 'split', direction: 'row', ratio: 0.5, first: leaf('a'), second: leaf('a') } }));
});

test('rejects malformed nodes, duplicate split IDs and cycles', () => {
  for (const input of [null, undefined, [], {}, { panels: 'a', layout: null }, { panels: [], layout: {} }]) {
    assert.throws(() => validateWorkspace(input));
  }
  for (const replacement of [
    { type: 'unsupported' },
    { type: 'leaf', panelId: '../a' },
    { type: 'split', id: 'split', direction: 'diagonal', ratio: 0.5, first: leaf('a'), second: leaf('b') },
    { type: 'split', id: 'split', direction: 'row', ratio: NaN, first: leaf('a'), second: leaf('b') },
    { type: 'split', id: 'split', direction: 'row', ratio: 0.09, first: leaf('a'), second: leaf('b') },
    { type: 'split', id: 'split', direction: 'row', ratio: 0.91, first: leaf('a'), second: leaf('b') },
  ]) assert.throws(() => validateWorkspace({ panels: [panel('a'), panel('b')], layout: replacement }));
  const duplicate = fixture();
  if (duplicate.layout?.type === 'split' && duplicate.layout.second.type === 'split') duplicate.layout.second.id = duplicate.layout.id;
  assert.throws(() => validateWorkspace(duplicate), /repetidos/);
  const cycle: Record<string, unknown> = { type: 'split', id: 'cycle', direction: 'row', ratio: 0.5, first: leaf('a') };
  cycle.second = cycle;
  assert.throws(() => validateWorkspace({ panels: [panel('a')], layout: cycle }), /circular/);
});

test('validates zoom, refresh interval, identifiers, title and URL types', () => {
  const invalid = [
    { zoomFactor: 0 }, { zoomFactor: 3.1 }, { zoomFactor: NaN }, { zoomFactor: Infinity }, { zoomFactor: '1' },
    { reloadIntervalSec: 1 }, { reloadIntervalSec: -1 }, { reloadIntervalSec: 10.5 }, { reloadIntervalSec: 86401 }, { reloadIntervalSec: Infinity },
    { title: 'x'.repeat(161) }, { title: 'one\ntwo' }, { title: null },
    { id: '' }, { id: 'x'.repeat(129) }, { id: 'a/b' }, { url: null }, { url: 'javascript:alert(1)' },
  ];
  for (const changes of invalid) assert.throws(() => validateWorkspace({ panels: [{ ...panel('a'), ...changes }], layout: leaf('a') }));
  for (const zoomFactor of [0.25, 1, 3]) {
    for (const reloadIntervalSec of [0, 10, 86400]) {
      assert.doesNotThrow(() => validateWorkspace({ panels: [{ ...panel('a'), zoomFactor, reloadIntervalSec }], layout: leaf('a') }));
    }
  }
});

test('supports many nested divisions while rejecting oversized imports', () => {
  const panels = Array.from({ length: MAX_PANELS }, (_, i) => panel(`p${i}`));
  let layout: LayoutNode = leaf('p0');
  for (let i = 1; i < MAX_PANELS; i++) layout = { type: 'split', id: `s${i}`, direction: 'row', ratio: 0.5, first: layout, second: leaf(`p${i}`) };
  assert.equal(validateWorkspace({ panels, layout }).panels.length, MAX_PANELS);
  assert.throws(() => validateWorkspace({ panels: [...panels, panel('extra')], layout }), /256/);
});
