import { AccountRole } from '../api/types';

export interface UserProfileData {
  accountId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: AccountRole;
  bio: string;
  avatarUrl: string;
  createdAt: string;
}

export interface TrackedAuthor {
  id: number;
  name: string;
  specialty: string;
  avatarUrl: string;
  isFollowed: boolean;
}

export interface BookmarkRecord {
  articleId: number;
  savedAt: string;
  category: 'Дизайн' | 'Технологии' | 'Культура' | 'Медиа';
}

export interface ProfileStats {
  bookmarksCount: number;
  likesCount: number;
  followingCount: number;
}
