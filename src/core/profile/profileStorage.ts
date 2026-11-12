import { UserProfileData, TrackedAuthor, BookmarkRecord } from './types';
import { tokenStorage } from '../auth/tokenStorage';

const PROFILE_STORAGE_KEY = 'editorial_user_profile_data';
const BOOKMARKS_STORAGE_KEY = 'editorial_user_bookmarks';
const LIKES_STORAGE_KEY = 'editorial_user_likes';
const TRACKED_AUTHORS_KEY = 'editorial_tracked_authors';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

const DEFAULT_AUTHORS: TrackedAuthor[] = [
  {
    id: 1,
    name: 'Алиса Ветрова',
    specialty: 'Продуктовый дизайн, UI/UX',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    isFollowed: true,
  },
  {
    id: 2,
    name: 'Мария Соколова',
    specialty: 'ИИ, Генеративный код',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    isFollowed: true,
  },
  {
    id: 3,
    name: 'Даниил Росс',
    specialty: 'Книгопечатание, Арт-зины',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isFollowed: true,
  },
];

function notifyProfileChange() {
  window.dispatchEvent(new CustomEvent('editorial_profile_updated'));
}

export const profileStorage = {
  getProfile(): UserProfileData {
    const user = tokenStorage.getUser();
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserProfileData;
        if (user && parsed.accountId === user.accountId) {
          return {
            ...parsed,
            role: user.role,
            username: user.username,
            email: user.email,
          };
        }
      } catch {
        // fallback
      }
    }

    // Default profile
    const defaultProfile: UserProfileData = {
      accountId: user?.accountId || 1,
      username: user?.username || 'alex_smirnov',
      email: user?.email || 'alex@example.com',
      firstName: 'Алексей',
      lastName: 'Смирнов',
      displayName: 'Алексей Смирнов',
      role: user?.role || 'AUTHOR',
      bio: 'Интересуюсь генеративным артом, типографикой и культурой самиздата. Коллекционирую редкие арт-зины и исследую трансформацию экранного чтения.',
      avatarUrl: DEFAULT_AVATAR,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  updateProfile(updates: Partial<UserProfileData>): UserProfileData {
    const current = this.getProfile();
    const updated: UserProfileData = {
      ...current,
      ...updates,
      displayName:
        updates.firstName || updates.lastName
          ? `${updates.firstName ?? current.firstName} ${updates.lastName ?? current.lastName}`.trim()
          : current.displayName,
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

    // Also update auth user if username changed
    const user = tokenStorage.getUser();
    if (user) {
      tokenStorage.setUser({
        ...user,
        username: updated.username,
      });
    }

    notifyProfileChange();
    return updated;
  },

  getBookmarks(): BookmarkRecord[] {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) {
      // Default sample bookmarks
      const defaultBookmarks: BookmarkRecord[] = [
        { articleId: 1, savedAt: 'Сохранено 2 дня назад', category: 'Дизайн' },
        { articleId: 2, savedAt: 'Сохранено 5 дней назад', category: 'Культура' },
        { articleId: 3, savedAt: 'Сохранено 12 мая', category: 'Технологии' },
      ];
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(defaultBookmarks));
      return defaultBookmarks;
    }
    try {
      return JSON.parse(raw) as BookmarkRecord[];
    } catch {
      return [];
    }
  },

  isBookmarked(articleId: number): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some((b) => b.articleId === articleId);
  },

  toggleBookmark(
    articleId: number,
    category: BookmarkRecord['category'] = 'Дизайн'
  ): boolean {
    let bookmarks = this.getBookmarks();
    const exists = bookmarks.some((b) => b.articleId === articleId);
    if (exists) {
      bookmarks = bookmarks.filter((b) => b.articleId !== articleId);
    } else {
      bookmarks.unshift({
        articleId,
        savedAt: 'Только что',
        category,
      });
    }
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    notifyProfileChange();
    return !exists;
  },

  getLikes(): number[] {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    if (!raw) {
      const defaultLikes = [1, 2, 3];
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(defaultLikes));
      return defaultLikes;
    }
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return [];
    }
  },

  isLiked(articleId: number): boolean {
    const likes = this.getLikes();
    return likes.includes(articleId);
  },

  toggleLike(articleId: number): boolean {
    let likes = this.getLikes();
    const exists = likes.includes(articleId);
    if (exists) {
      likes = likes.filter((id) => id !== articleId);
    } else {
      likes.unshift(articleId);
    }
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
    notifyProfileChange();
    return !exists;
  },

  getTrackedAuthors(): TrackedAuthor[] {
    const raw = localStorage.getItem(TRACKED_AUTHORS_KEY);
    if (!raw) {
      localStorage.setItem(TRACKED_AUTHORS_KEY, JSON.stringify(DEFAULT_AUTHORS));
      return DEFAULT_AUTHORS;
    }
    try {
      return JSON.parse(raw) as TrackedAuthor[];
    } catch {
      return DEFAULT_AUTHORS;
    }
  },

  toggleFollowAuthor(authorId: number): boolean {
    const authors = this.getTrackedAuthors();
    const target = authors.find((a) => a.id === authorId);
    if (!target) return false;
    target.isFollowed = !target.isFollowed;
    localStorage.setItem(TRACKED_AUTHORS_KEY, JSON.stringify(authors));
    notifyProfileChange();
    return target.isFollowed;
  },
};
