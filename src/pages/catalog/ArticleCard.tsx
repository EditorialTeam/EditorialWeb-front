import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleResponse } from '@/core/api/types';
import { calculateReadingTime } from '@/core/utils/readingTime';
import { articleDateLabel, articleTimestamp } from '@/core/utils/articleDate';
import { profileStorage } from '@/core/profile/profileStorage';
import { articleStatusLabels } from '@/core/api/articlePermissions';
import { Avatar } from '@/components/media/Avatar';
import { ArticleCover } from '@/components/media/ArticleCover';
import { Bookmark } from 'lucide-react';

export interface ArticleCardProps {
  article: ArticleResponse;
  variant?: 'card' | 'lead' | 'feed';
  canEdit?: boolean;
  onDelete?: (id: number) => void;
}

export function ArticleCard({ article, variant = 'card' }: ArticleCardProps) {
  const [saved, setSaved] = useState(() => profileStorage.isBookmarked(article.id));
  const [failedCover, setFailedCover] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setSaved(profileStorage.isBookmarked(article.id));
    sync();
    window.addEventListener('editorial_profile_updated', sync);
    return () => window.removeEventListener('editorial_profile_updated', sync);
  }, [article.id]);

  const author = article.authorDisplayName || `Автор №${article.authorAccountId}`;
  const timestamp = articleTimestamp(article);
  const dateLabel = articleDateLabel(article);
  const hasCover = Boolean(article.coverObjectKey && article.coverObjectKey !== failedCover);
  const excerpt = article.content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <article className={`publication publication--${variant}${hasCover ? ' publication--with-cover' : ''}`}>
      {hasCover && (
        <Link to={`/article/${article.id}`} className="publication__cover-link" aria-label={`Открыть статью «${article.title}»`}>
          <ArticleCover
            objectKey={article.coverObjectKey}
            alt={`Обложка статьи «${article.title}»`}
            className="publication__cover"
            loading={variant === 'lead' ? 'eager' : 'lazy'}
            onUnavailable={() => setFailedCover(article.coverObjectKey ?? null)}
          />
        </Link>
      )}
      <div className="publication__body">
        <div className="publication__meta">
          {dateLabel && timestamp !== null && <time dateTime={new Date(timestamp).toISOString()}>{dateLabel}</time>}
          {article.status && article.status !== 'PUBLISHED' && <span>{articleStatusLabels[article.status]}</span>}
          <span>{calculateReadingTime(article.content).text}</span>
        </div>
        <h2 className="publication__title">
          <Link to={`/article/${article.id}`}>{article.title}</Link>
        </h2>
        {excerpt && <p className="publication__excerpt">{excerpt.slice(0, 240)}{excerpt.length > 240 ? '…' : ''}</p>}
        <div className="publication__footer">
          <Link to={`/user/${article.authorAccountId}`} className="publication__author">
            <Avatar objectKey={article.authorAvatarObjectKey} name={author} className="w-6 h-6" />
            <span>{author}</span>
          </Link>
          <button
            type="button"
            aria-label={saved ? 'Удалить закладку' : 'Сохранить в закладки'}
            aria-pressed={saved}
            title={saved ? 'Удалить закладку' : 'Сохранить в закладки'}
            onClick={() => setSaved(profileStorage.toggleBookmark(article.id, article.title))}
            className="publication__bookmark"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
