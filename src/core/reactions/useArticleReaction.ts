import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { reactionsApi } from '../api/reactionsApi';
import { ReactionType } from '../api/types';
import { profileStorage } from '../profile/profileStorage';

export function useArticleReaction(articleId: number) {
  const { user, isAuthenticated } = useAuth();
  const [reaction, setReaction] = useState(() => profileStorage.getReaction(articleId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setReaction(profileStorage.getReaction(articleId));
    sync();
    window.addEventListener('editorial_profile_updated', sync);
    return () => window.removeEventListener('editorial_profile_updated', sync);
  }, [articleId, user?.accountId]);
  const toggle = async (type: ReactionType) => {
    if (pending || !isAuthenticated) return;
    setPending(true);
    setError(null);
    try {
      if (profileStorage.getReaction(articleId) === type) {
        try { await reactionsApi.deleteReaction(articleId); }
        catch (err) { if ((err as { status?: number }).status !== 404) throw err; }
        profileStorage.setReaction(articleId, null);
      } else {
        const result = await reactionsApi.putReaction(articleId, type);
        profileStorage.setReaction(articleId, result.reactionType);
      }
    } catch (err) { setError((err as Error).message); }
    finally { setPending(false); }
  };
  return { reaction, pending, error, toggle, canReact: isAuthenticated };
}
