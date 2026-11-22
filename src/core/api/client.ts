import { tokenStorage } from '../auth/tokenStorage';
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
  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
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
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
