import {
  AccountRegisterResponse,
  ArticleResponse,
  CreateArticleRequest,
  LoginRequest,
  LoginResponse,
  PatchArticleRequest,
  PatchProfileRequest,
  PatchProfileResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterAccountRequest,
  UpdateArticleRequest,
  UserProfile,
} from '../api/types';
import { INITIAL_MOCK_ARTICLES } from './mockData';

const MOCK_ARTICLES_STORAGE_KEY = 'editorial_mock_articles_db';
const MOCK_USERS_STORAGE_KEY = 'editorial_mock_users_db';

interface MockUserEntry {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  createdAt: string;
  displayName?: string | null;
  profileDescription?: string | null;
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
    return [...INITIAL_MOCK_ARTICLES];
  }
  try {
    return JSON.parse(raw) as ArticleResponse[];
  } catch {
    return [...INITIAL_MOCK_ARTICLES];
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
        displayName: `Автор #${accountId}`,
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
        authorDisplayName: author ? author.displayName || author.username : `Автор #${a.authorAccountId}`,
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
      authorDisplayName: author ? author.displayName || author.username : `Автор #${article.authorAccountId}`,
    };
  },

  async createArticle(req: CreateArticleRequest, authorId: number): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const users = getStoredUsers();
    const author = users.find((u) => u.id === authorId);

    const newArticle: ArticleResponse = {
      id: Date.now(),
      title: req.title,
      content: req.content,
      authorAccountId: authorId,
      authorDisplayName: author ? author.displayName || author.username : `Автор #${authorId}`,
      status: 'PUBLISHED',
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

  async deleteArticle(id: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const filtered = articles.filter((a) => a.id !== id);
    saveStoredArticles(filtered);
  },
};
