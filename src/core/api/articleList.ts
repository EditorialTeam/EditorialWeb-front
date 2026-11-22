import type { ArticleResponse } from './types';

export function parseArticle(value: unknown): ArticleResponse {
  const article = value as Record<string, unknown> | null;
  const id = article?.articleId ?? article?.id;
  const info = article?.authorInfo;
  const entries = info && typeof info === 'object' && !Array.isArray(info) ? Object.entries(info) : [];
  const authorAccountId = entries.length === 1 ? Number(entries[0][0]) : article?.authorId ?? article?.authorAccountId;
  if (article && 'authorInfo' in article && (entries.length !== 1 || !/^[1-9]\d*$/.test(entries[0][0]))) throw new Error('Не удалось загрузить статью: неверный формат ответа API.');
  const profile = entries.length === 1 ? entries[0][1] as { displayName?: string | null; avatarObjectKey?: string | null } | null : null;
  if (!(article &&
    typeof id === 'number' && Number.isFinite(id) &&
    typeof article.title === 'string' &&
    typeof article.content === 'string' &&
    (article.coverObjectKey == null || typeof article.coverObjectKey === 'string') &&
    typeof authorAccountId === 'number' && Number.isFinite(authorAccountId)
  )) {
    throw new Error('Не удалось загрузить статью: неверный формат ответа API.');
  }
  return { ...article, id, authorAccountId,
    ...(entries.length ? { authorDisplayName: profile?.displayName ?? null, authorAvatarObjectKey: profile?.avatarObjectKey ?? null } : {}),
  } as ArticleResponse;
}

export function parseArticleList(response: unknown): ArticleResponse[] {
  const articles = Array.isArray(response)
    ? response
    : typeof response === 'object' && response !== null && 'content' in response
      ? response.content
      : undefined;

  if (!Array.isArray(articles)) {
    throw new Error('Не удалось загрузить статьи: неверный формат ответа API.');
  }

  return articles.map(parseArticle);
}

export function parseArticlePage(response: unknown) {
  const content = parseArticleList(response);
  if (Array.isArray(response)) return { content, totalPages: 1 };
  const totalPages = (response as Record<string, unknown>).totalPages;
  if (typeof totalPages !== 'number' || !Number.isInteger(totalPages) || totalPages < 0) {
    throw new Error('Не удалось загрузить статьи: неверные данные пагинации API.');
  }
  return { content, totalPages };
}
