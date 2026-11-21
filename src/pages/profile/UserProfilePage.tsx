import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '@/core/api/userApi';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse, UserProfile } from '@/core/api/types';
import { profileStorage } from '@/core/profile/profileStorage';
import { useAuth } from '@/core/auth/AuthContext';
import { ArticleCard } from '../catalog/ArticleCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateReadingTime } from '@/core/utils/readingTime';
import {
  Calendar,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Edit3,
  Share2,
  Check,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const accountId = id ? parseInt(id, 10) : NaN;
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  // Check tracked authors
  const trackedAuthor = useMemo(() => {
    if (isNaN(accountId)) return undefined;
    return profileStorage.getAuthorById(accountId);
  }, [accountId]);

  useEffect(() => {
    setIsFollowed(profileStorage.isFollowingAuthor(accountId));

    const handleUpdate = () => {
      setIsFollowed(profileStorage.isFollowingAuthor(accountId));
    };
    window.addEventListener('editorial_profile_updated', handleUpdate);
    return () => window.removeEventListener('editorial_profile_updated', handleUpdate);
  }, [accountId]);

  useEffect(() => {
    if (isNaN(accountId)) {
      setError('Автор не найден');
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const isSelf = user && user.accountId === accountId;

        const [profileData, allArticles] = await Promise.all([
          isSelf
            ? userApi.getMe().catch(() => userApi.getUserProfile(accountId))
            : userApi.getUserProfile(accountId).catch(() => null),
          articlesApi.getAll().catch(() => []),
        ]);

        // Filter articles by this author
        const authorArticles = allArticles.filter(
          (a) => a.authorAccountId === accountId || a.authorId === accountId
        );
        setArticles(authorArticles);

        if (profileData) {
          setProfile(profileData);
        } else if (trackedAuthor) {
          setProfile({
            accountId: trackedAuthor.id,
            username: `author_${trackedAuthor.id}`,
            displayName: trackedAuthor.name,
            createdAt: new Date('2026-05-10T10:00:00Z').toISOString(),
            profileDescription: trackedAuthor.specialty,
          });
        } else if (authorArticles.length > 0) {
          const first = authorArticles[0];
          setProfile({
            accountId,
            username: `author_${accountId}`,
            displayName: first.authorDisplayName || 'Автор',
            createdAt: first.createdAt || new Date().toISOString(),
            profileDescription: 'Автор публикаций в независимом журнале Editorial.',
          });
        } else {
          // Fallback profile
          setProfile({
            accountId,
            username: `author_${accountId}`,
            displayName: 'Автор',
            createdAt: new Date().toISOString(),
            profileDescription: 'Автор публикаций в Editorial.',
          });
        }
      } catch (err: any) {
        console.error('Failed to load user profile:', err);
        setError(err.message || 'Автор не найден');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [accountId, user, trackedAuthor]);

  const handleToggleFollow = () => {
    const nextState = profileStorage.toggleFollowAuthor(accountId);
    setIsFollowed(nextState);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Compute author stats
  const totalStats = useMemo(() => {
    let totalWords = 0;
    let totalMinutes = 0;
    articles.forEach((a) => {
      const stats = calculateReadingTime(a.content || '');
      totalWords += stats.wordCount;
      totalMinutes += stats.minutes;
    });
    return { totalWords, totalMinutes };
  }, [articles]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-44 bg-surface border border-outline-variant rounded-2xl" />
        <div className="h-64 bg-surface border border-outline-variant rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-2xl font-bold text-on-surface">Автор не найден</h2>
        <p className="text-sm text-secondary">{error || 'Профиль не существует или был удален'}</p>
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            В каталог публикаций
          </Button>
        </Link>
      </div>
    );
  }

  const isSelf = user && user.accountId === accountId;
  const authorName = profile.displayName || trackedAuthor?.name || profile.username || 'Автор';
  const avatarUrl =
    trackedAuthor?.avatarUrl ||
    `https://images.unsplash.com/photo-${1534528741775 + (accountId % 1000)}?auto=format&fit=crop&w=240&q=80`;

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8 animate-in fade-in duration-200">
      {/* Navigation Top */}
      <div className="flex items-center justify-between gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-secondary hover:text-on-surface -ml-2">
            <ArrowLeft className="w-4 h-4" />
            В каталог
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs gap-1.5"
            title="Скопировать ссылку на страницу автора"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Ссылка скопирована' : 'Поделиться'}</span>
          </Button>

          {isSelf ? (
            <Link to="/profile">
              <Button size="sm" className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5" />
                Редактировать мой профиль
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant={isFollowed ? 'secondary' : 'primary'}
              onClick={handleToggleFollow}
              className="gap-1.5 text-xs font-semibold"
            >
              {isFollowed ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Вы подписаны</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Читать автора</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Author Hero Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={avatarUrl}
              alt={authorName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-surface-container shadow-sm border border-outline-variant"
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  {authorName}
                </h1>
                <Badge variant="role">AUTHOR</Badge>
              </div>
              <p className="text-sm font-mono text-secondary mt-0.5">@{profile.username}</p>
              {trackedAuthor?.specialty && (
                <p className="text-xs font-medium text-primary mt-1.5">{trackedAuthor.specialty}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs text-secondary border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>В редакции с {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Bio / Profile Description */}
        {profile.profileDescription && (
          <div className="pt-4 border-t border-outline-variant">
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
              {profile.profileDescription}
            </p>
          </div>
        )}

        {/* Author Stats Strip */}
        <div className="pt-4 border-t border-outline-variant/70 grid grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-mono">
              {articles.length}
            </div>
            <div className="text-xs text-secondary mt-0.5">Публикаций</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-mono">
              {totalStats.totalWords}
            </div>
            <div className="text-xs text-secondary mt-0.5">Слов в статьях</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-mono">
              ~{totalStats.totalMinutes} мин
            </div>
            <div className="text-xs text-secondary mt-0.5">Время чтения</div>
          </div>
        </div>
      </div>

      {/* Publications by Author */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              Статьи автора ({articles.length})
            </h2>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="bg-surface border border-dashed border-outline-variant rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-secondary/60 mx-auto" />
            <h3 className="text-base font-bold text-on-surface">Нет опубликованных статей</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
              У автора <strong>{authorName}</strong> пока нет открытых публикаций в каталоге.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
