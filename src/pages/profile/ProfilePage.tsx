import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { profileStorage } from '@/core/profile/profileStorage';
import { UserProfileData, TrackedAuthor, BookmarkRecord } from '@/core/profile/types';
import { EditProfileModal } from './EditProfileModal';
import { calculateReadingTime } from '@/core/utils/readingTime';
import { Button } from '@/components/ui/Button';
import {
  Camera,
  Edit2,
  Share2,
  Bookmark,
  BookmarkCheck,
  Heart,
  Users,
  BookOpen,
  History,
  Check,
  Sparkles,
  Bell,
  Lock,
  EyeOff,
  ChevronRight,
  BookmarkPlus,
  PenSquare,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfileData>(() => profileStorage.getProfile());
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>(() => profileStorage.getBookmarks());
  const [likes, setLikes] = useState<number[]>(() => profileStorage.getLikes());
  const [authors, setAuthors] = useState<TrackedAuthor[]>(() => profileStorage.getTrackedAuthors());

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'likes' | 'authors' | 'my-articles' | 'history'>('bookmarks');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Sync state on storage events
  useEffect(() => {
    const handleUpdate = () => {
      setProfile(profileStorage.getProfile());
      setBookmarks(profileStorage.getBookmarks());
      setLikes(profileStorage.getLikes());
      setAuthors(profileStorage.getTrackedAuthors());
    };
    window.addEventListener('editorial_profile_updated', handleUpdate);
    return () => window.removeEventListener('editorial_profile_updated', handleUpdate);
  }, []);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoadingArticles(true);
      try {
        const data = await articlesApi.getAll();
        setArticles(data || []);
      } catch (err) {
        console.error('Failed to load articles for profile:', err);
      } finally {
        setIsLoadingArticles(false);
      }
    };
    fetchArticles();
  }, []);

  const handleSaveProfile = (updates: Partial<UserProfileData>) => {
    const updated = profileStorage.updateProfile(updates);
    setProfile(updated);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleBookmark = (articleId: number) => {
    profileStorage.toggleBookmark(articleId);
    setBookmarks(profileStorage.getBookmarks());
  };

  const handleToggleLike = (articleId: number) => {
    profileStorage.toggleLike(articleId);
    setLikes(profileStorage.getLikes());
  };

  const handleToggleFollow = (authorId: number) => {
    profileStorage.toggleFollowAuthor(authorId);
    setAuthors(profileStorage.getTrackedAuthors());
  };

  // Filtered bookmarked articles
  const bookmarkedArticles = useMemo(() => {
    const bookmarkIds = new Set(bookmarks.map((b) => b.articleId));
    return articles
      .filter((a) => bookmarkIds.has(a.id))
      .map((a) => {
        const record = bookmarks.find((b) => b.articleId === a.id);
        return {
          ...a,
          savedAt: record?.savedAt || 'Сохранено',
          category: record?.category || 'Дизайн',
        };
      })
      .filter((a) => categoryFilter === 'all' || a.category === categoryFilter);
  }, [articles, bookmarks, categoryFilter]);

  // Liked articles
  const likedArticles = useMemo(() => {
    const likeIds = new Set(likes);
    return articles.filter((a) => likeIds.has(a.id));
  }, [articles, likes]);

  // User's own articles (if author)
  const myArticles = useMemo(() => {
    if (!user) return [];
    return articles.filter((a) => a.authorAccountId === user.accountId);
  }, [articles, user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Profile Header Card */}
      <section className="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left: Avatar + Details */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with Camera badge */}
            <div className="relative group shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-surface-container border border-outline-variant shadow-sm"
              />
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors"
                title="Сменить фото профиля"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Meta & Bio */}
            <div className="space-y-3 max-w-xl">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                    {profile.firstName || profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`.trim()
                      : profile.displayName || profile.username}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {profile.role === 'ADMIN'
                      ? 'Администратор'
                      : profile.role === 'EDITOR'
                      ? 'Редактор'
                      : profile.role === 'AUTHOR'
                      ? 'Автор & Контрибьютор'
                      : 'Читатель'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-secondary mt-0.5">
                  @{profile.username}
                </p>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                {profile.bio || 'Краткое описание профиля не заполнено.'}
              </p>

              {/* Stats Line */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-on-surface">{bookmarks.length}</span>
                  <span>закладок</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-on-surface">{likes.length}</span>
                  <span>понравилось</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-on-surface">
                    {authors.filter((a) => a.isFollowed).length}
                  </span>
                  <span>подписок</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Редактировать профиль</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="px-2.5"
              title="Поделиться профилем"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <nav aria-label="Разделы кабинета" className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('bookmarks')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Закладки</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'bookmarks' ? 'bg-surface/20 text-on-primary' : 'bg-surface-container text-on-surface'
            }`}
          >
            {bookmarks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('likes')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'likes'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Понравилось</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'likes' ? 'bg-surface/20 text-on-primary' : 'bg-surface-container text-on-surface'
            }`}
          >
            {likes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('authors')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'authors'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Отслеживаемые авторы</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'authors' ? 'bg-surface/20 text-on-primary' : 'bg-surface-container text-on-surface'
            }`}
          >
            {authors.filter((a) => a.isFollowed).length}
          </span>
        </button>

        {myArticles.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('my-articles')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'my-articles'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Мои публикации</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'my-articles' ? 'bg-surface/20 text-on-primary' : 'bg-surface-container text-on-surface'
              }`}
            >
              {myArticles.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>История чтения</span>
        </button>
      </nav>

      {/* 3. Main Content Layout (8 Cols Feed + 4 Cols Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {/* TAB: Bookmarks */}
          {activeTab === 'bookmarks' && (
            <>
              {/* Category Pill Filters */}
              <div className="flex items-center justify-between gap-4 bg-surface p-2.5 rounded-xl border border-outline-variant">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'Дизайн', 'Технологии', 'Культура'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        categoryFilter === cat
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {cat === 'all' ? 'Все' : cat}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-secondary shrink-0 font-medium px-2">
                  {bookmarkedArticles.length} сохр.
                </span>
              </div>

              {/* Bookmarks List */}
              {isLoadingArticles ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-surface rounded-xl p-6 border border-outline-variant animate-pulse h-40"
                    />
                  ))}
                </div>
              ) : bookmarkedArticles.length === 0 ? (
                <div className="bg-surface rounded-xl p-10 border border-outline-variant text-center space-y-3">
                  <Bookmark className="w-8 h-8 text-secondary/60 mx-auto" />
                  <h3 className="text-base font-bold text-on-surface">Нет сохраненных закладок</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Добавляйте понравившиеся материалы в закладки в каталоге или во время чтения статей.
                  </p>
                  <Link to="/">
                    <Button variant="outline" size="sm" className="mt-2 text-xs">
                      Перейти в каталог
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookmarkedArticles.map((art) => {
                    const stats = calculateReadingTime(art.content);
                    const excerpt = art.content
                      .replace(/^#+\s+/gm, '')
                      .replace(/`{1,3}[^`]*`{1,3}/g, '')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .slice(0, 150) + '…';

                    return (
                      <article
                        key={art.id}
                        className="group bg-surface rounded-xl p-5 border border-outline-variant hover:border-outline hover:bg-surface-container-low/40 transition-all shadow-sm flex flex-col sm:flex-row gap-5 items-start justify-between"
                      >
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-secondary">
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium text-[11px]">
                              {art.category}
                            </span>
                            <span>•</span>
                            <span>{art.savedAt}</span>
                          </div>

                          <h2 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                            <Link to={`/article/${art.id}`}>{art.title}</Link>
                          </h2>

                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                            {excerpt}
                          </p>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-xs text-secondary">
                              <span className="font-semibold text-on-surface">
                                {art.authorDisplayName || 'Автор'}
                              </span>
                              <span>•</span>
                              <span>{stats.text}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleBookmark(art.id)}
                              className="text-secondary hover:text-error transition-colors p-1.5 rounded-full hover:bg-surface-container"
                              title="Удалить из закладок"
                            >
                              <BookmarkCheck className="w-4 h-4 text-primary group-hover:text-error" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Tip Box */}
              <div className="bg-surface-container-low rounded-xl p-5 flex items-start gap-4 text-on-surface-variant border border-outline-variant/60">
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0 shadow-sm text-secondary">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-on-surface">Совет по сохранению</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Нажимайте на значок закладки в любой статье во время чтения, чтобы добавить её в
                    персональный список. Статьи доступны для быстрого возврата в любой момент.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* TAB: Likes */}
          {activeTab === 'likes' && (
            <div className="space-y-4">
              {likedArticles.length === 0 ? (
                <div className="bg-surface rounded-xl p-10 border border-outline-variant text-center space-y-3">
                  <Heart className="w-8 h-8 text-secondary/60 mx-auto" />
                  <h3 className="text-base font-bold text-on-surface">Нет понравившихся статей</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Отмечайте статьи лайками, чтобы сформировать персональную подборку.
                  </p>
                </div>
              ) : (
                likedArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-surface rounded-xl p-5 border border-outline-variant hover:border-outline transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-bold text-on-surface hover:text-primary truncate">
                        <Link to={`/article/${art.id}`}>{art.title}</Link>
                      </h3>
                      <div className="text-xs text-secondary">{art.authorDisplayName || 'Автор'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleLike(art.id)}
                      className="p-2 rounded-full text-error hover:bg-error/10 transition-colors shrink-0"
                      title="Убрать лайк"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB: Authors */}
          {activeTab === 'authors' && (
            <div className="space-y-3">
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="bg-surface rounded-xl p-4 sm:p-5 border border-outline-variant flex items-center justify-between gap-4 hover:border-outline transition-colors"
                >
                  <Link
                    to={`/user/${author.id}`}
                    className="flex items-center gap-3.5 min-w-0 group hover:opacity-90 transition-opacity"
                    title={`Перейти на страницу автора ${author.name}`}
                  >
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-11 h-11 rounded-full object-cover bg-surface-container shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {author.name}
                      </h4>
                      <p className="text-xs text-secondary truncate">{author.specialty}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/user/${author.id}`}>
                      <Button variant="outline" size="sm" className="text-xs hidden sm:inline-flex">
                        Статьи
                      </Button>
                    </Link>
                    <Button
                      variant={author.isFollowed ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleFollow(author.id)}
                      className="text-xs"
                    >
                      {author.isFollowed ? 'Вы подписаны' : 'Подписаться'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: My Articles */}
          {activeTab === 'my-articles' && (
            <div className="space-y-4">
              {myArticles.length === 0 ? (
                <div className="bg-surface rounded-xl p-10 border border-outline-variant text-center space-y-3">
                  <PenSquare className="w-8 h-8 text-secondary/60 mx-auto" />
                  <h3 className="text-base font-bold text-on-surface">У вас пока нет публикаций</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Напишите свою первую статью и опубликуйте её в независимом журнале Editorial.
                  </p>
                  <Link to="/editor">
                    <Button size="sm" className="mt-2 text-xs">
                      Написать статью
                    </Button>
                  </Link>
                </div>
              ) : (
                myArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-surface rounded-xl p-5 border border-outline-variant flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-bold text-on-surface hover:text-primary truncate">
                        <Link to={`/article/${art.id}`}>{art.title}</Link>
                      </h3>
                      <div className="text-xs text-secondary font-medium text-emerald-700">Опубликовано</div>
                    </div>
                    <Link to={`/editor/${art.id}`}>
                      <Button variant="outline" size="sm" className="text-xs shrink-0 gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        Изменить
                      </Button>
                    </Link>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB: History */}
          {activeTab === 'history' && (
            <div className="bg-surface rounded-xl p-8 border border-outline-variant text-center space-y-2">
              <History className="w-7 h-7 text-secondary/60 mx-auto" />
              <h3 className="text-sm font-bold text-on-surface">История чтения активна</h3>
              <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
                Здесь будут сохраняться статьи, которые вы недавно открывали для чтения.
              </p>
            </div>
          )}
        </main>

        {/* Right Sidebar (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Tracked Authors Widget */}
          <section className="bg-surface rounded-xl p-5 sm:p-6 border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Отслеживаемые авторы</h3>
              <button
                type="button"
                onClick={() => setActiveTab('authors')}
                className="text-xs text-secondary hover:text-on-surface transition-colors font-medium"
              >
                Все {authors.length}
              </button>
            </div>
            <div className="space-y-3.5">
              {authors.slice(0, 3).map((author) => (
                <div key={author.id} className="flex items-center justify-between gap-3">
                  <Link
                    to={`/user/${author.id}`}
                    className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity group"
                    title={`Страница автора ${author.name}`}
                  >
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-9 h-9 rounded-full object-cover bg-surface-container shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                        {author.name}
                      </div>
                      <div className="text-[11px] text-secondary truncate">{author.specialty}</div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(author.id)}
                    className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold whitespace-nowrap transition-colors"
                  >
                    {author.isFollowed ? 'Подписка' : '+ Читать'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations Widget */}
          <section className="bg-surface rounded-xl p-5 sm:p-6 border border-outline-variant shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Рекомендации для вас</h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              На основе ваших сохраненных закладок и интересов:
            </p>
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                  Типографика
                </span>
                <h4 className="text-xs font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer">
                  Анатомия швейцарской сетки: почему правила Брокманна работают спустя 60 лет
                </h4>
                <div className="text-[11px] text-secondary">5 мин чтения</div>
              </div>
              <div className="h-px bg-outline-variant/60 w-full" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                  Книжный дизайн
                </span>
                <h4 className="text-xs font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer">
                  Голос бумаги: гид по выбору микрофактур для независимых публикаций
                </h4>
                <div className="text-[11px] text-secondary">9 мин чтения</div>
              </div>
            </div>
          </section>

          {/* Profile & Privacy Settings */}
          <section className="bg-surface-container-low/70 rounded-xl p-5 border border-outline-variant/60 space-y-3">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Настройки профиля
            </h3>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={() => alert('Настройки уведомлений будут доступны в следующем релизе')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-secondary" />
                    <span>Уведомления и рассылки</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert('Настройки безопасности пароля будут доступны в следующем релизе')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-secondary" />
                    <span>Пароль и безопасность</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert('Настройки приватности будут доступны в следующем релизе')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <EyeOff className="w-4 h-4 text-secondary" />
                    <span>Приватность профиля</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                </button>
              </li>
            </ul>

            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-secondary">
              <span>Аккаунт Editorial Pro</span>
              <span className="text-primary font-medium hover:underline cursor-pointer">
                Управление
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
