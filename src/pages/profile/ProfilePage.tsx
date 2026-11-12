import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { userApi } from '@/core/api/userApi';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse, UserProfile } from '@/core/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ArticleCard } from '../catalog/ArticleCard';
import {
  Calendar,
  Hash,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  PenSquare,
  ArrowLeft,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileData, allArticles] = await Promise.all([
          userApi.getMe(),
          articlesApi.getAll().catch(() => []),
        ]);

        setProfile(profileData);
        setDisplayName(profileData.displayName || '');
        setProfileDescription(profileData.profileDescription || '');

        if (user) {
          const myArticles = allArticles.filter(
            (a) => a.authorAccountId === user.accountId || a.authorId === user.accountId
          );
          setArticles(myArticles);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Не удалось загрузить данные профиля');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(false);
    setError(null);

    try {
      const res = await userApi.updateMe({
        displayName: displayName.trim() || null,
        profileDescription: profileDescription.trim() || null,
      });

      if (profile) {
        setProfile({
          ...profile,
          displayName: res.displayName,
          profileDescription: res.profileDescription,
        });
      }

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-28 bg-surface border border-outline-variant rounded-2xl" />
        <div className="h-64 bg-surface border border-outline-variant rounded-2xl" />
      </div>
    );
  }

  const formattedDate = profile?.createdAt
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

        {user && (
          <Link to={`/user/${user.accountId}`}>
            <Button variant="outline" size="sm" className="text-xs">
              Публичный вид страницы
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-2xl tracking-tight shadow-sm">
            {(profile?.displayName || profile?.username || user?.username || 'U')
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                {profile?.displayName || profile?.username || user?.username}
              </h1>
              {user && <Badge variant="role">{user.role}</Badge>}
            </div>
            <p className="text-sm font-mono text-secondary mt-0.5">
              @{profile?.username || user?.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-secondary border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant">
            <Hash className="w-3.5 h-3.5 text-secondary" />
            <span>ID: <strong className="text-on-surface">{user?.accountId}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            <span>С нами с {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Изменения профиля успешно сохранены!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-on-surface tracking-tight">Настройки профиля</h2>
          <p className="text-xs text-secondary mt-1">
            Отображаемое имя и описание автора будут видны читателям в карточках ваших статей и на личной странице
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="block text-sm font-medium text-on-surface">
              Отображаемое имя (ФИО / Псевдоним)
            </label>
            <Input
              id="displayName"
              placeholder="Например: Иван Иванов"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-secondary">
              Если не заполнено, будет использоваться ваш тег @{profile?.username || user?.username}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profileDescription" className="block text-sm font-medium text-on-surface">
              О себе / Описание автора
            </label>
            <textarea
              id="profileDescription"
              rows={4}
              placeholder="Расскажите о ваших интересах, профессиональном опыте или темах, о которых вы пишете..."
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>

      {/* Author Publications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-bold text-on-surface tracking-tight">
              Мои публикации ({articles.length})
            </h2>
          </div>

          <Link to="/editor">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <PenSquare className="w-3.5 h-3.5" />
              Написать статью
            </Button>
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="bg-surface border border-dashed border-outline-variant rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-secondary">У вас пока нет созданных публикаций.</p>
            <Link to="/editor">
              <Button size="sm" className="gap-1.5 text-xs">
                <PenSquare className="w-3.5 h-3.5" />
                Создать первую публикацию
              </Button>
            </Link>
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
