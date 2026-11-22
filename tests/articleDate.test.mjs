import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './loadTs.mjs';
const { articleTimestamp, articleDateLabel } = await loadTs('../src/core/utils/articleDate.ts');

test('uses publication date before draft creation date in the feed', () => {
  const article = { id: 1, publishedAt: '2026-11-22T12:00:00Z', createdAt: '2026-01-01T12:00:00Z' };
  assert.equal(articleTimestamp(article), Date.parse(article.publishedAt));
  assert.match(articleDateLabel(article), /22 ноября 2026/);
});

test('uses valid creation date for drafts and never invents missing dates', () => {
  assert.equal(articleTimestamp({ createdAt: '2026-11-20T12:00:00Z', publishedAt: null }), Date.parse('2026-11-20T12:00:00Z'));
  assert.equal(articleTimestamp({ publishedAt: 'invalid', createdAt: '2026-11-20T12:00:00Z' }), Date.parse('2026-11-20T12:00:00Z'));
  assert.equal(articleTimestamp({}), null);
  assert.equal(articleDateLabel({ publishedAt: 'invalid' }), null);
});
