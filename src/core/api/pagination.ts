import { PageResponse } from './types';

export async function collectPages<T>(load: (page: number) => Promise<PageResponse<T>>): Promise<T[]> {
  const items: T[] = [];
  let page = 0;
  let totalPages = 1;
  do {
    const result = await load(page);
    if (!Array.isArray(result.content) || !Number.isInteger(result.totalPages) || result.totalPages < 0) {
      throw new Error('Сервер вернул некорректную страницу данных.');
    }
    items.push(...result.content);
    totalPages = result.totalPages;
    page += 1;
  } while (page < totalPages);
  return items;
}
