import { useCallback, useEffect, useRef, useState } from 'react';
import { CommentResponse } from '@/core/api/types';
import { commentsApi } from '@/core/api/commentsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { RefreshCw } from 'lucide-react';

interface CommentsSectionProps { articleId: number; articleAuthorId: number; isPublished: boolean }

export function CommentsSection({ articleId, articleAuthorId, isPublished }: CommentsSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadComments = useCallback(async () => {
    const current = ++requestId.current;
    setRefreshing(true);
    setError(null);
    try {
      const items = await commentsApi.getAllRoots(articleId);
      if (current === requestId.current) setComments(items);
    } catch (err) {
      if (current === requestId.current) setError((err as Error).message);
    } finally {
      if (current === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [articleId]);

  useEffect(() => {
    setComments([]);
    setLoading(true);
    if (isAuthenticated) void loadComments();
    else { setLoading(false); setRefreshing(false); }
    return () => { requestId.current++; };
  }, [loadComments, isAuthenticated, user?.accountId]);

  const create = async (content: string) => {
    if (!isAuthenticated || !isPublished) throw new Error('Комментирование сейчас недоступно.');
    const created = await commentsApi.create(articleId, { content, parentId: null });
    requestId.current++;
    setLoading(false); setRefreshing(false);
    setComments(current => [created, ...current.filter(comment => comment.id !== created.id)]);
    void loadComments();
  };

  return (
    <section className="mt-12 pt-8 border-t border-outline-variant space-y-6" aria-label="Комментарии">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Комментарии</h2>
        {isAuthenticated && <button type="button" onClick={() => void loadComments()} disabled={refreshing} aria-label="Обновить комментарии" className="flex items-center gap-2 text-sm text-secondary hover:text-primary disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Обновить</span></button>}
      </div>
      {!isAuthenticated ? <p className="text-sm text-secondary">Войдите, чтобы читать и оставлять комментарии.</p>
        : !isPublished ? <p className="text-sm text-secondary">Комментирование доступно после публикации статьи.</p>
          : <CommentComposer key={`${articleId}-${user?.accountId}`} label="Ваш комментарий" submitLabel="Опубликовать" onSubmit={create} />}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div aria-busy={refreshing}>
        {loading ? <p className="py-6 text-sm text-secondary">Загрузка комментариев…</p>
          : !comments.length && isAuthenticated && !error ? <p className="py-6 text-sm text-secondary">Комментариев пока нет.</p>
            : comments.map(comment => <CommentItem key={comment.id} comment={comment} articleId={articleId} articleAuthorId={articleAuthorId} isPublished={isPublished} onRefresh={() => void loadComments()} />)}
      </div>
    </section>
  );
}
