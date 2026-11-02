import {
  AccountRegisterResponse,
  ArticleResponse,
  CreateArticleRequest,
  LoginRequest,
  LoginResponse,
  PatchArticleRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterAccountRequest,
  UpdateArticleRequest,
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
}

const DEFAULT_USERS: MockUserEntry[] = [
  {
    id: 1,
    username: 'alex',
    email: 'alex@example.com',
    password: 'password123',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'elena',
    email: 'elena@example.com',
    password: 'password123',
    role: 'EDITOR',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: 'maxim',
    email: 'maxim@example.com',
    password: 'password123',
    role: 'AUTHOR',
    createdAt: new Date().toISOString(),
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
    return JSON.parse(raw) as MockUserEntry[];
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
      exp: Math.floor(Date.now() / 1000) + 900, // 15 mins
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
      const err = new Error('Username or email already taken');
      (err as any).status = 409;
      (err as any).code = 'CONFLICT';
      throw err;
    }

    const newUser: MockUserEntry = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      username: req.username.trim(),
      email: cleanEmail,
      password: req.password,
      role: 'USER', // Default backend role
      createdAt: new Date().toISOString(),
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
    await new Promise((r) => setTimeout(r, 200));
    const users = getStoredUsers();
    const parts = req.refreshToken.split('-');
    const userId = parseInt(parts[2], 10);
    const user = users.find((u) => u.id === userId) || users[0];

    return {
      accessToken: createFakeJwt(user),
      refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    };
  },

  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
  },

  async getArticles(): Promise<ArticleResponse[]> {
    await new Promise((r) => setTimeout(r, 150));
    return getStoredArticles();
  },

  async getArticleById(id: number): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const articles = getStoredArticles();
    const found = articles.find((a) => a.id === id);
    if (!found) {
      const err = new Error('Article not found');
      (err as any).status = 404;
      (err as any).code = 'ARTICLE_NOT_FOUND';
      throw err;
    }
    return found;
  },

  async createArticle(req: CreateArticleRequest, currentUserId: number): Promise<ArticleResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const articles = getStoredArticles();
    const newArticle: ArticleResponse = {
      id: articles.length > 0 ? Math.max(...articles.map((a) => a.id)) + 1 : 1,
      title: req.title,
      content: req.content,
      authorAccountId: currentUserId,
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
