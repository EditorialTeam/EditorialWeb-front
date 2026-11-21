import { tokenStorage } from '../auth/tokenStorage';
import { mockApi } from '../mocks/mockApi';
import { ApiError, RefreshResponse } from './types';

let refreshPromise: Promise<void> | null = null;

async function responseError(response: Response): Promise<Error> {
  let data: ApiError | undefined;
  try { data = await response.json(); } catch { /* Security errors may have no JSON body. */ }
  const messages: Record<number, string> = {
    401: 'Войдите в аккаунт, чтобы продолжить.',
    403: 'Недостаточно прав для этого действия.',
    404: 'Материал не найден.',
    409: 'Действие недоступно в текущем статусе статьи.',
    500: 'Сервер временно недоступен. Повторите попытку позже.',
    502: 'Не удалось связаться с сервером. Проверьте, запущен ли EditorialWeb.',
    503: 'Сервис временно недоступен. Повторите попытку позже.',
  };
  return Object.assign(new Error(data?.message || messages[response.status] || 'Ошибка запроса'), {
    status: response.status, code: data?.code, errors: data?.errors,
  });
}

export async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error('Сессия истекла. Войдите снова.');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) throw await responseError(response);
      const data: RefreshResponse = await response.json();
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);
      window.dispatchEvent(new CustomEvent('editorial_auth_refreshed'));
    })().catch((error) => {
      // A temporary server/network failure does not invalidate the refresh token.
      if (error.status === 401 || error.status === 403 || !tokenStorage.getRefreshToken()) {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('editorial_auth_expired'));
      }
      throw error;
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (tokenStorage.isMockMode()) return handleMockRequest<T>(endpoint, options);

  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken && !endpoint.startsWith('/api/auth/')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return fetch(endpoint, { ...options, headers });
  };

  let response: Response;
  try {
    const originalToken = tokenStorage.getAccessToken();
    response = await send();
    if (response.status === 401 && !endpoint.startsWith('/api/auth/')) {
      if (tokenStorage.getAccessToken() === originalToken) await refreshSession();
      response = await send();
      if (response.status === 401) {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('editorial_auth_expired'));
      }
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Не удалось связаться с сервером. Проверьте, запущен ли EditorialWeb.');
    }
    throw error;
  }
  if (!response.ok) throw await responseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
async function handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  const url = new URL(endpoint, 'http://localhost');
  endpoint = url.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : undefined;
  const currentUser = tokenStorage.getUser();
  const userId = currentUser ? currentUser.accountId : 1;

  if (endpoint === '/api/auth/register' && method === 'POST') {
    return (await mockApi.register(body)) as unknown as T;
  }
  if (endpoint === '/api/auth/login' && method === 'POST') {
    return (await mockApi.login(body)) as unknown as T;
  }
  if (endpoint === '/api/auth/refresh' && method === 'POST') {
    return (await mockApi.refresh(body)) as unknown as T;
  }
  if (endpoint === '/api/auth/logout' && method === 'POST') {
    return (await mockApi.logout()) as unknown as T;
  }
  if (['/api/articles', '/api/articles/my', '/api/editor/articles'].includes(endpoint) && method === 'GET') {
    let articles = await mockApi.getArticles();
    if (endpoint === '/api/articles/my') articles = articles.filter((article) => article.authorAccountId === userId);
    if (endpoint === '/api/editor/articles') articles = articles.filter((article) => article.status === 'PENDING_REVIEW');
    const status = url.searchParams.get('status');
    if (status) articles = articles.filter((article) => article.status === status);
    const page = Number(url.searchParams.get('page') || 0);
    const size = Number(url.searchParams.get('size') || 20);
    return { content: articles.slice(page * size, (page + 1) * size), totalPages: Math.ceil(articles.length / size) } as T;
  }
  const actionMatch = endpoint.match(/^\/api\/(?:editor\/)?articles\/(\d+)\/(submit|archive|withdraw-from-review|moderate)$/);
  if (actionMatch && method === 'POST') {
    return await mockApi.changeStatus(Number(actionMatch[1]), actionMatch[2], currentUser, url.searchParams.get('decision')) as T;
  }
  if (endpoint === '/api/users/me' && method === 'GET') {
    return (await mockApi.getMe(userId)) as unknown as T;
  }
  if (endpoint === '/api/users/me' && method === 'PATCH') {
    return (await mockApi.updateMe(userId, body)) as unknown as T;
  }
  if (endpoint.startsWith('/api/users/') && method === 'GET') {
    const id = parseInt(endpoint.replace('/api/users/', ''), 10);
    return (await mockApi.getUserProfile(id)) as unknown as T;
  }
  // Mock comments
  if (endpoint.includes('/comments') && endpoint.includes('/replies') && method === 'GET') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/comments\/(\d+)\/replies/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      const rootCommentId = parseInt(match[2], 10);
      return (await mockApi.getReplies(articleId, rootCommentId)) as unknown as T;
    }
  }

  if (endpoint.includes('/comments') && method === 'GET') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/comments/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      return (await mockApi.getRootComments(articleId)) as unknown as T;
    }
  }

  if (endpoint.includes('/comments') && method === 'POST') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/comments/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      return (await mockApi.createComment(articleId, body, userId)) as unknown as T;
    }
  }

  if (endpoint.includes('/comments/') && method === 'PATCH') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/comments\/(\d+)/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      const commentId = parseInt(match[2], 10);
      return (await mockApi.editComment(articleId, commentId, body, userId)) as unknown as T;
    }
  }

  if (endpoint.includes('/comments/') && method === 'DELETE') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/comments\/(\d+)/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      const commentId = parseInt(match[2], 10);
      return (await mockApi.deleteComment(articleId, commentId, userId)) as unknown as T;
    }
  }

  // Mock reactions
  if (endpoint.includes('/reactions') && method === 'GET') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/reactions/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      return (await mockApi.getReactions(articleId)) as unknown as T;
    }
  }

  if (endpoint.includes('/reactions') && method === 'PUT') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/reactions/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      return (await mockApi.putReaction(articleId, body.reactionType, userId)) as unknown as T;
    }
  }

  if (endpoint.includes('/reactions') && method === 'DELETE') {
    const match = endpoint.match(/\/api\/articles\/(\d+)\/reactions/);
    if (match) {
      const articleId = parseInt(match[1], 10);
      return (await mockApi.deleteReaction(articleId, userId)) as unknown as T;
    }
  }

  if (endpoint.startsWith('/api/articles/') && method === 'GET') {
    const id = parseInt(endpoint.replace('/api/articles/', ''), 10);
    return (await mockApi.getArticleById(id)) as unknown as T;
  }
  if (endpoint === '/api/articles' && method === 'POST') {
    return (await mockApi.createArticle(body, userId)) as unknown as T;
  }
  if (endpoint.startsWith('/api/articles/') && method === 'PUT') {
    const id = parseInt(endpoint.replace('/api/articles/', ''), 10);
    return (await mockApi.updateArticle(id, body)) as unknown as T;
  }
  if (endpoint.startsWith('/api/articles/') && method === 'PATCH') {
    const id = parseInt(endpoint.replace('/api/articles/', ''), 10);
    return (await mockApi.patchArticle(id, body)) as unknown as T;
  }
  if (endpoint.startsWith('/api/articles/') && method === 'DELETE') {
    const id = parseInt(endpoint.replace('/api/articles/', ''), 10);
    return (await mockApi.deleteArticle(id)) as unknown as T;
  }

  // Mock admin
  if (endpoint.startsWith('/api/admin/accounts') && method === 'GET') {
    return (await mockApi.getAccounts()) as unknown as T;
  }

  if (endpoint.startsWith('/api/admin/accounts/') && method === 'PATCH') {
    const accountId = parseInt(endpoint.replace('/api/admin/accounts/', ''), 10);
    return (await mockApi.patchAccount(accountId, body)) as unknown as T;
  }

  if (endpoint.startsWith('/api/admin/users') && method === 'GET') {
    return (await mockApi.getProfiles()) as unknown as T;
  }

  if (endpoint.startsWith('/api/admin/users/') && method === 'PATCH') {
    const accountId = parseInt(endpoint.replace('/api/admin/users/', ''), 10);
    return (await mockApi.patchProfile(accountId, body)) as unknown as T;
  }

  throw new Error(`Mock endpoint not supported: ${method} ${endpoint}`);
}
