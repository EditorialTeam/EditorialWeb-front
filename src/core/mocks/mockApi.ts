import {
  AccountRegisterResponse,
  AdminAccountResponse,
  AdminUserProfileResponse,
  AuthUser,
  ArticleStatus,
  ArticleResponse,
  CommentResponse,
  CreateArticleRequest,
  CreateCommentRequest,
  CreateReactionResponse,
  GetReactionsResponse,
  LoginRequest,
  LoginResponse,
  PageResponse,
  PatchAccountRequest,
  PatchAdminUserRequest,
  PatchArticleRequest,
  PatchCommentRequest,
  PatchProfileRequest,
  PatchProfileResponse,
  ReactionType,
  RefreshRequest,
  RefreshResponse,
  RegisterAccountRequest,
  UpdateArticleRequest,
  UserProfile,
} from '../api/types';
import { INITIAL_MOCK_ARTICLES } from './mockData';
import { parseArticleList } from '../api/articleList';
import { articlePermissions } from '../api/articlePermissions';

const MOCK_ARTICLES_STORAGE_KEY = 'editorial_mock_articles_db';
const MOCK_USERS_STORAGE_KEY = 'editorial_mock_users_db';
const MOCK_COMMENTS_STORAGE_KEY = 'editorial_mock_comments_db';
const MOCK_REACTIONS_STORAGE_KEY = 'editorial_mock_reactions_db';

interface MockUserEntry {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  createdAt: string;
  displayName?: string | null;
  profileDescription?: string | null;
  status?: 'PENDING' | 'ACTIVE';
  pendingUntil?: number;
}

interface MockReaction {
  articleId: number;
  userId: number;
  reactionType: ReactionType;
}

const DEFAULT_COMMENTS: CommentResponse[] = [
  {
    id: 1,
    articleId: 1,
    parentId: null,
    authorAccountId: 2,
    authorDisplayName: 'Елена Смирнова',
    content: 'Отличная структурированная статья. Особенно важен акцент на разделении контекстов и JWKS.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: null,
    deleted: false,
  },
  {
    id: 2,
    articleId: 1,
    parentId: 1,
    authorAccountId: 1,
    authorDisplayName: 'Александр Романов',
    content: 'Спасибо! В следующей части детально разберем репликацию PostgreSQL и транзакционный Outbox.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: null,
    deleted: false,
  },
];

const DEFAULT_REACTIONS: MockReaction[] = [
  { articleId: 1, userId: 2, reactionType: 'LIKE' },
  { articleId: 1, userId: 3, reactionType: 'FIRE' },
  { articleId: 2, userId: 1, reactionType: 'THINKING' },
];

function getStoredComments(): CommentResponse[] {
  const raw = localStorage.getItem(MOCK_COMMENTS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_COMMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_COMMENTS));
    return [...DEFAULT_COMMENTS];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_COMMENTS];
  }
}

function saveStoredComments(comments: CommentResponse[]): void {
  localStorage.setItem(MOCK_COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}

function getStoredReactions(): MockReaction[] {
  const raw = localStorage.getItem(MOCK_REACTIONS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_REACTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_REACTIONS));
    return [...DEFAULT_REACTIONS];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_REACTIONS];
  }
}

function saveStoredReactions(reactions: MockReaction[]): void {
  localStorage.setItem(MOCK_REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
}

const DEFAULT_USERS: MockUserEntry[] = [
  {
    id: 1,
    username: 'alex',
    email: 'alex@example.com',
    password: 'password123',
    role: 'ADMIN',
    createdAt: new Date('2026-10-15T10:00:00Z').toISOString(),
    displayName: 'Александр Романов',
    profileDescription:
      'Главный редактор и архитектор EditorialWeb. Пишу о распределенных системах и UX редакторских платформ.',
  },
  {
    id: 2,
    username: 'elena',
    email: 'elena@example.com',
    password: 'password123',
    role: 'EDITOR',
    createdAt: new Date('2026-10-20T12:00:00Z').toISOString(),
    displayName: 'Елена Смирнова',
    profileDescription: 'Старший редактор раздела технологий. Модерирую входящие материалы и рецензии.',
  },
  {
    id: 3,
    username: 'maxim',
    email: 'maxim@example.com',
    password: 'password123',
    role: 'AUTHOR',
    createdAt: new Date('2026-11-01T09:30:00Z').toISOString(),
    displayName: 'Максим Кузнецов',
    profileDescription: 'Автор аналитических статей по backend-разработке, Kafka и PostgreSQL.',
  },
];

function getStoredArticles(): ArticleResponse[] {
  const raw = localStorage.getItem(MOCK_ARTICLES_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_ARTICLES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ARTICLES));
    return INITIAL_MOCK_ARTICLES.map((article) => ({ ...article, status: 'PUBLISHED' }));
  }
  try {
    return parseArticleList(JSON.parse(raw)).map((article) => ({ ...article, status: article.status || 'PUBLISHED' }));
  } catch {
    throw new Error('Не удалось прочитать демо-статьи из хранилища браузера.');
  }
}

function saveStoredArticles(articles: ArticleResponse[]): void {
  localStorage.setItem(MOCK_ARTICLES_STORAGE_KEY, JSON.stringify(articles));
}

function getStoredUsers(): MockUserEntry[] {
  const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
  try {
    const parsed = JSON.parse(raw) as MockUserEntry[];
    // Ensure default users have display names
    return parsed.map((u) => {
      const def = DEFAULT_USERS.find((d) => d.id === u.id);
      return {
        ...u,
        displayName: u.displayName ?? def?.displayName ?? null,
        profileDescription: u.profileDescription ?? def?.profileDescription ?? null,
      };
    });
  } catch {
    return [...DEFAULT_USERS];
  }
}

function saveStoredUsers(users: MockUserEntry[]): void {
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
}

function createFakeJwt(user: MockUserEntry): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: String(user.id),
      role: user.role,
      username: user.username,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 1800,
      iss: 'editorial-auth-service',
      aud: 'editorial-api',
    })
  );
  return `${header}.${payload}.fake_signature`;
}

export const mockApi = {
  async register(req: RegisterAccountRequest): Promise<AccountRegisterResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const users = getStoredUsers();
    const cleanEmail = req.email.toLowerCase().trim();

    if (users.some((u) => u.email === cleanEmail || u.username === req.username.trim())) {
      const err = new Error('User already exists');
      (err as any).status = 409;
      (err as any).code = 'CONFLICT';
      throw err;
    }

    const newUser: MockUserEntry = {
      id: Date.now(),
      username: req.username.trim(),
      email: cleanEmail,
      password: req.password,
      role: 'USER',
      createdAt: new Date().toISOString(),
      displayName: null,
      profileDescription: null,
      status: 'PENDING',
      pendingUntil: Date.now() + 2500,
    };

    users.push(newUser);
    saveStoredUsers(users);

    return {
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  },

  async login(req: LoginRequest): Promise<LoginResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const users = getStoredUsers();
    const cleanEmail = req.email.toLowerCase().trim();
    const user = users.find((u) => u.email === cleanEmail && u.password === req.password);

    if (!user) {
      const err = new Error('Invalid email or password');
      (err as any).status = 400;
      (err as any).code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.status === 'PENDING') {
      if (user.pendingUntil && Date.now() < user.pendingUntil) {
        const err = new Error("Couldn't log you in because user profile hasn't been created yet");
        (err as any).status = 401;
        (err as any).code = 'ACCOUNT_STILL_PENDING';
        throw err;
      }
      user.status = 'ACTIVE';
      saveStoredUsers(users);
    }

    return {
      accessToken: createFakeJwt(user),
      refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  },

  async refresh(req: RefreshRequest): Promise<RefreshResponse> {
    await new Promise((r) => setTimeout(r, 150));
    if (!req.refreshToken || !req.refreshToken.startsWith('mock-refresh-')) {
      const err = new Error('Invalid refresh token');
      (err as any).status = 401;
      (err as any).code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    const parts = req.refreshToken.split('-');
    const userId = parseInt(parts[2], 10);
    const users = getStoredUsers();
    const user = users.find((u) => u.id === userId) || users[0];

    return {
      accessToken: createFakeJwt(user),
      refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    };
  },

  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
  },

  async getMe(userId: number): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredUsers();
    const user = users.find((u) => u.id === userId) || users[0];
    return {
      accountId: user.id,
      username: user.username,
      displayName: user.displayName || null,
      createdAt: user.createdAt,
      profileDescription: user.profileDescription || null,
    };
  },

  async updateMe(userId: number, req: PatchProfileRequest): Promise<PatchProfileResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      const err = new Error('User not found');
      (err as any).status = 404;
      (err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    if (req.displayName !== undefined) {
      users[idx].displayName = req.displayName;
    }
    if (req.profileDescription !== undefined) {
      users[idx].profileDescription = req.profileDescription;
    }

    saveStoredUsers(users);

    return {
      displayName: users[idx].displayName || null,
      profileDescription: users[idx].profileDescription || null,
    };
  },

  async getUserProfile(accountId: number): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredUsers();
    const user = users.find((u) => u.id === accountId);
    if (!user) {
      // Return fallback user profile for unknown IDs
      return {
        accountId,
        username: `user_${accountId}`,
        displayName: 'Автор',
        createdAt: new Date().toISOString(),
        profileDescription: 'Автор публикаций в EditorialWeb.',
      };
    }
    return {
      accountId: user.id,
      username: user.username,
      displayName: user.displayName || null,
      createdAt: user.createdAt,
      profileDescription: user.profileDescription || null,
    };
  },

  async getArticles(): Promise<ArticleResponse[]> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const users = getStoredUsers();

    // Enrich with author display names
    return articles.map((a) => {
      const author = users.find((u) => u.id === a.authorAccountId);
      return {
        ...a,
        authorDisplayName: author ? author.displayName || author.username : 'Автор',
      };
    });
  },

  async getArticleById(id: number): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const articles = getStoredArticles();
    const article = articles.find((a) => a.id === id);
    if (!article) {
      const err = new Error('Article not found');
      (err as any).status = 404;
      (err as any).code = 'ARTICLE_NOT_FOUND';
      throw err;
    }

    const users = getStoredUsers();
    const author = users.find((u) => u.id === article.authorAccountId);

    return {
      ...article,
      authorDisplayName: author ? author.displayName || author.username : 'Автор',
    };
  },

  async createArticle(req: CreateArticleRequest, authorId: number): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const users = getStoredUsers();
    const author = users.find((u) => u.id === authorId);

    const newArticle: ArticleResponse = {
      id: articles.length > 0 ? Math.max(...articles.map((a) => a.id)) + 1 : 1,
      title: req.title,
      content: req.content,
      authorAccountId: authorId,
      authorDisplayName: author ? author.displayName || author.username : 'Автор',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    articles.unshift(newArticle);
    saveStoredArticles(articles);
    return newArticle;
  },

  async updateArticle(id: number, req: UpdateArticleRequest): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      const err = new Error('Article not found');
      (err as any).status = 404;
      (err as any).code = 'ARTICLE_NOT_FOUND';
      throw err;
    }
    articles[idx] = {
      ...articles[idx],
      title: req.title,
      content: req.content,
    };
    saveStoredArticles(articles);
    return articles[idx];
  },

  async patchArticle(id: number, req: PatchArticleRequest): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      const err = new Error('Article not found');
      (err as any).status = 404;
      (err as any).code = 'ARTICLE_NOT_FOUND';
      throw err;
    }
    articles[idx] = {
      ...articles[idx],
      title: req.title !== undefined ? req.title : articles[idx].title,
      content: req.content !== undefined ? req.content : articles[idx].content,
    };
    saveStoredArticles(articles);
    return articles[idx];
  },

  async changeStatus(id: number, action: string, user: AuthUser | null, decision: string | null): Promise<void> {
    const articles = getStoredArticles();
    const article = articles.find((item) => item.id === id);
    if (!article) throw new Error('Статья не найдена');
    const permissions = articlePermissions(article, user);
    const allowed = action === 'moderate' ? permissions.moderate
      : action === 'withdraw-from-review' ? permissions.withdraw
      : action === 'submit' ? permissions.submit : permissions.archive;
    if (!allowed) throw new Error('Действие недоступно для текущей роли или статуса статьи');
    const statuses: Record<string, ArticleStatus> = {
      submit: 'PENDING_REVIEW', archive: 'ARCHIVED', 'withdraw-from-review': 'DRAFT',
      moderate: decision === 'APPROVED' ? 'PUBLISHED' : 'REJECTED',
    };
    article.status = statuses[action];
    if (article.status === 'PUBLISHED') article.publishedAt = new Date().toISOString();
    saveStoredArticles(articles);
  },

  async deleteArticle(id: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const filtered = articles.filter((a) => a.id !== id);
    saveStoredArticles(filtered);
  },

  // Comments mock methods
  async getRootComments(articleId: number, page = 0, size = 20): Promise<PageResponse<CommentResponse>> {
    await new Promise((r) => setTimeout(r, 150));
    const all = getStoredComments().filter((c) => c.articleId === articleId && c.parentId === null);
    const sorted = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const start = page * size;
    const paged = sorted.slice(start, start + size);
    return {
      content: paged,
      totalPages: Math.ceil(sorted.length / size) || 1,
      totalElements: sorted.length,
      number: page,
      size,
    };
  },

  async getReplies(articleId: number, rootCommentId: number, page = 0, size = 20): Promise<PageResponse<CommentResponse>> {
    await new Promise((r) => setTimeout(r, 150));
    const all = getStoredComments().filter((c) => c.articleId === articleId && c.parentId === rootCommentId);
    const sorted = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const start = page * size;
    const paged = sorted.slice(start, start + size);
    return {
      content: paged,
      totalPages: Math.ceil(sorted.length / size) || 1,
      totalElements: sorted.length,
      number: page,
      size,
    };
  },

  async createComment(articleId: number, req: CreateCommentRequest, authorId: number): Promise<CommentResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStoredUsers();
    const author = users.find((u) => u.id === authorId);
    const comments = getStoredComments();
    const newId = comments.length > 0 ? Math.max(...comments.map((c) => c.id)) + 1 : 1;

    const newComment: CommentResponse = {
      id: newId,
      articleId,
      parentId: req.parentId ?? null,
      authorAccountId: authorId,
      authorDisplayName: author ? author.displayName || author.username : `User ${authorId}`,
      content: req.content,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deleted: false,
    };

    comments.unshift(newComment);
    saveStoredComments(comments);
    return newComment;
  },

  async editComment(articleId: number, commentId: number, req: PatchCommentRequest, _userId: number): Promise<CommentResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const comments = getStoredComments();
    const idx = comments.findIndex((c) => c.id === commentId && c.articleId === articleId);
    if (idx === -1) {
      const err = new Error('Comment not found');
      (err as any).status = 404;
      throw err;
    }
    comments[idx] = {
      ...comments[idx],
      content: req.content,
      updatedAt: new Date().toISOString(),
    };
    saveStoredComments(comments);
    return comments[idx];
  },

  async deleteComment(articleId: number, commentId: number, _userId: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 150));
    const comments = getStoredComments();
    const idx = comments.findIndex((c) => c.id === commentId && c.articleId === articleId);
    if (idx === -1) return;
    comments[idx] = {
      ...comments[idx],
      deleted: true,
      content: 'This comment was deleted :(',
    };
    saveStoredComments(comments);
  },

  // Reactions mock methods
  async getReactions(articleId: number): Promise<GetReactionsResponse> {
    await new Promise((r) => setTimeout(r, 100));
    const reactions = getStoredReactions().filter((r) => r.articleId === articleId);
    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    }
    return { reactions: counts };
  },

  async putReaction(articleId: number, reactionType: ReactionType, userId: number): Promise<CreateReactionResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const reactions = getStoredReactions();
    const existingIdx = reactions.findIndex((r) => r.articleId === articleId && r.userId === userId);
    if (existingIdx !== -1) {
      reactions[existingIdx].reactionType = reactionType;
    } else {
      reactions.push({ articleId, userId, reactionType });
    }
    saveStoredReactions(reactions);
    return { reactionType };
  },

  async deleteReaction(articleId: number, userId: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    const reactions = getStoredReactions();
    const filtered = reactions.filter((r) => !(r.articleId === articleId && r.userId === userId));
    saveStoredReactions(filtered);
  },

  // Admin mock methods
  async getAccounts(page = 0, size = 50): Promise<PageResponse<AdminAccountResponse>> {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredUsers();
    const accounts: AdminAccountResponse[] = users.map((u) => ({
      accountId: u.id,
      email: u.email,
      username: u.username,
      createdAt: u.createdAt,
      role: u.role,
    }));
    const start = page * size;
    const paged = accounts.slice(start, start + size);
    return {
      content: paged,
      totalPages: Math.ceil(accounts.length / size) || 1,
      totalElements: accounts.length,
      number: page,
      size,
    };
  },

  async patchAccount(accountId: number, data: PatchAccountRequest): Promise<AdminAccountResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === accountId);
    if (idx === -1) {
      const err = new Error('Account not found');
      (err as any).status = 404;
      throw err;
    }
    if (data.role) users[idx].role = data.role;
    if (data.email) users[idx].email = data.email.toLowerCase().trim();
    if (data.username) users[idx].username = data.username.trim();
    saveStoredUsers(users);
    return {
      accountId: users[idx].id,
      email: users[idx].email,
      username: users[idx].username,
      createdAt: users[idx].createdAt,
      role: users[idx].role,
    };
  },

  async getProfiles(page = 0, size = 50): Promise<PageResponse<AdminUserProfileResponse>> {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredUsers();
    const profiles: AdminUserProfileResponse[] = users.map((u) => ({
      accountId: u.id,
      username: u.username,
      displayName: u.displayName ?? null,
      createdAt: u.createdAt,
      profileDescription: u.profileDescription ?? null,
    }));
    const start = page * size;
    const paged = profiles.slice(start, start + size);
    return {
      content: paged,
      totalPages: Math.ceil(profiles.length / size) || 1,
      totalElements: profiles.length,
      number: page,
      size,
    };
  },

  async patchProfile(accountId: number, data: PatchAdminUserRequest): Promise<PatchProfileResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === accountId);
    if (idx === -1) {
      const err = new Error('User not found');
      (err as any).status = 404;
      throw err;
    }
    if (data.displayName !== undefined) users[idx].displayName = data.displayName;
    if (data.profileDescription !== undefined) users[idx].profileDescription = data.profileDescription;
    saveStoredUsers(users);
    return {
      displayName: users[idx].displayName ?? null,
      profileDescription: users[idx].profileDescription ?? null,
    };
  },
};
