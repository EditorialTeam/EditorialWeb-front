import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './loadTs.mjs';
const { articlePermissions } = await loadTs('../src/core/api/articlePermissions.ts');
const article = { id: 1, authorAccountId: 7, title: 'Статья', content: 'Текст' };
const user = (role, accountId = 7) => ({ role, accountId });

test('authors can edit own drafts but cannot edit published articles or delete review submissions', () => {
  assert.equal(articlePermissions({ ...article, status: 'DRAFT' }, user('AUTHOR')).edit, true);
  assert.equal(articlePermissions({ ...article, status: 'PUBLISHED' }, user('AUTHOR')).edit, false);
  assert.equal(articlePermissions({ ...article, status: 'PENDING_REVIEW' }, user('AUTHOR')).delete, false);
  assert.equal(articlePermissions({ ...article, status: 'DRAFT' }, user('AUTHOR', 8)).edit, false);
});

test('moderators can review pending articles but only owners can submit', () => {
  const review = articlePermissions({ ...article, status: 'PENDING_REVIEW' }, user('EDITOR', 8));
  assert.equal(review.moderate, true);
  assert.equal(review.edit, true);
  assert.equal(review.withdraw, true);
  assert.equal(articlePermissions({ ...article, status: 'DRAFT' }, user('ADMIN', 8)).submit, false);
});

test('readers and guests cannot mutate articles, including their own', () => {
  for (const reader of [null, user('USER')]) {
    for (const status of ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']) {
      assert.ok(Object.values(articlePermissions({ ...article, status }, reader)).every((allowed) => !allowed));
    }
  }
});
