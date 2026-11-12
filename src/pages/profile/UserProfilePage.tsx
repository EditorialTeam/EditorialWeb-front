import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '@/core/api/userApi';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse, UserProfile } from '@/core/api/types';
import { useAuth } from '@/core/auth/AuthContext';
import { ArticleCard } from '../catalog/ArticleCard';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Hash,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Edit3,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const accountId = id ? parseInt(id, 10) : NaN;
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(accountId)) {
      setError('Некорректный идентификатор пользователя');
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const isSelf = user && user.accountId === accountId;

        const [profileData, allArticles] = await Promise.all([
          isSelf ? userApi.getMe().catch(() => userApi.getUserProfile(accountId)) : userApi.getUserProfile(accountId),
          articlesApi.getAll().catch(() => []),
        ]);

        setProfile(profileData);

        const authorArticles = allArticles.filter(
          (a) => a.authorAccountId === accountId || a.authorId === accountId
        );
        setArticles(authorArticles);
      } catch (err: any) {
        console.error('Failed to load user profile:', err);
        setError(err.message || 'Пользователь не найден');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [accountId, user]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-40 bg-surface border border-outline-variant rounded-2xl" />
        <div className="h-64 bg-surface border border-outline-variant rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-2xl font-bold text-on-surface">Пользователь не найден</h2>
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
  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
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

        {isSelf && (
          <Link to="/profile">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Edit3 className="w-3.5 h-3.5" />
              Редактировать профиль
            </Button>
          </Link>
        )}
      </div>

      {/* User Bio Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-3xl tracking-tight shadow-sm">
              {(profile.displayName || profile.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm font-mono text-secondary mt-0.5">@{profile.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-secondary border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant">
              <Hash className="w-3.5 h-3.5 text-secondary" />
              <span>ID: <strong className="text-on-surface">{profile.accountId}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>С {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Profile Description */}
        {profile.profileDescription ? (
          <div className="pt-4 border-t border-outline-variant">
            <p className="text-sm sm:text-base text-secondary leading-relaxed max-w-2xl">
              {profile.profileDescription}
            </p>
          </div>
        ) : (
          <div className="pt-4 border-t border-outline-variant text-xs text-secondary/70 italic">
            Автор пока не добавил описание профиля.
          </div>
        )}
      </div>

      {/* Articles by this Author */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            Публикации автора ({articles.length})
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="bg-surface border border-dashed border-outline-variant rounded-2xl p-10 text-center space-y-3">
            <p className="text-sm text-secondary">
              У пользователя <strong>{profile.displayName || profile.username}</strong> пока нет опубликованных статей.
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
