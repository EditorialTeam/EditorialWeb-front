import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '../ui/Button';
import { AccountRole } from '@/core/api/types';
import { Menu, X, LogOut, Settings2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, canWrite, canModerate, logout, isMockMode, setMockMode, setDevRole } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const links = [
    { to: '/', label: 'Каталог' },
    ...(canWrite ? [{ to: '/author', label: 'Мои статьи' }] : []),
    ...(canModerate ? [{ to: '/editor/moderation', label: 'Модерация' }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Управление' }] : []),
  ];
  const navigation = links.map(({ to, label }) => (
    <NavLink key={to} to={to} end onClick={() => setMenuOpen(false)}
      className={({ isActive }) => `rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-surface-container text-on-surface font-semibold' : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'}`}>
      {label}
    </NavLink>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary">Editorial<span className="text-secondary">.</span></Link>
          <nav aria-label="Основная навигация" className="hidden lg:flex items-center gap-1">{navigation}</nav>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? <>
            <Link to="/profile" className="rounded-lg px-2 py-2 text-sm font-medium text-secondary hover:text-primary max-w-32 truncate" title="Мой профиль">{user.username}</Link>
            <Button variant="ghost" size="sm" aria-label="Выйти из аккаунта" title="Выйти" onClick={async () => { await logout(); setMenuOpen(false); navigate('/'); }}><LogOut className="w-4 h-4" /></Button>
          </> : <>
            <Link to="/auth"><Button variant="ghost" size="sm">Войти</Button></Link>
            <Link to="/auth?tab=register" className="hidden sm:block"><Button size="sm">Регистрация</Button></Link>
          </>}
          {import.meta.env.DEV && <Button size="sm" variant="ghost" aria-label="Инструменты разработки" aria-expanded={devOpen} onClick={() => setDevOpen(!devOpen)}><Settings2 className="w-4 h-4" /></Button>}
          <Button size="sm" variant="ghost" className="lg:hidden" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</Button>
        </div>
        {import.meta.env.DEV && devOpen && <div className="absolute top-full right-4 mt-2 w-64 rounded-xl border border-outline-variant bg-surface p-4 shadow-lg space-y-3">
          <p className="text-xs font-semibold text-secondary">Инструменты разработки</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isMockMode} onChange={(event) => setMockMode(event.target.checked)} />Демо-данные</label>
          {isMockMode && user && <label className="block text-sm">Тестовая роль<select className="mt-2 w-full rounded-lg border border-outline p-2 bg-surface" value={user.role} onChange={(event) => setDevRole(event.target.value as AccountRole)}>{(['USER', 'AUTHOR', 'EDITOR', 'ADMIN'] as AccountRole[]).map((role) => <option key={role}>{role}</option>)}</select></label>}
        </div>}
      </div>
      {menuOpen && <nav id="mobile-navigation" aria-label="Мобильная навигация" className="lg:hidden border-t border-outline-variant px-4 py-3 flex flex-col gap-1">{navigation}{!isAuthenticated && <Link to="/auth?tab=register" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-secondary">Регистрация</Link>}</nav>}
    </header>
  );
};
