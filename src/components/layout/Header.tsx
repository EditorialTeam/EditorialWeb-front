import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ChevronDown, LogOut, Menu, PenLine, UserRound, X } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, canWrite, canModerate, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useRef<HTMLDivElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const accountId = useId();
  const mobileId = useId();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); setError(null); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!accountOpen && !mobileOpen) return;
    const outside = (event: PointerEvent) => {
      if (account.current && !account.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (accountOpen) { setAccountOpen(false); accountButton.current?.focus(); }
      else { setMobileOpen(false); mobileButton.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard); };
  }, [accountOpen, mobileOpen]);

  const links = [
    { to: '/', label: 'Лента' },
    ...(canWrite ? [{ to: '/author', label: 'Мои статьи' }] : []),
    ...(canModerate ? [{ to: '/editor/moderation', label: 'Модерация' }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Управление' }] : []),
  ];
  const navigation = links.map(item => (
    <NavLink key={item.to} to={item.to} end className={({ isActive }) => `appbar__link${isActive ? ' appbar__link--active' : ''}`}>
      {item.label}
    </NavLink>
  ));
  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true); setError(null);
    try { await logout(); setAccountOpen(false); setMobileOpen(false); navigate('/'); }
    catch (err) { setError((err as Error).message); }
    finally { setLoggingOut(false); }
  };

  return (
    <header className="appbar">
      <div className="appbar__inner">
        <Link to="/" className="appbar__brand" aria-label="Editorial — лента">Editorial<span aria-hidden="true">.</span></Link>
        <nav aria-label="Основная навигация" className="appbar__navigation">{navigation}</nav>
        <div className="appbar__actions">
          {canWrite && <Link to="/editor" className={`appbar__write${location.pathname === '/editor' ? ' appbar__write--active' : ''}`}><PenLine className="w-4 h-4" /><span>Написать</span></Link>}
          {isAuthenticated && user ? (
            <div ref={account} className="appbar__account" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAccountOpen(false); }}>
              <button ref={accountButton} type="button" className={`appbar__account-button${accountOpen ? ' appbar__account-button--open' : ''}`} aria-expanded={accountOpen} aria-controls={accountId} aria-label="Меню аккаунта" onClick={() => { setAccountOpen(value => !value); setMobileOpen(false); }}>
                <span className="appbar__initial" aria-hidden="true">{user.username?.slice(0, 1).toUpperCase() || <UserRound className="w-4 h-4" />}</span>
                <span className="appbar__username">{user.username || 'Аккаунт'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>
              {accountOpen && <div id={accountId} className="appbar__dropdown"><p className="appbar__account-name">{user.username || user.email}</p><Link to="/profile" className="appbar__dropdown-item"><UserRound className="w-4 h-4" />Мой профиль</Link><div className="appbar__dropdown-divider" /><button type="button" className="appbar__dropdown-item" disabled={loggingOut} onClick={() => void signOut()}><LogOut className="w-4 h-4" />{loggingOut ? 'Выход…' : 'Выйти'}</button></div>}
            </div>
          ) : <Link to="/auth"><Button size="sm" variant="outline">Войти</Button></Link>}
          <button ref={mobileButton} type="button" className="appbar__mobile-toggle" aria-label={mobileOpen ? 'Закрыть навигацию' : 'Открыть навигацию'} aria-expanded={mobileOpen} aria-controls={mobileId} onClick={() => { setMobileOpen(value => !value); setAccountOpen(false); }}>{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </div>
      {mobileOpen && <nav id={mobileId} aria-label="Мобильная навигация" className="appbar__mobile-navigation">{navigation}</nav>}
      {error && <p role="alert" className="max-w-6xl mx-auto px-4 pb-3 text-sm text-error">{error}</p>}
    </header>
  );
}
