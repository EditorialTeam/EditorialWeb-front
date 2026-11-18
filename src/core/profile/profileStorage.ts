import { UserProfileData, TrackedAuthor, BookmarkRecord } from './types';
import { tokenStorage } from '../auth/tokenStorage';

const placeholderAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#e9ecef"/><circle cx="48" cy="36" r="16" fill="#9ca3af"/><path d="M16 96v-12a32 32 0 0164 0v12" fill="#9ca3af"/></svg>');
const DEFAULT_AVATAR = placeholderAvatar;
const DEFAULT_AUTHORS: TrackedAuthor[] = [];
const storageKey = (kind: string) => `editorial_v2_${tokenStorage.isMockMode() ? 'demo' : 'live'}_${tokenStorage.getUser()?.accountId ?? 'guest'}_${kind}`;
const read = <T>(kind: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(storageKey(kind)) || 'null') ?? fallback; }
  catch { return fallback; }
};

function notifyProfileChange() {
  window.dispatchEvent(new CustomEvent('editorial_profile_updated'));
}

export const profileStorage = {
  getProfile(): UserProfileData {
    const user = tokenStorage.getUser();
    const raw = localStorage.getItem(storageKey('profile'));
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
      accountId: user?.accountId || 0,
      username: user?.username || '',
      email: user?.email || '',
      firstName: '',
      lastName: '',
      displayName: user?.username || '',
      role: user?.role || 'USER',
      bio: '',
      avatarUrl: DEFAULT_AVATAR,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey('profile'), JSON.stringify(defaultProfile));
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
    localStorage.setItem(storageKey('profile'), JSON.stringify(updated));

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
    const raw = localStorage.getItem(storageKey('bookmarks'));
    if (!raw) {
      // Default sample bookmarks
      const defaultBookmarks: BookmarkRecord[] = [];
      localStorage.setItem(storageKey('bookmarks'), JSON.stringify(defaultBookmarks));
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
    category?: BookmarkRecord['category']
  ): boolean {
    let bookmarks = this.getBookmarks();
    const exists = bookmarks.some((b) => b.articleId === articleId);
    if (exists) {
      bookmarks = bookmarks.filter((b) => b.articleId !== articleId);
    } else {
      bookmarks.unshift({
        articleId,
        savedAt: new Date().toLocaleDateString('ru-RU'),
        category,
      });
    }
    localStorage.setItem(storageKey('bookmarks'), JSON.stringify(bookmarks));
    notifyProfileChange();
    return !exists;
  },

  getLikes(): number[] {
    const raw = localStorage.getItem(storageKey('likes'));
    if (!raw) {
      const defaultLikes: number[] = [];
      localStorage.setItem(storageKey('likes'), JSON.stringify(defaultLikes));
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

  getReaction(articleId: number): import('../api/types').ReactionType | null {
    return read<Record<string, import('../api/types').ReactionType>>('reactions', {})[articleId] ?? null;
  },

  setReaction(articleId: number, type: import('../api/types').ReactionType | null): void {
    const reactions = read<Record<string, import('../api/types').ReactionType>>('reactions', {});
    if (type) reactions[articleId] = type;
    else delete reactions[articleId];
    localStorage.setItem(storageKey('reactions'), JSON.stringify(reactions));
    const likes = Object.entries(reactions).filter(([, reaction]) => reaction === 'LIKE').map(([id]) => Number(id));
    localStorage.setItem(storageKey('likes'), JSON.stringify(likes));
    notifyProfileChange();
  },

  getTrackedAuthors(): TrackedAuthor[] {
    const raw = localStorage.getItem(storageKey('authors'));
    if (!raw) {
      localStorage.setItem(storageKey('authors'), JSON.stringify(DEFAULT_AUTHORS));
      return DEFAULT_AUTHORS;
    }
    try {
      return JSON.parse(raw) as TrackedAuthor[];
    } catch {
      return DEFAULT_AUTHORS;
    }
  },

  getAuthorById(authorId: number): TrackedAuthor | undefined {
    return this.getTrackedAuthors().find((a) => a.id === authorId);
  },

  isFollowingAuthor(authorId: number): boolean {
    const author = this.getAuthorById(authorId);
    return Boolean(author?.isFollowed);
  },

  toggleFollowAuthor(authorId: number, details?: Partial<TrackedAuthor>): boolean {
    const authors = this.getTrackedAuthors();
    let target = authors.find((a) => a.id === authorId);
    if (!target) {
      // Add author if not yet in tracked list
      target = {
        id: authorId,
        name: details?.name || 'Автор',
        specialty: details?.specialty || '',
        avatarUrl: DEFAULT_AVATAR,
        isFollowed: true,
      };
      authors.push(target);
      localStorage.setItem(storageKey('authors'), JSON.stringify(authors));
      notifyProfileChange();
      return true;
    }
    target.isFollowed = !target.isFollowed;
    localStorage.setItem(storageKey('authors'), JSON.stringify(authors));
    notifyProfileChange();
    return target.isFollowed;
  },
};
