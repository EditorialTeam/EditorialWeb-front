import { request } from './client';
import {
  ArticleResponse,
  ArticleStatus,
  CreateArticleRequest,
  PatchArticleRequest,
  UpdateArticleRequest,
} from './types';

/**
 * Normalizes article fields between Spring Boot backend DTOs:
 * - GetArticlesResponse (articleId, authorId, authorDisplayName)
 * - Article JPA Entity (id, authorAccountId)
 */
function normalizeArticle(item: any): ArticleResponse {
  if (!item) return item;
  return {
    ...item,
    id: item.id ?? item.articleId,
    articleId: item.articleId ?? item.id,
    authorAccountId: item.authorAccountId ?? item.authorId,
    authorId: item.authorId ?? item.authorAccountId,
    authorDisplayName: item.authorDisplayName ?? null,
  };
}

export const articlesApi = {
  async getAll(params?: {
    status?: ArticleStatus;
    authorAccountId?: number;
    page?: number;
    size?: number;
  }): Promise<ArticleResponse[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.authorAccountId) query.append('authorAccountId', String(params.authorAccountId));
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));
    const qs = query.toString() ? `?${query.toString()}` : '';

    const raw = await request<any>(`/api/articles${qs}`, {
      method: 'GET',
    });

    // Handle both Spring Data Page { content: [...] } and direct Array [...]
    const list: any[] = Array.isArray(raw)
      ? raw
      : (raw && Array.isArray(raw.content) ? raw.content : []);

    return list.map(normalizeArticle);
  },

  async getMy(params?: { page?: number; size?: number }): Promise<ArticleResponse[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));
    const qs = query.toString() ? `?${query.toString()}` : '';

    const raw = await request<any>(`/api/articles/my${qs}`, {
      method: 'GET',
    });

    const list: any[] = Array.isArray(raw)
      ? raw
      : (raw && Array.isArray(raw.content) ? raw.content : []);

    return list.map(normalizeArticle);
  },

  async getById(id: number): Promise<ArticleResponse> {
    const raw = await request<any>(`/api/articles/${id}`, {
      method: 'GET',
    });
    return normalizeArticle(raw);
  },

  async create(data: CreateArticleRequest): Promise<ArticleResponse> {
    const raw = await request<any>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeArticle(raw);
  },

  async update(id: number, data: UpdateArticleRequest): Promise<ArticleResponse> {
    const raw = await request<any>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeArticle(raw);
  },

  async patch(id: number, data: PatchArticleRequest): Promise<ArticleResponse> {
    const raw = await request<any>(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeArticle(raw);
  },

  delete(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },

  submitForReview(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}/submit`, {
      method: 'POST',
    });
  },

  withdrawFromReview(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}/withdraw-from-review`, {
      method: 'POST',
    });
  },

  archive(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}/archive`, {
      method: 'POST',
    });
  },
};
