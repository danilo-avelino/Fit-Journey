import test from 'node:test';
import assert from 'node:assert/strict';
import { chromiumUserAgent } from '../src/main/browser-identity';

test('removes desktop wrapper identity while keeping the real engine and Windows platform', () => {
  const original = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Mosaico/1.0.0 Chrome/149.0.7827.0 Electron/45.0.0 Safari/537.36';
  const result = chromiumUserAgent(original);
  assert.equal(result, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.0 Safari/537.36');
  assert.equal(chromiumUserAgent(result), result);
});

test('handles development product name and never invents a newer Chrome version', () => {
  const original = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 mosaico-desktop/2.0.0 Chrome/140.0.1.2 Electron/38.0.0 Safari/537.36';
  const result = chromiumUserAgent(original);
  assert.match(result, /Chrome\/140\.0\.1\.2/);
  assert.match(result, /X11; Linux x86_64/);
  assert.doesNotMatch(result, /electron|mosaico/i);
});
