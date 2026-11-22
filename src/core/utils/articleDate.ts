import type { ArticleResponse } from '../api/types';

export function articleTimestamp(article: ArticleResponse): number | null {
  for (const value of [article.publishedAt, article.createdAt]) {
    if (!value) continue;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

export function articleDateLabel(article: ArticleResponse): string | null {
  const timestamp = articleTimestamp(article);
  if (timestamp === null) return null;
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
