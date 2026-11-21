import React, { useState, useEffect, useCallback } from 'react';
import { CommentResponse } from '@/core/api/types';
import { commentsApi } from '@/core/api/commentsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Send, X, Lock, RefreshCw } from 'lucide-react';

interface CommentsSectionProps {
  articleId: number;
  articleAuthorId: number;
  isPublished: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  articleId,
  articleAuthorId,
  isPublished,
}) => {
  const { canWrite, isAuthenticated } = useAuth();

  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New comment input state
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ parentId: number; authorName: string } | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);

  const loadRootComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commentsApi.getRootComments(articleId, 0, 50);
      const items = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
        ? (data as unknown as CommentResponse[])
        : [];
      setComments(items);
      setTotalElements(typeof data?.totalElements === 'number' ? data.totalElements : items.length);
    } catch (err: any) {
      console.warn('Failed to load comments:', err);
      setError(err.message || 'Не удалось загрузить комментарии');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRootComments();
    } else {
      setIsLoading(false);
    }
  }, [loadRootComments, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (newContent.length > 5000) {
      setFormError('Комментарий не должен превышать 5000 символов');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await commentsApi.create(articleId, {
        content: newContent.trim(),
        parentId: replyTarget ? replyTarget.parentId : null,
      });

      setNewContent('');
      setReplyTarget(null);
      await loadRootComments();
    } catch (err: any) {
      if (err.code === 'INCORRECT_ARTICLE_STATUS') {
        setFormError('Комментарии можно оставлять только к опубликованным статьям.');
      } else if (err.code === 'NOT_ENOUGH_RIGHTS') {
        setFormError('У вас недостаточно прав для публикации комментариев.');
      } else {
        setFormError(err.message || 'Ошибка отправки комментария');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: number, authorName: string) => {
    setReplyTarget({ parentId, authorName });
    // Scroll to form smoothly
    const formEl = document.getElementById('comment-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="mt-12 pt-8 border-t border-outline-variant space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-on-surface tracking-tight">Комментарии</h3>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-surface-container font-mono font-bold text-secondary">
            {totalElements}
          </span>
        </div>

        <button
          type="button"
          onClick={loadRootComments}
          className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1"
          title="Обновить комментарии"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>

      {/* Comment Form or Permission Banner */}
      {!isAuthenticated ? (
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-center text-xs text-secondary">
          Пожалуйста, войдите в систему, чтобы просматривать и оставлять комментарии.
        </div>
      ) : !isPublished ? (
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-secondary flex items-center gap-2">
          <Lock className="w-4 h-4 text-secondary shrink-0" />
          <span>
            Обсуждение откроется после того, как редакция проверит и опубликует эту статью.
          </span>
        </div>
      ) : !canWrite ? (
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-secondary flex items-center gap-2">
          <Lock className="w-4 h-4 text-secondary shrink-0" />
          <span>
            Комментирование доступно авторам, редакторам и администраторам платформы.
          </span>
        </div>
      ) : (
        <form id="comment-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Reply indicator banner */}
          {replyTarget && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
              <span>Ответ пользователю: <strong>{replyTarget.authorName}</strong></span>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="hover:text-primary-hover p-0.5"
                title="Отменить ответ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={
                replyTarget
                  ? `Ваш ответ для ${replyTarget.authorName}...`
                  : 'Поделитесь своими мыслями или задайте вопрос автору...'
              }
              rows={3}
              maxLength={5000}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors leading-relaxed"
            />
            <div className="text-[10px] text-secondary font-mono text-right pr-1">
              {newContent.length} / 5000
            </div>
          </div>

          {formError && <div className="text-xs text-error">{formError}</div>}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-secondary">
              Поддерживается Markdown и вежливая дискуссия
            </span>
            <Button type="submit" size="sm" disabled={isSubmitting || !newContent.trim()}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? 'Отправка...' : replyTarget ? 'Ответить' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="pt-4 space-y-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-secondary animate-pulse">
            Загрузка комментариев...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-xs text-error">{error}</div>
        ) : !Array.isArray(comments) || comments.length === 0 ? (
          <div className="py-10 text-center text-xs text-secondary">
            Комментариев пока нет. Будьте первым, кто выскажет своё мнение!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              articleAuthorId={articleAuthorId}
              isPublished={isPublished}
              onReply={handleReply}
              onRefresh={loadRootComments}
            />
          ))
        )}
      </div>
    </section>
  );
};
