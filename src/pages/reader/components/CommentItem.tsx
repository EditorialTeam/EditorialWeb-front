import React, { useState } from 'react';
import { CommentResponse } from '@/core/api/types';
import { commentsApi } from '@/core/api/commentsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Reply,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  User as UserIcon,
  Check,
  X,
} from 'lucide-react';

interface CommentItemProps {
  comment: CommentResponse;
  articleId: number;
  articleAuthorId: number;
  isPublished: boolean;
  onReply: (parentId: number, authorName: string) => void;
  onRefresh: () => void;
  isNested?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  articleId,
  articleAuthorId,
  isPublished,
  onReply,
  onRefresh,
  isNested = false,
}) => {
  const { user, canWrite } = useAuth();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replies state
  const [replies, setReplies] = useState<CommentResponse[]>([]);
  const [isRepliesLoaded, setIsRepliesLoaded] = useState(false);
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const isAuthorOfComment = user?.accountId === comment.authorAccountId;
  const isArticleOwner = user?.accountId === articleAuthorId;
  const isAdmin = user?.role === 'ADMIN';
  const isEditor = user?.role === 'EDITOR';

  // Backend rules for deletion:
  // ADMIN: any comment
  // AUTHOR: if owns article
  // EDITOR: if author of comment
  const canDelete =
    isAdmin || (isArticleOwner && user?.role === 'AUTHOR') || (isEditor && isAuthorOfComment);

  const canEdit = isAuthorOfComment && !comment.deleted;
  const canReplyAction = canWrite && isPublished && !comment.deleted;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await commentsApi.edit(articleId, comment.id, { content: editContent.trim() });
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Не удалось обновить комментарий');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await commentsApi.delete(articleId, comment.id);
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Ошибка удаления: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleReplies = async () => {
    if (!areRepliesExpanded && !isRepliesLoaded) {
      setIsLoadingReplies(true);
      try {
        const res = await commentsApi.getReplies(articleId, comment.id);
        const items = Array.isArray(res?.content)
          ? res.content
          : Array.isArray(res)
          ? (res as unknown as CommentResponse[])
          : [];
        setReplies(items);
        setIsRepliesLoaded(true);
      } catch (err) {
        console.error('Failed to load replies:', err);
      } finally {
        setIsLoadingReplies(false);
      }
    }
    setAreRepliesExpanded(!areRepliesExpanded);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`group/comment relative ${isNested ? 'pt-3' : 'pt-4 pb-4 border-b border-outline-variant'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar badge */}
        <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
          {comment.authorDisplayName ? (
            comment.authorDisplayName.charAt(0).toUpperCase()
          ) : (
            <UserIcon className="w-4 h-4 text-secondary" />
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">
                {comment.authorDisplayName || `Пользователь #${comment.authorAccountId}`}
              </span>
              {comment.authorAccountId === articleAuthorId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                  Автор статьи
                </span>
              )}
              <span className="text-secondary text-[11px]">•</span>
              <span className="text-[11px] text-secondary">{formatDate(comment.createdAt)}</span>
              {comment.updatedAt && !comment.deleted && (
                <span className="text-[10px] text-secondary/70 italic">(изменено)</span>
              )}
            </div>

            {/* Quick Actions */}
            {!comment.deleted && (
              <div className="flex items-center gap-1 opacity-80 group-hover/comment:opacity-100 transition-opacity">
                {canReplyAction && !isNested && (
                  <button
                    type="button"
                    onClick={() =>
                      onReply(
                        comment.id,
                        comment.authorDisplayName || `Пользователь #${comment.authorAccountId}`
                      )
                    }
                    className="p-1 text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1 rounded hover:bg-surface-container"
                    title="Ответить на комментарий"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Ответить</span>
                  </button>
                )}

                {canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-xs text-secondary hover:text-primary transition-colors rounded hover:bg-surface-container"
                    title="Редактировать комментарий"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-1 text-xs text-secondary hover:text-error transition-colors rounded hover:bg-surface-container"
                    title="Удалить комментарий"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Comment Text or Inline Edit */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                maxLength={5000}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
              {editError && <div className="text-[11px] text-error">{editError}</div>}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSavingEdit}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Отмена
                </Button>
                <Button type="submit" size="sm" disabled={isSavingEdit}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          ) : (
            <div
              className={`text-xs leading-relaxed break-words ${
                comment.deleted ? 'text-secondary/60 italic' : 'text-on-surface'
              }`}
            >
              {comment.deleted ? 'Этот комментарий был удален :(' : comment.content}
            </div>
          )}

          {/* Toggle Replies button (for root comments) */}
          {!isNested && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleToggleReplies}
                className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3 text-secondary" />
                {areRepliesExpanded ? (
                  <>
                    <span>Скрыть ответы</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>{replies.length > 0 ? `Ответы (${replies.length})` : 'Показать ответы'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Nested Replies List */}
          {areRepliesExpanded && !isNested && (
            <div className="mt-3 pl-4 border-l-2 border-outline-variant space-y-3">
              {isLoadingReplies ? (
                <div className="text-[11px] text-secondary py-2">Загрузка ответов...</div>
              ) : !Array.isArray(replies) || replies.length === 0 ? (
                <div className="text-[11px] text-secondary py-2">Ответов пока нет.</div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    articleId={articleId}
                    articleAuthorId={articleAuthorId}
                    isPublished={isPublished}
                    onReply={onReply}
                    onRefresh={() => {
                      onRefresh();
                      handleToggleReplies();
                    }}
                    isNested
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Удаление комментария"
        description="Вы уверены, что хотите удалить этот комментарий? Текст будет заменен на системную отметку об удалении."
        confirmLabel="Удалить"
        isLoading={isDeleting}
      />
    </div>
  );
};
