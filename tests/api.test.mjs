import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { loadTs } from './loadTs.mjs';

const { articlesApi } = await loadTs('../src/core/api/articlesApi.ts');
const { request } = await loadTs('../src/core/api/client.ts');
const dto = { articleId: 7, authorId: 2, title: 'Заголовок', content: 'Текст', status: 'PUBLISHED', authorDisplayName: null };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = new EventTarget();
});

test('loads every published page and normalizes the documented read DTO', async () => {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return json({ content: [{ ...dto, articleId: urls.length }], totalPages: 2 });
  };
  const result = await articlesApi.getAll();
  assert.deepEqual(result.map((article) => article.id), [1, 2]);
  assert.equal(result[0].authorAccountId, 2);
  assert.match(urls[0], /page=0&size=100&status=PUBLISHED/);
  assert.match(urls[1], /page=1&size=100/);
});

test('uses dedicated own and moderation lists', async () => {
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(url); return json({ content: [], totalPages: 0 }); };
  assert.deepEqual(await articlesApi.getAll('my'), []);
  assert.deepEqual(await articlesApi.getAll('review'), []);
  assert.match(urls[0], /^\/api\/articles\/my\?/);
  assert.match(urls[1], /^\/api\/editor\/articles\?/);
  assert.ok(urls.every((url) => !url.includes('status=')));
});

test('handles read DTO, entity write response, and empty transition response', async () => {
  globalThis.fetch = async (_url, options) => options.method === 'POST'
    ? json({ id: 8, authorAccountId: 2, title: 'Новая', content: 'Текст', status: 'DRAFT' }, 201)
    : json(dto);
  assert.equal((await articlesApi.getById(7)).id, 7);
  assert.equal((await articlesApi.create({ title: 'Новая', content: 'Текст' })).id, 8);
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await articlesApi.transition(8, 'submit'), undefined);
});

test('shares token refresh for concurrent requests and retries with the new token', async () => {
  localStorage.setItem('editorial_access_token', 'old');
  localStorage.setItem('editorial_refresh_token', 'refresh-old');
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url === '/api/auth/refresh') {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ accessToken: 'new', refreshToken: 'refresh-new' });
    }
    return options.headers.get('Authorization') === 'Bearer new' ? json([dto]) : json({}, 401);
  };
  const results = await Promise.all([request('/api/articles'), request('/api/articles')]);
  assert.equal(refreshes, 1);
  assert.equal(results.length, 2);
  assert.equal(localStorage.getItem('editorial_refresh_token'), 'refresh-new');
});

test('keeps service failures in live mode and preserves usable refresh tokens', async () => {
  localStorage.setItem('editorial_refresh_token', 'keep-me');
  globalThis.fetch = async (url) => url === '/api/auth/refresh' ? json({}, 503) : json({}, 401);
  await assert.rejects(request('/api/articles'), /Сервис временно недоступен/);
  assert.equal(localStorage.getItem('editorial_refresh_token'), 'keep-me');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(request('/api/articles'), /Не удалось связаться с сервером/);
  assert.notEqual(localStorage.getItem('editorial_mock_mode'), 'true');
});

test('expires the session when refresh is rejected and keeps login errors intact', async () => {
  localStorage.setItem('editorial_refresh_token', 'expired');
  let expired = false;
  window.addEventListener('editorial_auth_expired', () => { expired = true; });
  globalThis.fetch = async () => json({ code: 'INVALID_REFRESH_TOKEN' }, 401);
  await assert.rejects(request('/api/articles'));
  assert.equal(localStorage.getItem('editorial_refresh_token'), null);
  assert.ok(expired);
  globalThis.fetch = async () => json({ code: 'ACCOUNT_STILL_PENDING', message: 'Pending' }, 401);
  await assert.rejects(request('/api/auth/login', { method: 'POST' }), (error) => error.code === 'ACCOUNT_STILL_PENDING');
});
