import { request } from './client';
import {
  AccountRegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterAccountRequest,
} from './types';

export const authApi = {
  register(data: RegisterAccountRequest): Promise<AccountRegisterResponse> {
    return request<AccountRegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
      }),
    });
  },

  login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      }),
    });
  },

  refresh(data: RefreshRequest): Promise<RefreshResponse> {
    return request<RefreshResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout(data: LogoutRequest): Promise<void> {
    return request<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
