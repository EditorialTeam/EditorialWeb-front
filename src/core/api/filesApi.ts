import { request } from './client';

export interface ArticleImage { id: number; objectKey: string }
export interface UploadResult { objectKey: string }
export const fileUrl = (key: string) => `/api/files?key=${encodeURIComponent(key)}`;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
export function imageBody(file: File): FormData {
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Выберите изображение размером до 10 МиБ.');
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) throw new Error('Поддерживаются JPEG, PNG, GIF и WebP.');
  const body = new FormData();
  body.append('file', file);
  return body;
}
async function uploaded(result: Promise<UploadResult>): Promise<UploadResult> {
  const data = await result;
  if (!data?.objectKey || typeof data.objectKey !== 'string') throw new Error('Сервер не вернул ключ загруженного изображения.');
  return data;
}
export const filesApi = {
  uploadAvatar: (file: File) => uploaded(request<UploadResult>('/api/users/me/avatar', { method: 'POST', body: imageBody(file) })),
  list: (articleId: number) => request<ArticleImage[]>(`/api/articles/file/${articleId}`),
  upload: (articleId: number, file: File, category: 'COVER' | 'ARTICLE_IMAGE') => uploaded(request<UploadResult>(`/api/articles/file/${articleId}?category=${category}`, { method: 'POST', body: imageBody(file) })),
  replace: (articleId: number, imageId: number, file: File) => uploaded(request<UploadResult>(`/api/articles/file/${articleId}/${imageId}`, { method: 'PUT', body: imageBody(file) })),
  delete: (articleId: number, imageId: number) => request<void>(`/api/articles/file/${articleId}/${imageId}`, { method: 'DELETE' }),
};
