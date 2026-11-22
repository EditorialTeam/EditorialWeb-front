import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/core/api/userApi';
import { UserProfile } from '@/core/api/types';
import { profileStorage } from '@/core/profile/profileStorage';
import { useAuth } from '@/core/auth/AuthContext';
import { Avatar } from '@/components/media/Avatar';
import { Button } from '@/components/ui/Button';
import { EditProfileModal } from './EditProfileModal';
export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState(() => profileStorage.getBookmarks());
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => { const data = await userApi.getMe(); setProfile(data); setError(null); };
  useEffect(() => {
    let active = true;
    setProfile(null); setError(null);
    if (user) userApi.getMe().then(data => { if (active) setProfile(data); }).catch((err: Error) => { if (active) setError(err.message); });
    const sync = () => setBookmarks(profileStorage.getBookmarks());
    sync(); window.addEventListener('editorial_profile_updated', sync);
    return () => { active = false; window.removeEventListener('editorial_profile_updated', sync); };
  }, [user?.accountId]);
  if (!user) return <Link to="/auth">Войдите, чтобы открыть профиль</Link>;
  return <div className="max-w-4xl mx-auto space-y-8">
    {error && <div role="alert" className="space-y-2 text-error"><p>{error}</p><Button variant="outline" onClick={() => reload().catch(err => setError(err.message))}>Повторить</Button></div>}
    {!profile && !error && <p className="text-secondary">Загрузка профиля…</p>}
    {profile && <section className="bg-surface border border-outline-variant rounded-xl p-6 space-y-4"><div className="flex flex-wrap items-center gap-4"><Avatar objectKey={profile.avatarObjectKey} name={profile.displayName || profile.username} className="w-20 h-20" /><div className="flex-1"><h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1><p className="text-sm text-secondary">@{profile.username}</p></div><Button variant="outline" onClick={() => setEditing(true)}>Редактировать профиль</Button></div>{profile.profileDescription && <p className="text-base whitespace-pre-wrap">{profile.profileDescription}</p>}{profile.createdAt && <p className="text-sm text-secondary">Дата регистрации: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}</p>}</section>}
    <section className="space-y-4"><h2 className="text-xl font-semibold">Закладки</h2><p className="text-sm text-secondary">Сохранены в этом браузере для вашего аккаунта.</p>{!bookmarks.length && <p className="text-secondary">Пока нет сохранённых статей.</p>}<div className="divide-y divide-outline-variant">{bookmarks.map(item => <div key={item.articleId} className="flex items-center justify-between gap-4 py-4"><Link className="text-sm font-medium hover:underline" to={`/article/${item.articleId}`}>{item.title || `Статья №${item.articleId}`}</Link><Button variant="ghost" size="sm" onClick={() => profileStorage.toggleBookmark(item.articleId)}>Удалить закладку</Button></div>)}</div></section>
    {profile && <EditProfileModal isOpen={editing} profile={profile} onClose={() => setEditing(false)} onSave={reload} />}
  </div>;
}
