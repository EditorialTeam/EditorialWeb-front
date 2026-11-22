import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { loadTs } from './loadTs.mjs';
const { request } = await loadTs('../src/core/api/client.ts');
const { tokenStorage } = await loadTs('../src/core/auth/tokenStorage.ts');

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
  globalThis.window = new EventTarget();
});

test('obsolete demo flag cannot divert API requests from the real backend', async () => {
  localStorage.setItem('editorial_mock_mode', 'true');
  let called = false;
  globalThis.fetch = async url => {
    called = true;
    assert.equal(url, '/api/articles?status=PUBLISHED');
    return new Response(JSON.stringify({ content: [], totalPages: 0 }), { status: 200 });
  };
  const result = await request('/api/articles?status=PUBLISHED');
  assert.equal(called, true);
  assert.deepEqual(result.content, []);
});

test('discards old demo session instead of trusting its fabricated role', () => {
  localStorage.setItem('editorial_mock_mode', 'true');
  localStorage.setItem('editorial_access_token', 'demo-token');
  localStorage.setItem('editorial_refresh_token', 'demo-refresh');
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 99, role: 'ADMIN' }));
  tokenStorage.clearLegacyDemoSession();
  assert.equal(tokenStorage.getAccessToken(), null);
  assert.equal(tokenStorage.getRefreshToken(), null);
  assert.equal(tokenStorage.getUser(), null);
  assert.equal(localStorage.getItem('editorial_mock_mode'), null);
});

test('preserves real login tokens while removing an inactive legacy flag', () => {
  localStorage.setItem('editorial_mock_mode', 'false');
  tokenStorage.setAccessToken('real-access');
  tokenStorage.setRefreshToken('real-refresh');
  tokenStorage.setUser({ accountId: 7, role: 'USER' });
  tokenStorage.clearLegacyDemoSession();
  assert.equal(tokenStorage.getAccessToken(), 'real-access');
  assert.equal(tokenStorage.getRefreshToken(), 'real-refresh');
  assert.equal(tokenStorage.getUser().accountId, 7);
  assert.equal(localStorage.getItem('editorial_mock_mode'), null);
});
