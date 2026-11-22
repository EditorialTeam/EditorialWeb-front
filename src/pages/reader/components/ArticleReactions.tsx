import { useEffect, useState } from 'react';
import { ReactionType } from '@/core/api/types';
import { reactionsApi } from '@/core/api/reactionsApi';
import { useAuth } from '@/core/auth/AuthContext';
import { reactionOptions } from '@/core/api/reactionOptions';
import { X } from 'lucide-react';
export function ArticleReactions({ articleId }: { articleId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<ReactionType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setSelected(null); setCounts({}); setError(null); setLoading(true);
    if (isAuthenticated) reactionsApi.getReactions(articleId).then(data => { if (active) setCounts(data.reactions); }).catch((err: Error) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    else setLoading(false);
    return () => { active = false; };
  }, [articleId, user?.accountId, isAuthenticated]);
  const change = async (type: ReactionType | null) => {
    if (!isAuthenticated || busy) return;
    setBusy(true); setError(null);
    try {
      if (type) { const result = await reactionsApi.putReaction(articleId, type); setSelected(result.reactionType); }
      else { try { await reactionsApi.deleteReaction(articleId); } catch (err) { if ((err as { status?: number }).status !== 404) throw err; } setSelected(null); }
      setCounts((await reactionsApi.getReactions(articleId)).reactions);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <section className="my-8 border-y border-outline-variant py-5 space-y-3" aria-label="Реакции">
      <h2 className="text-base font-semibold">Реакции</h2>
      {loading ? <p className="text-sm text-secondary">Загрузка реакций…</p> : (
        <div className="flex flex-wrap items-center gap-2">
          {reactionOptions.map(item => (
            <button
              key={item.type}
              type="button"
              className={`reaction-button${selected === item.type ? ' reaction-button--selected' : ''}`}
              disabled={busy || !isAuthenticated}
              aria-pressed={selected === item.type}
              aria-label={`${item.label}: ${counts[item.type] ?? 0}`}
              title={item.label}
              onClick={() => change(selected === item.type ? null : item.type)}
            >
              <span aria-hidden="true" className="text-xl leading-none">{item.emoji}</span>
              <span aria-hidden="true" className="text-xs tabular-nums">{counts[item.type] ?? 0}</span>
            </button>
          ))}
          {isAuthenticated && <button type="button" className="reaction-button reaction-button--clear" disabled={busy} onClick={() => change(null)} aria-label="Убрать мою реакцию" title="Убрать мою реакцию"><X className="w-4 h-4" /></button>}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </section>
  );
}
