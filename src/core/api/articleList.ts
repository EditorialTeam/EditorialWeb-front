import type { ArticleResponse } from './types';

export function parseArticle(value: unknown): ArticleResponse {
  const article = value as Record<string, unknown> | null;
  const id = article?.articleId ?? article?.id;
  const authorAccountId = article?.authorId ?? article?.authorAccountId;
  if (!(article &&
    typeof id === 'number' && Number.isFinite(id) &&
    typeof article.title === 'string' &&
    typeof article.content === 'string' &&
    typeof authorAccountId === 'number' && Number.isFinite(authorAccountId)
  )) {
    throw new Error('Не удалось загрузить статью: неверный формат ответа API.');
  }
  return { ...article, id, authorAccountId } as ArticleResponse;
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
