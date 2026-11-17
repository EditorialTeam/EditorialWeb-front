import { request } from './client';
import {
  AdminAccountResponse,
  AdminUserProfileResponse,
  PageResponse,
  PatchAccountRequest,
  PatchAdminUserRequest,
  PatchProfileResponse,
} from './types';

export const adminApi = {
  getAccounts(page = 0, size = 50): Promise<PageResponse<AdminAccountResponse>> {
    return request<PageResponse<AdminAccountResponse>>(
      `/api/admin/accounts?page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  getAccountById(accountId: number): Promise<AdminAccountResponse> {
    return request<AdminAccountResponse>(`/api/admin/accounts/${accountId}`, {
      method: 'GET',
    });
  },

  patchAccount(
    accountId: number,
    data: PatchAccountRequest
  ): Promise<AdminAccountResponse> {
    return request<AdminAccountResponse>(`/api/admin/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getProfiles(page = 0, size = 50): Promise<PageResponse<AdminUserProfileResponse>> {
    return request<PageResponse<AdminUserProfileResponse>>(
      `/api/admin/users?page=${page}&size=${size}`,
      { method: 'GET' }
    );
  },

  patchProfile(
    accountId: number,
    data: PatchAdminUserRequest
  ): Promise<PatchProfileResponse> {
    return request<PatchProfileResponse>(`/api/admin/users/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
