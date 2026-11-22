import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/core/api/articleList.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { parseArticleList } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const article = { id: 1, title: 'Статья', content: 'Текст', authorAccountId: 2 };

test('normalizes documented read DTO fields and preserves metadata', () => {
  const response = { articleId: 1, authorId: 2, title: 'Статья', content: 'Текст', authorDisplayName: 'Иван', status: 'PUBLISHED', publishedAt: null };
  const [result] = parseArticleList({ content: [response] });
  assert.equal(result.id, 1);
  assert.equal(result.authorAccountId, 2);
  assert.equal(result.authorDisplayName, 'Иван');
  assert.equal(result.status, 'PUBLISHED');
  assert.equal(result.publishedAt, null);
});

test('accepts article arrays, including an empty catalog', () => {
  assert.deepEqual(parseArticleList([article]), [article]);
  assert.deepEqual(parseArticleList([]), []);
});

test('unwraps a paginated API response', () => {
  assert.deepEqual(parseArticleList({ content: [article], totalElements: 1 }), [article]);
  assert.deepEqual(parseArticleList({ content: [] }), []);
});

test('rejects unexpected payloads before they reach the catalog', () => {
  for (const value of [null, undefined, '', {}, { message: 'error' }, { content: {} }, [null], [{ ...article, title: null }], [{ ...article, content: 5 }], [{ ...article, authorAccountId: '2' }]]) {
    assert.throws(() => parseArticleList(value), /неверный формат ответа API/);
  }
});


test('reads current authorInfo DTO, including an unavailable profile', () => {
  const base = { articleId: 7, title: 'Статья', content: 'Текст', status: 'PUBLISHED' };
  const [article] = parseArticleList([{ ...base, authorInfo: { '42': { displayName: 'Автор', avatarObjectKey: 'avatars/42/a.png' } } }]);
  assert.equal(article.authorAccountId, 42);
  assert.equal(article.authorDisplayName, 'Автор');
  assert.equal(article.authorAvatarObjectKey, 'avatars/42/a.png');
  const [missing] = parseArticleList([{ ...base, authorInfo: { '42': null } }]);
  assert.equal(missing.authorAccountId, 42);
  assert.equal(missing.authorDisplayName, null);
  for (const authorInfo of [{}, { nope: null }, { '1': null, '2': null }]) {
    assert.throws(() => parseArticleList([{ ...base, authorInfo }]), /неверный формат/);
  }
});


test('preserves coverObjectKey in current read DTO and entity responses', () => {
  const read = { articleId: 8, title: 'Cover', content: 'Text', authorInfo: { '2': null }, coverObjectKey: 'covers/8/a b.png' };
  const [withCover] = parseArticleList([read]);
  assert.equal(withCover.coverObjectKey, 'covers/8/a b.png');
  assert.equal(parseArticleList([{ ...read, coverObjectKey: null }])[0].coverObjectKey, null);
  assert.equal(parseArticleList([{ ...article, coverObjectKey: 'covers/1/a.png' }])[0].coverObjectKey, 'covers/1/a.png');
  assert.throws(() => parseArticleList([{ ...read, coverObjectKey: 42 }]), /неверный формат/);
});
