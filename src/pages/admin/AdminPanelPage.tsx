import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { adminApi } from '@/core/api/adminApi';
import {
  AccountRole,
  AdminAccountResponse,
  AdminUserProfileResponse,
} from '@/core/api/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Users,
  UserCheck,
  Edit2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'accounts' | 'profiles'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');

  // Accounts state
  const [accounts, setAccounts] = useState<AdminAccountResponse[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [editAccountTarget, setEditAccountTarget] = useState<AdminAccountResponse | null>(null);
  const [editRole, setEditRole] = useState<AccountRole>('USER');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Profiles state
  const [profiles, setProfiles] = useState<AdminUserProfileResponse[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [editProfileTarget, setEditProfileTarget] = useState<AdminUserProfileResponse | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await adminApi.getAccounts(0, 100);
      setAccounts(res.content || []);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
      setError(err.message || 'Ошибка загрузки учетных записей');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await adminApi.getProfiles(0, 100);
      setProfiles(res.content || []);
    } catch (err: any) {
      console.error('Failed to load profiles:', err);
      setError(err.message || 'Ошибка загрузки профилей');
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    loadAccounts();
    loadProfiles();
  }, [user, navigate, loadAccounts, loadProfiles]);

  const handleEditAccountClick = (acc: AdminAccountResponse) => {
    setEditAccountTarget(acc);
    setEditRole(acc.role);
    setEditEmail(acc.email);
    setEditUsername(acc.username);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountTarget) return;

    setIsSavingAccount(true);
    try {
      await adminApi.patchAccount(editAccountTarget.accountId, {
        role: editRole,
        email: editEmail.trim(),
        username: editUsername.trim(),
      });
      setEditAccountTarget(null);
      await loadAccounts();
    } catch (err: any) {
      alert(`Ошибка обновления аккаунта: ${err.message || err}`);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleEditProfileClick = (prof: AdminUserProfileResponse) => {
    setEditProfileTarget(prof);
    setEditDisplayName(prof.displayName || '');
    setEditBio(prof.profileDescription || '');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileTarget) return;

    setIsSavingProfile(true);
    try {
      await adminApi.patchProfile(editProfileTarget.accountId, {
        displayName: editDisplayName.trim() || null,
        profileDescription: editBio.trim() || null,
      });
      setEditProfileTarget(null);
      await loadProfiles();
    } catch (err: any) {
      alert(`Ошибка обновления профиля: ${err.message || err}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase().trim();
    return accounts.filter(
      (a) =>
        a.username.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        String(a.accountId).includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase().trim();
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.displayName && p.displayName.toLowerCase().includes(q)) ||
        String(p.accountId).includes(q)
    );
  }, [profiles, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary">
              Панель управления
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Роль ADMIN
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Администраторская панель
          </h1>
          <p className="text-sm text-secondary mt-1">
            Управление учетными записями, ролями доступа и профилями пользователей платформы.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/editor/moderation">
            <Button variant="outline" size="sm">
              Очередь модерации
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadAccounts();
              loadProfiles();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Обновить данные
          </Button>
        </div>
      </div>

      {/* Tabs & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'accounts'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Аккаунты и роли ({accounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profiles'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Профили пользователей ({profiles.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, email или ID..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
          {error}
        </div>
      )}

      {/* Tab 1: Accounts Table */}
      {activeTab === 'accounts' && (
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant text-secondary font-semibold">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Имя пользователя</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Роль</th>
                  <th className="py-3 px-4">Дата создания</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoadingAccounts ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      Загрузка учетных записей...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      Аккаунтов не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.accountId} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-secondary">
                        #{acc.accountId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        @{acc.username}
                      </td>
                      <td className="py-3.5 px-4 text-secondary">{acc.email}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="role">{acc.role}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-secondary">
                        {new Date(acc.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAccountClick(acc)}
                          title="Изменить роль или данные"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Править
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Profiles Table */}
      {activeTab === 'profiles' && (
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant text-secondary font-semibold">
                <tr>
                  <th className="py-3 px-4">ID Аккаунта</th>
                  <th className="py-3 px-4">Тег (@username)</th>
                  <th className="py-3 px-4">Отображаемое имя</th>
                  <th className="py-3 px-4">Описание профиля</th>
                  <th className="py-3 px-4">Дата создания</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoadingProfiles ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      Загрузка профилей...
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      Профилей не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((prof) => (
                    <tr key={prof.accountId} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-secondary">
                        #{prof.accountId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        @{prof.username}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface">
                        {prof.displayName || <span className="text-secondary italic">Не указано</span>}
                      </td>
                      <td className="py-3.5 px-4 text-secondary max-w-xs truncate">
                        {prof.profileDescription || <span className="italic">Пусто</span>}
                      </td>
                      <td className="py-3.5 px-4 text-secondary">
                        {new Date(prof.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProfileClick(prof)}
                          title="Редактировать имя или описание"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Править
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editAccountTarget && (
        <Modal
          isOpen={Boolean(editAccountTarget)}
          onClose={() => setEditAccountTarget(null)}
          title={`Редактирование аккаунта #${editAccountTarget.accountId}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <Input
              label="Имя пользователя (username)"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                Роль учетной записи (AccountRole)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['USER', 'AUTHOR', 'EDITOR', 'ADMIN'] as AccountRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditRole(r)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      editRole === r
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface hover:bg-surface-container border-outline-variant text-secondary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-secondary pt-1">
                Новая роль вступит в силу при следующем выпуске токена (re-login или refresh).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditAccountTarget(null)}
                disabled={isSavingAccount}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" disabled={isSavingAccount}>
                {isSavingAccount ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      {editProfileTarget && (
        <Modal
          isOpen={Boolean(editProfileTarget)}
          onClose={() => setEditProfileTarget(null)}
          title={`Профиль аккаунта #${editProfileTarget.accountId} (@${editProfileTarget.username})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Отображаемое имя (displayName)"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="Иван Иванов"
            />

            <div className="space-y-1.5">
              <label htmlFor="admin-bio" className="block text-xs font-semibold text-on-surface">
                Описание профиля (profileDescription)
              </label>
              <textarea
                id="admin-bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Краткое описание биографии или профессиональных интересов..."
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-outline/70 bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditProfileTarget(null)}
                disabled={isSavingProfile}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" disabled={isSavingProfile}>
                {isSavingProfile ? 'Сохранение...' : 'Сохранить профиль'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
