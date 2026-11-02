import { request } from './client';
import {
  ArticleResponse,
  CreateArticleRequest,
  PatchArticleRequest,
  UpdateArticleRequest,
} from './types';

export const articlesApi = {
  getAll(): Promise<ArticleResponse[]> {
    return request<ArticleResponse[]>('/api/articles', {
      method: 'GET',
    });
  },

  getById(id: number): Promise<ArticleResponse> {
    return request<ArticleResponse>(`/api/articles/${id}`, {
      method: 'GET',
    });
  },

  create(data: CreateArticleRequest): Promise<ArticleResponse> {
    return request<ArticleResponse>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: UpdateArticleRequest): Promise<ArticleResponse> {
    return request<ArticleResponse>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  patch(id: number, data: PatchArticleRequest): Promise<ArticleResponse> {
    return request<ArticleResponse>(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return request<void>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },
};
