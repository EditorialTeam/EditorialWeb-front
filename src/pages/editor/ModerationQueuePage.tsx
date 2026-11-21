import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/core/auth/AuthContext';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { calculateReadingTime } from '@/core/utils/readingTime';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User as UserIcon,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const ModerationQueuePage: React.FC = () => {
  const { canModerate } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal
  const [previewArticle, setPreviewArticle] = useState<ArticleResponse | null>(null);

  // Moderation Reject Modal
  const [rejectTarget, setRejectTarget] = useState<ArticleResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await articlesApi.getAll('review');
      setArticles(data || []);
    } catch (err: any) {
      console.error('Failed to load moderation queue:', err);
      setError(err.message || 'Не удалось загрузить очередь модерации');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canModerate) {
      navigate('/');
      return;
    }
    loadQueue();
  }, [canModerate, navigate, loadQueue]);

  const handleApprove = async (articleId: number) => {
    setIsSubmittingDecision(true);
    try {
      await articlesApi.moderate(articleId, 'APPROVED');
      if (previewArticle?.id === articleId) setPreviewArticle(null);
      await loadQueue();
    } catch (err: any) {
      alert(`Ошибка одобрения: ${err.message || err}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setIsSubmittingDecision(true);
    try {
      await articlesApi.moderate(
        rejectTarget.id,
        'REJECTED',
        rejectionReason.trim() || undefined
      );
      setRejectTarget(null);
      setRejectionReason('');
      if (previewArticle?.id === rejectTarget.id) setPreviewArticle(null);
      await loadQueue();
    } catch (err: any) {
      alert(`Ошибка отклонения статьи: ${err.message || err}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary">
              Редакционный цикл
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700">
              Очередь: {articles.length}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Редакторская панель
          </h1>
          <p className="text-sm text-secondary mt-1">
            Проверка поступающих материалов, вычитка и публикация независимых авторов.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadQueue} disabled={isLoading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить очередь
        </Button>
      </div>

      {/* Queue items */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-secondary animate-pulse">
          Загрузка очереди модерации...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-error/10 border border-error/20 text-error text-center text-sm">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-outline-variant bg-surface space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-on-surface">Очередь модерации чиста</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Все присланные материалы проверены. Новые статьи появятся здесь после отправки авторами на рецензию.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const readingStats = calculateReadingTime(article.content || '');

            return (
              <div
                key={article.id}
                className="bg-surface border border-outline-variant hover:border-outline rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                      <span className="font-mono font-bold text-primary">#{article.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-on-surface">
                        <UserIcon className="w-3.5 h-3.5 text-secondary" />
                        {article.authorDisplayName || `Автор #${article.authorAccountId}`}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {readingStats.text} ({readingStats.wordCount} слов)
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-on-surface tracking-tight">
                      {article.title}
                    </h2>

                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                      {article.content.replace(/[#*`_>]/g, '').slice(0, 220)}...
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewArticle(article)}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Читать текст
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectTarget(article);
                        setRejectionReason('');
                      }}
                      className="text-error hover:bg-error/5 hover:border-error/40"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Отклонить
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleApprove(article.id)}
                      disabled={isSubmittingDecision}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Одобрить
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Preview Modal */}
      {previewArticle && (
        <Modal
          isOpen={Boolean(previewArticle)}
          onClose={() => setPreviewArticle(null)}
          title={`Просмотр: ${previewArticle.title}`}
          maxWidth="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant text-xs text-secondary">
              <div>
                Автор: <strong>{previewArticle.authorDisplayName || `ID ${previewArticle.authorAccountId}`}</strong>
              </div>
              <Link
                to={`/article/${previewArticle.id}`}
                target="_blank"
                className="text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                Открыть на отдельной странице
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="markdown-body text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewArticle.content}
              </ReactMarkdown>
            </div>

            {/* Sticky Actions in Modal */}
            <div className="pt-4 border-t border-outline-variant flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewArticle(null)}
              >
                Закрыть
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectTarget(previewArticle);
                    setRejectionReason('');
                  }}
                  className="text-error hover:border-error"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Отклонить
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(previewArticle.id)}
                  disabled={isSubmittingDecision}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Одобрить и опубликовать
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectTarget && (
        <Modal
          isOpen={Boolean(rejectTarget)}
          onClose={() => setRejectTarget(null)}
          title="Отклонение публикации"
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Укажите причину или замечания для автора статьи «<strong>{rejectTarget.title}</strong>». Автор увидит ваш комментарий в авторской панели и сможет внести правки.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="block text-xs font-semibold text-on-surface">
                Замечания редактора (rejectionReason)
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Например: Пожалуйста, проверьте ссылки на источники и расширьте раздел с выводами..."
                rows={4}
                maxLength={1000}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-outline/70 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={isSubmittingDecision}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingDecision}
                className="bg-error hover:bg-error-hover text-white"
              >
                {isSubmittingDecision ? 'Отклонение...' : 'Отклонить публикацию'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
