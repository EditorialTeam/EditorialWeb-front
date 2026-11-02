import { tokenStorage } from '../auth/tokenStorage';
import { mockApi } from '../mocks/mockApi';
import { ApiError, RefreshResponse } from './types';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If mock mode is explicitly activated, use mockApi directly
  if (tokenStorage.isMockMode()) {
    return handleMockRequest<T>(endpoint, options);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !(headers as Record<string, string>)['Authorization']) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netError: any) {
    // If backend is not running at localhost:8080 (connection refused),
    // automatically fallback to mock mode to keep UI interactive
    console.warn('Backend connection failed, falling back to Mock API:', netError);
    tokenStorage.setMockMode(true);
    return handleMockRequest<T>(endpoint, options);
  }

  // Handle 401 Unauthorized (attempt refresh)
  if (response.status === 401 && !endpoint.includes('/api/auth/')) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('editorial_auth_expired'));
      throw new Error('Сессия истекла');
    }

    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            // Retry request with new token
            resolve(request<T>(endpoint, options));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        throw new Error('Failed to refresh token');
      }

      const data: RefreshResponse = await refreshRes.json();
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);

      processQueue(null, data.accessToken);

      // Retry original request
      return request<T>(endpoint, options);
    } catch (refreshErr) {
      processQueue(refreshErr as Error, null);
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('editorial_auth_expired'));
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Произошла ошибка при выполнении запроса',
      };
    }
    const err = new Error(errorData.message || 'Ошибка запроса');
    (err as any).status = response.status;
    (err as any).code = errorData.code;
    (err as any).errors = errorData.errors;
    throw err;
  }

  return response.json() as Promise<T>;
}

async function handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
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
  if (endpoint === '/api/articles' && method === 'GET') {
    return (await mockApi.getArticles()) as unknown as T;
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

  throw new Error(`Mock endpoint not supported: ${method} ${endpoint}`);
}
