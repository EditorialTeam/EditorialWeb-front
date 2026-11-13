import { request } from './client';
import { parseArticle, parseArticlePage } from './articleList';
import {
  ArticleResponse,
  ArticleScope,
  CreateArticleRequest,
  PatchArticleRequest,
  UpdateArticleRequest,
} from './types';

export const articlesApi = {
  async getAll(scope: ArticleScope = 'published'): Promise<ArticleResponse[]> {
    const endpoint = scope === 'my' ? '/api/articles/my'
      : scope === 'review' ? '/api/editor/articles' : '/api/articles';
    const articles: ArticleResponse[] = [];
    let page = 0;
    let totalPages = 1;
    // Load every server page so existing search, author filters and sorting
    // continue to work across the full catalog rather than its first 20 items.
    do {
      const params = new URLSearchParams({ page: String(page), size: '100' });
      if (scope === 'published') params.set('status', 'PUBLISHED');
      const result = parseArticlePage(await request<unknown>(`${endpoint}?${params}`));
      articles.push(...result.content);
      totalPages = result.totalPages;
      page += 1;
    } while (page < totalPages);
    return articles;
  },

  async getById(id: number): Promise<ArticleResponse> {
    try {
      return parseArticle(await request<unknown>(`/api/articles/${id}`));
    } catch (error) {
      // The backend allows /my to return an editor's own draft even when
      // the separate GET-by-ID visibility rule denies it.
      if ((error as { status?: number }).status === 403) {
        const ownArticle = (await articlesApi.getAll('my')).find((article) => article.id === id);
        if (ownArticle) return ownArticle;
      }
      throw error;
    }
  },

  async create(data: CreateArticleRequest): Promise<ArticleResponse> {
    return parseArticle(await request<unknown>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }));
  },

  async update(id: number, data: UpdateArticleRequest): Promise<ArticleResponse> {
    return parseArticle(await request<unknown>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }));
  },

  async patch(id: number, data: PatchArticleRequest): Promise<ArticleResponse> {
    return parseArticle(await request<unknown>(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }));
  },

  delete(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },

  transition(id: number, action: 'submit' | 'archive' | 'withdraw-from-review'): Promise<void> {
    return request<void>(`/api/articles/${id}/${action}`, { method: 'POST' });
  },

  moderate(id: number, decision: 'APPROVED' | 'REJECTED', rejectionReason?: string): Promise<void> {
    return request<void>(`/api/editor/articles/${id}/moderate?decision=${decision}`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },
};
