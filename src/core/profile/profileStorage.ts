import { tokenStorage } from '../auth/tokenStorage';
export interface BookmarkRecord { articleId: number; savedAt: string; title?: string }
const key = () => `editorial_bookmarks_v3_live_${tokenStorage.getUser()?.accountId ?? 'guest'}`;
export const profileStorage = {
  getBookmarks(): BookmarkRecord[] {
    try { const data = JSON.parse(localStorage.getItem(key()) || '[]'); return Array.isArray(data) ? data.filter(item => Number.isInteger(item?.articleId) && typeof item.savedAt === 'string') : []; }
    catch { return []; }
  },
  isBookmarked(id: number): boolean { return this.getBookmarks().some(item => item.articleId === id); },
  toggleBookmark(id: number, title?: string): boolean {
    if (!tokenStorage.getUser()) return false;
    const items = this.getBookmarks();
    const exists = items.some(item => item.articleId === id);
    localStorage.setItem(key(), JSON.stringify(exists ? items.filter(item => item.articleId !== id) : [{ articleId: id, title, savedAt: new Date().toISOString() }, ...items]));
    window.dispatchEvent(new CustomEvent('editorial_profile_updated'));
    return !exists;
  },
};
