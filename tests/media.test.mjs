import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { loadTs } from './loadTs.mjs';
const { filesApi, fileUrl, imageBody } = await loadTs('../src/core/api/filesApi.ts');
const { profileStorage } = await loadTs('../src/core/profile/profileStorage.ts');
const { commentsApi } = await loadTs('../src/core/api/commentsApi.ts');
const image = () => new File(['image'], 'a.png', { type: 'image/png' });
const json = data => new Response(JSON.stringify(data), { status: 200 });
beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
  globalThis.window = new EventTarget();
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 9, role: 'USER' }));
  localStorage.setItem('editorial_access_token', 'access');
});
test('uploads avatar, cover, and article image as authenticated multipart without JSON headers', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return json({ objectKey: 'path/image.png' }); };
  await filesApi.uploadAvatar(image());
  await filesApi.upload(7, image(), 'COVER');
  await filesApi.upload(7, image(), 'ARTICLE_IMAGE');
  await filesApi.replace(7, 10, image());
  assert.deepEqual(calls.map(call => [call.url, call.method]), [
    ['/api/users/me/avatar', 'POST'], ['/api/articles/file/7?category=COVER', 'POST'],
    ['/api/articles/file/7?category=ARTICLE_IMAGE', 'POST'], ['/api/articles/file/7/10', 'PUT'],
  ]);
  assert.ok(calls.every(call => call.body instanceof FormData && call.body.get('file').name === 'a.png'));
  assert.ok(calls.every(call => call.headers.get('Authorization') === 'Bearer access' && !call.headers.has('Content-Type')));
});
test('reads image list, encodes public keys, and accepts empty HTTP 200 deletion', async () => {
  globalThis.fetch = async (url, options) => options.method === 'DELETE' ? new Response(null, { status: 200 }) : json([{ id: 10, objectKey: 'a b&x.png' }]);
  assert.equal((await filesApi.list(7))[0].id, 10);
  assert.equal(fileUrl('a b&x.png'), '/api/files?key=a%20b%26x.png');
  assert.equal(await filesApi.delete(7, 10), undefined);
});
test('rejects invalid image selections and missing server object key', async () => {
  assert.throws(() => imageBody(new File([], 'empty.png', { type: 'image/png' })));
  assert.throws(() => imageBody(new File(['x'], 'bad.svg', { type: 'image/svg+xml' })));
  assert.throws(() => imageBody(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })));
  globalThis.fetch = async () => json({ objectKey: null });
  await assert.rejects(filesApi.uploadAvatar(image()), /не вернул ключ/);
});
test('retries multipart upload after refreshing an expired access token', async () => {
  localStorage.setItem('editorial_refresh_token', 'refresh');
  let uploads = 0;
  globalThis.fetch = async (url, options) => {
    if (url === '/api/auth/refresh') return json({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    uploads++;
    assert.equal(options.body.get('file').name, 'a.png');
    if (uploads === 1) return new Response(null, { status: 401 });
    assert.equal(options.headers.get('Authorization'), 'Bearer new-access');
    return json({ objectKey: 'avatar.png' });
  };
  assert.equal((await filesApi.uploadAvatar(image())).objectKey, 'avatar.png');
  assert.equal(uploads, 2);
});
test('bookmarks start empty and remain isolated by account despite obsolete demo flags', () => {
  localStorage.setItem('editorial_user_bookmarks', '[{"articleId":1}]');
  assert.deepEqual(profileStorage.getBookmarks(), []);
  profileStorage.toggleBookmark(7, 'Actual title');
  assert.equal(profileStorage.getBookmarks()[0].title, 'Actual title');
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 10 }));
  assert.deepEqual(profileStorage.getBookmarks(), []);
  localStorage.setItem('editorial_user', JSON.stringify({ accountId: 9 }));
  localStorage.setItem('editorial_mock_mode', 'true');
  assert.equal(profileStorage.getBookmarks()[0].articleId, 7);
  localStorage.setItem('editorial_mock_mode', 'false');
  assert.equal(profileStorage.getBookmarks()[0].articleId, 7);
});
test('reads every root and reply page and accepts partial comment PATCH response', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(url);
    if (options.method === 'PATCH') return json({ content: 'edited' });
    const page = Number(new URL(url, 'http://localhost').searchParams.get('page'));
    return json({ content: [{ id: page + 1 }], totalPages: 2 });
  };
  assert.deepEqual((await commentsApi.getAllRoots(7)).map(item => item.id), [1,2]);
  assert.deepEqual((await commentsApi.getAllReplies(7, 10)).map(item => item.id), [1,2]);
  assert.match(calls[3], /comments\/10\/replies\?page=1/);
  assert.deepEqual(await commentsApi.edit(7, 10, { content: 'edited' }), { content: 'edited' });
});
