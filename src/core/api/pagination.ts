import { PageResponse } from './types';
export async function collectPages<T>(load: (page: number) => Promise<PageResponse<T>>): Promise<T[]> {
  const items: T[] = [];
  let page = 0;
  let totalPages = 1;
  do {
    const data = await load(page);
    if (!Array.isArray(data.content) || !Number.isInteger(data.totalPages) || data.totalPages < 0) throw new Error('Сервер вернул некорректную страницу данных.');
    items.push(...data.content); totalPages = data.totalPages; page++;
  } while (page < totalPages);
  return items;
}
