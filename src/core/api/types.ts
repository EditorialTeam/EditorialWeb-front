export type AccountRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type ArticleScope = 'published' | 'my' | 'review';

export interface RegisterAccountRequest {
  username: string;
  email: string;
  password: string;
}

export interface AccountRegisterResponse {
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  refreshToken: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ArticleResponse {
  id: number;
  articleId?: number; // Backend GetArticlesResponse uses articleId
  title: string;
  content: string;
  authorAccountId: number;
  authorId?: number; // Backend GetArticlesResponse uses authorId
  authorDisplayName?: string | null;
  status?: ArticleStatus;
  createdAt?: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  rejectionReason?: string | null;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
}

export interface UpdateArticleRequest {
  title: string;
  content: string;
}

export interface PatchArticleRequest {
  title?: string;
  content?: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string> | null;
}

export interface AuthUser {
  accountId: number;
  username: string;
  email: string;
  role: AccountRole;
}

export interface UserProfile {
  accountId: number;
  username: string;
  displayName: string | null;
  createdAt: string;
  profileDescription: string | null;
}

export interface PatchProfileRequest {
  displayName?: string | null;
  profileDescription?: string | null;
}

export interface PatchProfileResponse {
  displayName: string | null;
  profileDescription: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

// Comments
export interface CommentResponse {
  id: number;
  articleId: number;
  parentId: number | null;
  authorAccountId: number;
  authorDisplayName: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  deleted: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}

export interface PatchCommentRequest {
  content: string;
}

// Reactions
export type ReactionType =
  | 'LIKE'
  | 'DISLIKE'
  | 'MELTING'
  | 'MINDBLOWN'
  | 'CRYING'
  | 'THINKING'
  | 'HOT'
  | 'FIRE'
  | 'FROZEN';

export interface GetReactionsResponse {
  reactions: Record<string, number>;
}

export interface CreateReactionRequest {
  reactionType: ReactionType;
}

export interface CreateReactionResponse {
  reactionType: ReactionType;
}

// Admin APIs
export interface AdminAccountResponse {
  accountId: number;
  email: string;
  username: string;
  createdAt: string;
  role: AccountRole;
}

export interface PatchAccountRequest {
  email?: string;
  username?: string;
  role?: AccountRole;
}

export interface AdminUserProfileResponse {
  accountId: number;
  username: string;
  displayName: string | null;
  createdAt: string;
  profileDescription: string | null;
}

export interface PatchAdminUserRequest {
  displayName?: string | null;
  profileDescription?: string | null;
}
