import { request } from './client';
import {
  CreateReactionRequest,
  CreateReactionResponse,
  GetReactionsResponse,
  ReactionType,
} from './types';

export const reactionsApi = {
  getReactions(articleId: number): Promise<GetReactionsResponse> {
    return request<GetReactionsResponse>(
      `/api/articles/${articleId}/reactions`,
      { method: 'GET' }
    );
  },

  putReaction(
    articleId: number,
    reactionType: ReactionType
  ): Promise<CreateReactionResponse> {
    const data: CreateReactionRequest = { reactionType };
    return request<CreateReactionResponse>(
      `/api/articles/${articleId}/reactions`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  deleteReaction(articleId: number): Promise<void> {
    return request<void>(`/api/articles/${articleId}/reactions`, {
      method: 'DELETE',
    });
  },
};
