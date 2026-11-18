import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { loadTs } from './loadTs.mjs';
const { profileStorage } = await loadTs('../src/core/profile/profileStorage.ts');
const { commentsApi } = await loadTs('../src/core/api/commentsApi.ts');
const { reactionsApi } = await loadTs('../src/core/api/reactionsApi.ts');

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
  globalThis.window = new EventTarget();
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 9, role: 'USER', username: 'reader', email: 'reader@example.com' }));
  localStorage.setItem('editorial_access_token', 'reader-token');
});
const json = data => new Response(JSON.stringify(data), { status: 200 });

test('ignores legacy sample data and isolates real preferences by account and mode', () => {
  localStorage.setItem('editorial_user_likes', '[1,2,3]');
  localStorage.setItem('editorial_user_bookmarks', '[{"articleId":1}]');
  assert.deepEqual(profileStorage.getLikes(), []);
  assert.deepEqual(profileStorage.getBookmarks(), []);
  assert.deepEqual(profileStorage.getTrackedAuthors(), []);
  assert.equal(profileStorage.getProfile().bio, '');
  profileStorage.toggleBookmark(42);
  profileStorage.setReaction(42, 'LIKE');
  assert.deepEqual(profileStorage.getLikes(), [42]);
  localStorage.setItem('editorial_mock_mode', 'true');
  assert.deepEqual(profileStorage.getBookmarks(), []);
  localStorage.setItem('editorial_mock_mode', 'false');
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 10 }));
  assert.deepEqual(profileStorage.getLikes(), []);
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 9 }));
  assert.equal(profileStorage.getBookmarks()[0].articleId, 42);
  profileStorage.setReaction(42, 'FIRE');
  assert.deepEqual(profileStorage.getLikes(), []);
});

test('USER sends comment and reaction writes with its JWT', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return options.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ content: 'text', reactionType: 'LIKE' });
  };
  await commentsApi.create(1, { content: 'text', parentId: null });
  await commentsApi.edit(1, 4, { content: 'text' });
  await commentsApi.delete(1, 4);
  await reactionsApi.putReaction(1, 'LIKE');
  await reactionsApi.deleteReaction(1);
  assert.deepEqual(calls.map(call => call.method), ['POST', 'PATCH', 'DELETE', 'PUT', 'DELETE']);
  assert.ok(calls.every(call => call.headers.get('Authorization') === 'Bearer reader-token'));
});

test('loads all comment pages and all immediate reply pages', async () => {
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    const page = Number(new URL(url, 'http://localhost').searchParams.get('page'));
    return json({ content: [{ id: page + 1 }], totalPages: 3 });
  };
  assert.deepEqual((await commentsApi.getAllRoots(1)).map(item => item.id), [1,2,3]);
  assert.deepEqual((await commentsApi.getAllReplies(1, 8)).map(item => item.id), [1,2,3]);
  assert.ok(urls[5].includes('/comments/8/replies?page=2'));
});
