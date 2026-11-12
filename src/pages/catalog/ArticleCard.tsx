import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArticleResponse } from '@/core/api/types';
import { calculateReadingTime } from '@/core/utils/readingTime';
import { profileStorage } from '@/core/profile/profileStorage';
import { Clock, User as UserIcon, ArrowUpRight, Bookmark, Heart } from 'lucide-react';

export interface ArticleCardProps {
  article: ArticleResponse;
  canEdit?: boolean;
  onDelete?: (id: number) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const readingStats = calculateReadingTime(article.content);
  const authorId = article.authorAccountId || article.authorId || 1;
  const authorName = article.authorDisplayName || 'Автор';
  const [bookmarked, setBookmarked] = useState(() => profileStorage.isBookmarked(article.id));
  const [liked, setLiked] = useState(() => profileStorage.isLiked(article.id));

  useEffect(() => {
    const handleUpdate = () => {
      setBookmarked(profileStorage.isBookmarked(article.id));
      setLiked(profileStorage.isLiked(article.id));
    };
    window.addEventListener('editorial_profile_updated', handleUpdate);
    return () => window.removeEventListener('editorial_profile_updated', handleUpdate);
  }, [article.id]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = profileStorage.toggleBookmark(article.id);
    setBookmarked(nextState);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = profileStorage.toggleLike(article.id);
    setLiked(nextState);
  };

  // Generate a clean text excerpt from markdown content
  const excerpt = article.content
    ? article.content
        .replace(/^#+\s+/gm, '') // Remove heading markers
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Clean links
        .replace(/[*_~>]/g, '') // Clean formatting chars
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160) + (article.content.length > 160 ? '…' : '')
    : '';

  return (
    <article className="group relative flex flex-col justify-between bg-surface border border-outline-variant hover:border-outline rounded-2xl p-6 transition-all hover:shadow-[0_4px_20px_-4px_rgba(17,24,39,0.06)]">
      <div>
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/80">
            <Link
              to={`/user/${authorId}`}
              className="relative z-10 flex items-center gap-1 font-medium hover:text-primary hover:underline transition-colors"
              title="Перейти на страницу автора"
            >
              <UserIcon className="w-3.5 h-3.5 text-secondary" />
              <span>{authorName}</span>
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              {readingStats.text}
            </span>
          </div>

          <div className="flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmarked
                  ? 'text-primary bg-surface-container'
                  : 'text-secondary/70 hover:text-on-surface hover:bg-surface-container/60'
              }`}
              title={bookmarked ? 'Удалить из закладок' : 'Сохранить в закладки'}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors line-clamp-2 mb-2.5">
          <Link to={`/article/${article.id}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {article.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-6">
          {excerpt}
        </p>
      </div>

      {/* Footer / Read link + Quick Like */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/60 text-xs font-semibold text-primary z-10">
        <Link to={`/article/${article.id}`} className="flex items-center gap-1 hover:underline">
          <span>Читать полностью</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
            liked
              ? 'text-error bg-error/10 font-bold'
              : 'text-secondary hover:text-error hover:bg-surface-container'
          }`}
          title={liked ? 'Убрать отметку нравится' : 'Нравится'}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          <span className="text-[11px]">{liked ? 'Понравилось' : 'Лайк'}</span>
        </button>
      </div>
    </article>
  );
};
