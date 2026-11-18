import { collectPages } from './pagination';
import { request } from './client';
import {
  CommentResponse,
  CreateCommentRequest,
  PageResponse,
  PatchCommentRequest,
} from './types';

export const commentsApi = {
  getAllRoots(articleId: number): Promise<CommentResponse[]> {
    return collectPages((page) => commentsApi.getRootComments(articleId, page, 100));
  },
  getAllReplies(articleId: number, parentId: number): Promise<CommentResponse[]> {
    return collectPages((page) => commentsApi.getReplies(articleId, parentId, page, 100));
  },
  getRootComments(
    articleId: number,
    page = 0,
    size = 20
  ): Promise<PageResponse<CommentResponse>> {
    return request<PageResponse<CommentResponse>>(
      `/api/articles/${articleId}/comments?page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  getReplies(
    articleId: number,
    rootCommentId: number,
    page = 0,
    size = 20
  ): Promise<PageResponse<CommentResponse>> {
    return request<PageResponse<CommentResponse>>(
      `/api/articles/${articleId}/comments/${rootCommentId}/replies?page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  create(
    articleId: number,
    data: CreateCommentRequest
  ): Promise<CommentResponse> {
    return request<CommentResponse>(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  edit(
    articleId: number,
    commentId: number,
    data: PatchCommentRequest
  ): Promise<PatchCommentRequest> {
    return request<PatchCommentRequest>(
      `/api/articles/${articleId}/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  },

  delete(articleId: number, commentId: number): Promise<void> {
    return request<void>(`/api/articles/${articleId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
