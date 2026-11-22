import { FormEvent, useEffect, useRef, useState } from 'react';
import { CommentResponse } from '@/core/api/types';
import { commentsApi } from '@/core/api/commentsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentComposer } from './CommentComposer';
import { Reply, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  comment: CommentResponse;
  articleId: number;
  articleAuthorId: number;
  isPublished: boolean;
  onRefresh: () => void;
  depth?: number;
}

export function CommentItem({ comment, articleId, articleAuthorId, isPublished, onRefresh, depth = 0 }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replies, setReplies] = useState<CommentResponse[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const replyButton = useRef<HTMLButtonElement>(null);
  const own = user?.accountId === comment.authorAccountId;
  const name = comment.authorDisplayName || `Пользователь №${comment.authorAccountId}`;
  const canDelete = user?.role === 'ADMIN' || (user?.role === 'AUTHOR' && user.accountId === articleAuthorId) || ((user?.role === 'USER' || user?.role === 'EDITOR') && own);
  const canReply = isAuthenticated && isPublished && !comment.deleted;

  useEffect(() => { if (!editing) setEditContent(comment.content); }, [comment.content, editing]);
  useEffect(() => {
    if (!expanded) return;
    let active = true;
    setLoadingReplies(true); setReplyError(null);
    commentsApi.getAllReplies(articleId, comment.id)
      .then(items => { if (active) setReplies(items); })
      .catch((err: Error) => { if (active) setReplyError(err.message); })
      .finally(() => { if (active) setLoadingReplies(false); });
    return () => { active = false; };
  }, [articleId, comment, expanded, revision]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !editContent.trim()) return;
    setSaving(true); setError(null);
    try { await commentsApi.edit(articleId, comment.id, { content: editContent.trim() }); setEditing(false); onRefresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setDeleting(true); setError(null);
    try { await commentsApi.delete(articleId, comment.id); setDeleteOpen(false); setReplyOpen(false); onRefresh(); }
    catch (err) { setError((err as Error).message); setDeleteOpen(false); }
    finally { setDeleting(false); }
  };
  const closeReply = () => { setReplyOpen(false); replyButton.current?.focus({ preventScroll: true }); };
  const reply = async (content: string) => {
    if (!canReply) throw new Error('Ответить на этот комментарий сейчас нельзя.');
    const created = await commentsApi.create(articleId, { content, parentId: comment.id });
    setReplies(current => [created, ...current.filter(item => item.id !== created.id)]);
    setExpanded(true);
    setRevision(value => value + 1);
    closeReply();
  };
  const date = new Date(comment.createdAt);
  const dateLabel = Number.isFinite(date.getTime()) ? date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <article className={`comment-item ${depth === 0 ? 'comment-item--root' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
        <span className="font-semibold text-on-surface">{name}</span>
        {comment.authorAccountId === articleAuthorId && <span>Автор статьи</span>}
        {dateLabel && <time dateTime={comment.createdAt}>{dateLabel}</time>}
        {comment.updatedAt && !comment.deleted && <span>изменено</span>}
      </div>
      {editing ? <form onSubmit={save} className="space-y-3 mt-3"><label className="sr-only" htmlFor={`edit-comment-${comment.id}`}>Изменить комментарий</label><textarea id={`edit-comment-${comment.id}`} value={editContent} disabled={saving} onChange={event => setEditContent(event.target.value)} required maxLength={5000} rows={3} className="comment-composer__input" /><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>Отмена</Button><Button type="submit" size="sm" isLoading={saving} disabled={!editContent.trim()}>Сохранить</Button></div></form>
        : <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${comment.deleted ? 'text-secondary italic' : 'text-on-surface'}`}>{comment.deleted ? 'Комментарий удалён' : comment.content}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
      <div className="comment-actions">
        {canReply && <button ref={replyButton} type="button" aria-expanded={replyOpen} aria-controls={`reply-to-${comment.id}`} onClick={() => { if (replyOpen) closeReply(); else setReplyOpen(true); }}><Reply className="w-3.5 h-3.5" />Ответить</button>}
        {!comment.deleted && own && !editing && <button type="button" onClick={() => { setError(null); setEditing(true); }}><Edit2 className="w-3.5 h-3.5" />Изменить</button>}
        {!comment.deleted && canDelete && <button type="button" disabled={deleting} onClick={() => setDeleteOpen(true)}><Trash2 className="w-3.5 h-3.5" />Удалить</button>}
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}{expanded ? 'Скрыть ответы' : replies.length ? `Ответы (${replies.length})` : 'Ответы'}</button>
      </div>
      {replyOpen && canReply && <div id={`reply-to-${comment.id}`} className="mt-4"><CommentComposer label={`Ответ пользователю ${name}`} submitLabel="Ответить" onSubmit={reply} onCancel={closeReply} focusOnMount /></div>}
      {expanded && <div className={`comment-thread ${depth < 3 ? 'comment-thread--indented' : ''}`} aria-busy={loadingReplies}>
        {loadingReplies && !replies.length && <p className="text-sm text-secondary">Загрузка ответов…</p>}
        {replyError && <div className="space-y-2"><p role="alert" className="text-sm text-error">{replyError}</p><Button variant="ghost" size="sm" onClick={() => setRevision(value => value + 1)}>Повторить</Button></div>}
        {!loadingReplies && !replyError && !replies.length && <p className="text-sm text-secondary">Ответов пока нет.</p>}
        {replies.map(item => <CommentItem key={item.id} comment={item} articleId={articleId} articleAuthorId={articleAuthorId} isPublished={isPublished} depth={depth + 1} onRefresh={() => { setRevision(value => value + 1); onRefresh(); }} />)}
      </div>}
      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={remove} isLoading={deleting} title="Удалить комментарий?" description="Текст будет заменён отметкой об удалении. Ответы сохранятся." confirmLabel="Удалить" />
    </article>
  );
}
