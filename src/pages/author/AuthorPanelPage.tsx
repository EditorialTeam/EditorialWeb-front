import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { articleStatusLabels } from '@/core/api/articlePermissions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { calculateReadingTime } from '@/core/utils/readingTime';
import {
  PenSquare,
  Clock,
  Send,
  RotateCcw,
  Archive,
  Trash2,
  Eye,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock4,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const AuthorPanelPage: React.FC = () => {
  const { user, canWrite } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Article deletion modal
  const [deleteTarget, setDeleteTarget] = useState<ArticleResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transition in progress
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const loadMyArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await articlesApi.getMy();
      setArticles(data || []);
    } catch (err: any) {
      console.error('Failed to load author articles:', err);
      setError(err.message || 'Не удалось загрузить ваши публикации');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canWrite) {
      navigate('/');
      return;
    }
    loadMyArticles();
  }, [canWrite, navigate, loadMyArticles]);

  const handleAction = async (
    articleId: number,
    action: 'submit' | 'withdraw-from-review' | 'archive'
  ) => {
    setActionInProgressId(articleId);
    try {
      await articlesApi.transition(articleId, action);
      await loadMyArticles();
    } catch (err: any) {
      alert(`Ошибка: ${err.message || err}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await articlesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadMyArticles();
    } catch (err: any) {
      alert(`Ошибка при удалении: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: articles.length,
      draft: articles.filter((a) => a.status === 'DRAFT').length,
      review: articles.filter((a) => a.status === 'PENDING_REVIEW').length,
      published: articles.filter((a) => a.status === 'PUBLISHED').length,
      rejected: articles.filter((a) => a.status === 'REJECTED').length,
      archived: articles.filter((a) => a.status === 'ARCHIVED').length,
    };
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (statusFilter === 'all') return articles;
    return articles.filter((a) => a.status === statusFilter);
  }, [articles, statusFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary">
              Личный кабинет автора
            </span>
            <Badge variant="role">{user?.role}</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Авторская панель
          </h1>
          <p className="text-sm text-secondary mt-1">
            Управление жизненным циклом ваших статей: от черновика до модерации и публикации.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMyArticles} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Link to="/editor">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Новая статья
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Все статьи', count: stats.total, filter: 'all', icon: FileText },
          { label: 'Черновики', count: stats.draft, filter: 'DRAFT', icon: PenSquare },
          { label: 'На проверке', count: stats.review, filter: 'PENDING_REVIEW', icon: Clock4 },
          { label: 'Опубликовано', count: stats.published, filter: 'PUBLISHED', icon: CheckCircle2 },
          { label: 'Отклонено', count: stats.rejected, filter: 'REJECTED', icon: AlertCircle },
          { label: 'В архиве', count: stats.archived, filter: 'ARCHIVED', icon: Archive },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = statusFilter === item.filter;
          return (
            <button
              key={item.filter}
              type="button"
              onClick={() => setStatusFilter(item.filter)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface hover:bg-surface-container border-outline-variant'
              }`}
            >
              <div className="flex items-center justify-between text-secondary mb-2">
                <span className="text-xs font-medium">{item.label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-extrabold text-on-surface font-mono">
                {item.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="py-16 text-center text-secondary text-sm animate-pulse">
          Загрузка ваших публикаций...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-error/10 border border-error/20 text-error text-center text-sm">
          {error}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-outline-variant bg-surface space-y-4">
          <FileText className="w-10 h-10 text-secondary mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-on-surface">Статей не найдено</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              {statusFilter === 'all'
                ? 'Вы еще не создали ни одной статьи. Нажмите «Новая статья», чтобы написать свой первый материал.'
                : `В категории «${statusFilter}» пока нет публикаций.`}
            </p>
          </div>
          {statusFilter === 'all' && (
            <Link to="/editor">
              <Button size="sm">Создать статью</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const readingStats = calculateReadingTime(article.content || '');
            const isProcessing = actionInProgressId === article.id;
            const status = article.status || 'DRAFT';

            return (
              <div
                key={article.id}
                className="bg-surface border border-outline-variant hover:border-outline rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-secondary">#{article.id}</span>
                      <Badge variant="outline">{articleStatusLabels[status] || status}</Badge>
                      <span className="text-secondary text-xs">•</span>
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {readingStats.text}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight hover:text-primary transition-colors">
                      <Link to={`/article/${article.id}`}>{article.title}</Link>
                    </h2>
                  </div>

                  {/* Lifecycle Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* View Link */}
                    <Link to={`/article/${article.id}`}>
                      <Button variant="ghost" size="sm" title="Просмотреть публикацию">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Просмотр
                      </Button>
                    </Link>

                    {/* DRAFT actions */}
                    {status === 'DRAFT' && (
                      <>
                        <Link to={`/editor/${article.id}`}>
                          <Button variant="outline" size="sm">
                            <PenSquare className="w-3.5 h-3.5 mr-1" />
                            Редактировать
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAction(article.id, 'submit')}
                          disabled={isProcessing}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          На проверку
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(article)}
                          className="text-error hover:text-error"
                          title="Удалить черновик"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {/* PENDING_REVIEW actions */}
                    {status === 'PENDING_REVIEW' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(article.id, 'withdraw-from-review')}
                        disabled={isProcessing}
                        title="Отозвать статью в статус черновика для доработки"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Отозвать
                      </Button>
                    )}

                    {/* REJECTED actions */}
                    {status === 'REJECTED' && (
                      <>
                        <Link to={`/editor/${article.id}`}>
                          <Button variant="outline" size="sm">
                            <PenSquare className="w-3.5 h-3.5 mr-1" />
                            Исправить
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAction(article.id, 'submit')}
                          disabled={isProcessing}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          Отправить повторно
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(article)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}

                    {/* PUBLISHED actions */}
                    {status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(article.id, 'archive')}
                        disabled={isProcessing}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        В архив
                      </Button>
                    )}

                    {/* ARCHIVED actions */}
                    {status === 'ARCHIVED' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(article.id, 'submit')}
                          disabled={isProcessing}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          На проверку
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(article)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rejection reason banner */}
                {status === 'REJECTED' && article.rejectionReason && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Замечания редактора:</strong> {article.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удаление публикации"
        description={`Вы уверены, что хотите удалить публикацию «${deleteTarget?.title}»? Это действие необратимо.`}
        confirmLabel="Удалить"
        isLoading={isDeleting}
      />
    </div>
  );
};
