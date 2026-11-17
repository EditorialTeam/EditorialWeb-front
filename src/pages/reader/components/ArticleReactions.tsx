import React, { useState, useEffect, useRef } from 'react';
import { ReactionType } from '@/core/api/types';
import { reactionsApi } from '@/core/api/reactionsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { SmilePlus, Lock } from 'lucide-react';

interface ArticleReactionsProps {
  articleId: number;
}

interface ReactionMeta {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTION_CONFIG: ReactionMeta[] = [
  { type: 'LIKE', emoji: '👍', label: 'Понравилось' },
  { type: 'FIRE', emoji: '🔥', label: 'Огонь' },
  { type: 'MINDBLOWN', emoji: '🤯', label: 'Взрыв мозга' },
  { type: 'THINKING', emoji: '🤔', label: 'Интересно' },
  { type: 'MELTING', emoji: '🫠', label: 'В шоке' },
  { type: 'HOT', emoji: '🥵', label: 'Горячо' },
  { type: 'CRYING', emoji: '😭', label: 'Плачу' },
  { type: 'FROZEN', emoji: '🥶', label: 'Холодно' },
  { type: 'DISLIKE', emoji: '👎', label: 'Не согласен' },
];

export const ArticleReactions: React.FC<ArticleReactionsProps> = ({ articleId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<ReactionType | null>(() => {
    const saved = localStorage.getItem(`editorial_user_reaction_${articleId}_${user?.accountId}`);
    return (saved as ReactionType) || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch reactions from API
  useEffect(() => {
    let cancelled = false;
    const fetchReactions = async () => {
      try {
        const data = await reactionsApi.getReactions(articleId);
        if (!cancelled && data?.reactions) {
          setReactions(data.reactions);
        }
      } catch (err) {
        console.warn('Failed to load reactions:', err);
      }
    };

    if (isAuthenticated) {
      fetchReactions();
    }

    return () => {
      cancelled = true;
    };
  }, [articleId, isAuthenticated]);

  const handleToggleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      setFeedbackError('Войдите в аккаунт, чтобы оставлять реакции на публикации.');
      setTimeout(() => setFeedbackError(null), 3000);
      return;
    }

    const isCurrentActive = userReaction === type;
    const previousReaction = userReaction;
    const previousCounts = { ...reactions };

    // Optimistic UI update
    const nextCounts = { ...reactions };
    if (isCurrentActive) {
      // Removing reaction
      nextCounts[type] = Math.max(0, (nextCounts[type] || 1) - 1);
      if (nextCounts[type] === 0) delete nextCounts[type];
      setUserReaction(null);
      localStorage.removeItem(`editorial_user_reaction_${articleId}_${user?.accountId}`);
    } else {
      // If switching from another reaction
      if (previousReaction && nextCounts[previousReaction]) {
        nextCounts[previousReaction] = Math.max(0, nextCounts[previousReaction] - 1);
        if (nextCounts[previousReaction] === 0) delete nextCounts[previousReaction];
      }
      nextCounts[type] = (nextCounts[type] || 0) + 1;
      setUserReaction(type);
      localStorage.setItem(`editorial_user_reaction_${articleId}_${user?.accountId}`, type);
    }
    setReactions(nextCounts);
    setIsPickerOpen(false);

    try {
      setIsLoading(true);
      if (isCurrentActive) {
        await reactionsApi.deleteReaction(articleId);
      } else {
        await reactionsApi.putReaction(articleId, type);
      }
    } catch (err: any) {
      console.error('Failed to update reaction:', err);
      // Rollback on error
      setReactions(previousCounts);
      setUserReaction(previousReaction);
      setFeedbackError(err.message || 'Ошибка обновления реакции');
      setTimeout(() => setFeedbackError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Group of reactions to display: active ones + user's current
  const displayedTypes = REACTION_CONFIG.filter(
    (cfg) => (reactions[cfg.type] && reactions[cfg.type] > 0) || userReaction === cfg.type
  );

  return (
    <div className="pt-6 pb-4 border-t border-b border-outline-variant my-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Reaction pills */}
        <div className="flex flex-wrap items-center gap-2">
          {displayedTypes.map((cfg) => {
            const count = reactions[cfg.type] || 0;
            const isActive = userReaction === cfg.type;

            return (
              <button
                key={cfg.type}
                type="button"
                onClick={() => handleToggleReaction(cfg.type)}
                disabled={isLoading}
                title={`${cfg.label} (${count})`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
                  isActive
                    ? 'bg-primary/10 border-2 border-primary text-primary shadow-sm scale-105'
                    : 'bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface'
                }`}
              >
                <span className="text-base leading-none">{cfg.emoji}</span>
                <span className="font-mono text-xs font-bold">{count}</span>
              </button>
            );
          })}

          {/* Add Reaction Button & Dropdown Picker */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-surface-container border border-dashed border-outline-variant hover:border-outline text-secondary hover:text-on-surface transition-all"
              title="Добавить реакцию"
            >
              <SmilePlus className="w-4 h-4" />
              <span>Реакция</span>
            </button>

            {/* Popover Emoji Picker */}
            {isPickerOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-surface rounded-2xl border border-outline-variant shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 w-64">
                <div className="text-[11px] font-semibold text-secondary px-2 pb-2 mb-1 border-b border-outline-variant flex items-center justify-between">
                  <span>Выберите реакцию</span>
                  {!isAuthenticated && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600">
                      <Lock className="w-3 h-3" />
                      Требуется вход
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {REACTION_CONFIG.map((cfg) => (
                    <button
                      key={cfg.type}
                      type="button"
                      onClick={() => handleToggleReaction(cfg.type)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl hover:bg-surface-container transition-colors ${
                        userReaction === cfg.type ? 'bg-primary/10 border border-primary' : ''
                      }`}
                      title={cfg.label}
                    >
                      <span className="text-xl mb-0.5">{cfg.emoji}</span>
                      <span className="text-[10px] text-secondary font-medium truncate max-w-full">
                        {cfg.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Helpful hint */}
        <div className="text-xs text-secondary">
          {Object.values(reactions).reduce((acc, c) => acc + c, 0)} реакций всего
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs">
          {feedbackError}
        </div>
      )}
    </div>
  );
};
