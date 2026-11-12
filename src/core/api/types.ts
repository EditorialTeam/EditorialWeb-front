export type AccountRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

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
