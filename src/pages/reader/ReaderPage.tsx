import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { articlePermissions, articleStatusLabels } from '@/core/api/articlePermissions';
import { useAuth } from '@/core/auth/AuthContext';
import { calculateReadingTime } from '@/core/utils/readingTime';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft,
  PenSquare,
  Trash2,
  Clock,
  User as UserIcon,
  RefreshCw,
  Share2,
  Check,
} from 'lucide-react';

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isMockMode } = useAuth();

  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reader tools
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0); // -2 to +4 px
  const [isCopied, setIsCopied] = useState(false);

  // Deletion modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const articleId = id ? parseInt(id, 10) : NaN;

  useEffect(() => {
    let cancelled = false;
    if (isNaN(articleId)) {
      setError('Некорректный ID статьи');
      setIsLoading(false);
      return;
    }

    const loadArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await articlesApi.getById(articleId);
        if (!cancelled) setArticle(data);
      } catch (err: any) {
        console.error('Failed to load article:', err);
        if (!cancelled) setError(err.message || 'Статья не найдена');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadArticle();
    return () => { cancelled = true; };
  }, [articleId, isMockMode, user?.accountId]);

  const handleDelete = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await articlesApi.delete(article.id);
      setIsDeleteOpen(false);
      navigate('/');
    } catch (err: any) {
      alert(`Ошибка при удалении статьи: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const permissions = article ? articlePermissions(article, user) : null;
  const handleAction = async (action: 'submit' | 'archive' | 'withdraw-from-review' | 'APPROVED' | 'REJECTED') => {
    if (!article) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      if (action === 'APPROVED' || action === 'REJECTED') {
        await articlesApi.moderate(article.id, action, rejectionReason.trim() || undefined);
        navigate('/?view=review');
      } else {
        await articlesApi.transition(article.id, action);
        navigate(user?.accountId === article.authorAccountId ? '/?view=my' : '/');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось изменить статус статьи');
    } finally {
      setIsUpdating(false);
    }
  };

  const readingStats = calculateReadingTime(article?.content || '');

  if (isLoading) {
    return (
      <div className="max-w-[720px] mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-4 bg-surface-container rounded w-24" />
        <div className="h-10 bg-surface-container rounded w-4/5" />
        <div className="h-6 bg-surface-container rounded w-1/3" />
        <div className="pt-8 space-y-4">
          <div className="h-4 bg-surface-container rounded w-full" />
          <div className="h-4 bg-surface-container rounded w-full" />
          <div className="h-4 bg-surface-container rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-[720px] mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-on-surface">Материал недоступен</h2>
        <p className="text-sm text-secondary">{error || 'Статья не найдена или была удалена'}</p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              В каталог
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Обновить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="max-w-[720px] mx-auto mb-8 flex items-center justify-between gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-secondary hover:text-on-surface -ml-2">
            <ArrowLeft className="w-4 h-4" />
            В каталог
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {/* Font Resizer */}
          <div className="hidden sm:flex items-center gap-1 bg-surface border border-outline-variant rounded-xl p-1 text-xs text-secondary">
            <button
              onClick={() => setFontSizeOffset((v) => Math.max(-2, v - 1))}
              disabled={fontSizeOffset <= -2}
              className="px-2 py-0.5 rounded hover:bg-surface-container disabled:opacity-30"
              title="Уменьшить шрифт"
            >
              А−
            </button>
            <span className="px-1 text-[11px] font-mono select-none">
              {18 + fontSizeOffset}px
            </span>
            <button
              onClick={() => setFontSizeOffset((v) => Math.min(4, v + 1))}
              disabled={fontSizeOffset >= 4}
              className="px-2 py-0.5 rounded hover:bg-surface-container disabled:opacity-30"
              title="Увеличить шрифт"
            >
              А+
            </button>
          </div>

          {/* Share */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs gap-1.5"
            title="Скопировать ссылку на публикацию"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Скопировано' : 'Поделиться'}</span>
          </Button>

          {/* Actions for Author / Editor / Admin */}
          {(permissions?.edit || permissions?.delete) && (
            <>
              {permissions.edit && <Link to={`/editor/${article.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <PenSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Изменить</span>
                </Button>
              </Link>}
              {permissions.delete && <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="text-xs text-error hover:text-error hover:bg-error/10"
                title="Удалить публикацию"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>}
            </>
          )}
        </div>
      </div>

      {/* Reader Column: strictly 720px max width as requested by DESIGN.md */}
      <article className="max-w-[720px] mx-auto pb-24">
        {actionError && <div role="alert" className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">{actionError}</div>}
        <div className="flex flex-wrap gap-2 mb-4">
          {permissions?.submit && <Button size="sm" disabled={isUpdating} onClick={() => handleAction('submit')}>Отправить на проверку</Button>}
          {permissions?.archive && <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleAction('archive')}>В архив</Button>}
          {permissions?.withdraw && <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleAction('withdraw-from-review')}>Вернуть в черновики</Button>}
        </div>
        {permissions?.moderate && <div className="mb-6 p-4 rounded-xl border border-outline-variant bg-surface space-y-3">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="rejection-reason">Комментарий при отклонении (необязательно)</label>
          <textarea id="rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full p-3 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface" />
          <div className="flex gap-2">
            <Button size="sm" disabled={isUpdating} onClick={() => handleAction('APPROVED')}>Опубликовать</Button>
            <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleAction('REJECTED')}>Отклонить</Button>
          </div>
        </div>}
        {/* Publication Meta Header */}
        <div className="pb-8 border-b border-outline-variant space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Публикация #{article.id}
            </Badge>
            {article.status && <Badge variant="outline">{articleStatusLabels[article.status]}</Badge>}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-on-surface tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          {/* Byline strip */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary pt-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-primary">
                A
              </span>
              <span className="font-medium text-on-surface">{article.authorDisplayName || `Автор #${article.authorAccountId}`}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{readingStats.text}</span>
            </div>
            <span>•</span>
            <span className="font-mono text-xs text-secondary/70">
              {readingStats.wordCount} слов
            </span>
          </div>
        </div>

        {/* Article Body with Markdown Rendering */}
        <div
          className="markdown-body pt-8"
          style={{ fontSize: `${18 + fontSizeOffset}px` }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Footer info strip */}
        <div className="mt-16 pt-8 border-t border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-secondary">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-secondary" />
            <span>{article.status === 'PUBLISHED' ? 'Материал проверен редакцией Editorial' : 'Материал ещё не опубликован'}</span>
          </div>
          <Link to="/" className="text-primary hover:underline font-semibold">
            ← Вернуться ко всем статьям
          </Link>
        </div>
      </article>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Удаление публикации"
        description={`Вы уверены, что хотите удалить публикацию «${article.title}»? Это действие необратимо.`}
        confirmLabel="Удалить публикацию"
        isLoading={isDeleting}
      />
    </div>
  );
};
