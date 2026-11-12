import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { useAuth } from '@/core/auth/AuthContext';
import { ArticleCard } from './ArticleCard';
import { Button } from '@/components/ui/Button';
import {
  Search,
  PenSquare,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
  X,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { canWrite, isMockMode } = useAuth();

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Pagination (prepared for server pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await articlesApi.getAll();
      setArticles(data || []);
    } catch (err: any) {
      console.error('Failed to load articles:', err);
      setError(err.message || 'Не удалось загрузить список статей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [isMockMode]);

  // Unique authors for filter dropdown
  const authorOptions = useMemo(() => {
    const ids = Array.from(new Set(articles.map((a) => a.authorAccountId))).sort(
      (a, b) => a - b
    );
    return ids;
  }, [articles]);

  // Filter & sort logic
  const filteredArticles = useMemo(() => {
    return articles
      .filter((article) => {
        const matchesQuery =
          !searchQuery.trim() ||
          article.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          String(article.id) === searchQuery.trim();

        const matchesAuthor =
          selectedAuthor === 'all' || String(article.authorAccountId) === selectedAuthor;

        return matchesQuery && matchesAuthor;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'oldest') return a.id - b.id;
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'ru');
        return 0;
      });
  }, [articles, searchQuery, selectedAuthor, sortBy]);

  // Client pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  // Reset to first page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAuthor, sortBy]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="border-b border-outline-variant pb-8 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Каталог публикаций
            </h1>
            <p className="text-secondary text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Независимые материалы, архитектурные обзоры и статьи. Читайте или делитесь своими мыслями.
            </p>
          </div>

          {canWrite && (
            <Link to="/editor">
              <Button size="md" className="shrink-0 gap-2">
                <PenSquare className="w-4 h-4" />
                Новая статья
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="relative sm:col-span-6 lg:col-span-7">
            <Search className="w-4 h-4 text-on-surface-variant/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, тексту или ID..."
              className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Author Filter */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="all">Все авторы</option>
              {authorOptions.map((id) => {
                const authorArticle = articles.find((a) => a.authorAccountId === id);
                const name = authorArticle?.authorDisplayName || `Автор #${id}`;
                return (
                  <option key={id} value={String(id)}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-3 lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="title">По названию</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface border border-outline-variant rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-surface-container rounded w-1/3" />
                <div className="h-6 bg-surface-container rounded w-3/4" />
                <div className="h-4 bg-surface-container rounded w-full" />
                <div className="h-4 bg-surface-container rounded w-2/3" />
              </div>
              <div className="h-4 bg-surface-container rounded w-1/4 pt-4 border-t border-outline-variant" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-surface border border-error/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
          <p className="text-sm text-error font-medium mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadArticles} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Повторить попытку
          </Button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-secondary">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">Статьи не найдены</h3>
          <p className="text-sm text-secondary leading-relaxed">
            {searchQuery || selectedAuthor !== 'all'
              ? 'По заданным параметрам поиска ничего не нашлось. Попробуйте сбросить фильтры.'
              : 'В редакции пока нет опубликованных статей.'}
          </p>
          {(searchQuery || selectedAuthor !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedAuthor('all');
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Active summary */}
          <div className="flex items-center justify-between text-xs text-secondary font-medium">
            <span>
              Найдено статей: <strong className="text-on-surface">{filteredArticles.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Сортировка: {sortBy === 'newest' ? 'новые' : sortBy === 'oldest' ? 'старые' : 'по алфавиту'}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-outline-variant">
              <div className="text-xs text-secondary">
                Страница <strong className="text-on-surface">{currentPage}</strong> из{' '}
                <strong className="text-on-surface">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1 px-2.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Назад</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-on-primary'
                          : 'text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1 px-2.5"
                >
                  <span className="hidden sm:inline">Вперед</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
