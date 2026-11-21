import { request } from './client';
import { UserProfile, PatchProfileRequest, PatchProfileResponse } from './types';

export const userApi = {
  getMe(): Promise<UserProfile> {
    return request<UserProfile>('/api/users/me', {
      method: 'GET',
    });
  },

  updateMe(data: PatchProfileRequest): Promise<PatchProfileResponse> {
    return request<PatchProfileResponse>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getUserProfile(accountId: number): Promise<UserProfile> {
    return request<UserProfile>(`/api/users/${accountId}`, {
      method: 'GET',
    });
  },
};
