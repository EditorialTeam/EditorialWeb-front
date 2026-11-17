import type { ArticleResponse, AuthUser } from './types';

export const articleStatusLabels = {
  DRAFT: 'Черновик', PENDING_REVIEW: 'На проверке', PUBLISHED: 'Опубликовано',
  REJECTED: 'Отклонено', ARCHIVED: 'В архиве',
};

export function articlePermissions(article: ArticleResponse, user: AuthUser | null) {
  const owner = user?.accountId === article.authorAccountId;
  const moderator = user?.role === 'EDITOR' || user?.role === 'ADMIN';
  const author = user?.role === 'AUTHOR' && owner;
  const writer = user && ['AUTHOR', 'EDITOR', 'ADMIN'].includes(user.role);
  const status = article.status;
  return {
    edit: Boolean((moderator || author) && (status === 'DRAFT' || status === 'REJECTED' || (moderator && status === 'PENDING_REVIEW'))),
    delete: Boolean(moderator || (author && status !== 'PENDING_REVIEW')),
    submit: Boolean(writer && owner && (status === 'DRAFT' || status === 'REJECTED' || status === 'ARCHIVED')),
    archive: Boolean((moderator || author) && status === 'PUBLISHED'),
    moderate: Boolean(moderator && status === 'PENDING_REVIEW'),
    withdraw: Boolean(moderator && status === 'PENDING_REVIEW'),
  };
}
