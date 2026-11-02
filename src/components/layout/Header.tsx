import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AccountRole } from '@/core/api/types';
import {
  PenSquare,
  LogOut,
  User as UserIcon,
  Database,
  Radio,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, canWrite, logout, isMockMode, setMockMode, setDevRole } =
    useAuth();
  const navigate = useNavigate();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roles: AccountRole[] = ['USER', 'AUTHOR', 'EDITOR', 'ADMIN'];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 tracking-tight font-bold text-xl text-primary group">
            <span className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105">
              E
            </span>
            <span className="font-extrabold tracking-tight">Editorial</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-secondary">
            <Link
              to="/"
              className="hover:text-on-surface transition-colors py-1 px-2 rounded-md hover:bg-surface-container"
            >
              Каталог
            </Link>
            {canWrite && (
              <Link
                to="/editor"
                className="hover:text-on-surface transition-colors py-1 px-2 rounded-md hover:bg-surface-container flex items-center gap-1.5"
              >
                <PenSquare className="w-4 h-4" />
                Написать
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/profile"
                className="hover:text-on-surface transition-colors py-1 px-2 rounded-md hover:bg-surface-container"
              >
                Профиль
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Mock / Live Gateway Switcher */}
          <button
            onClick={() => setMockMode(!isMockMode)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-outline-variant hover:border-outline bg-surface transition-all text-secondary"
            title={
              isMockMode
                ? 'Режим Mock API (автономно). Нажмите для переключения на Gateway :8080'
                : 'Режим Gateway :8080 (Docker Compose). Нажмите для переключения на Mock API'
            }
          >
            {isMockMode ? (
              <>
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono text-[11px] text-amber-700 font-medium">Mock API</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-700 font-medium">Gateway :8080</span>
              </>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Dev Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-container text-xs font-medium text-secondary border border-outline-variant"
                  title="Быстрая смена роли для проверки прав доступа"
                >
                  <Badge variant="role">{user.role}</Badge>
                  <ChevronDown className="w-3 h-3 text-secondary" />
                </button>

                {isRoleMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-surface rounded-xl border border-outline-variant shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider">
                      Тестовая роль
                    </div>
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setDevRole(r);
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-surface-container transition-colors ${
                          user.role === r ? 'text-primary font-bold' : 'text-secondary'
                        }`}
                      >
                        {r}
                        {user.role === r && <span className="text-primary text-[10px]">●</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User profile link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container transition-colors text-sm font-medium text-on-surface group"
                title="Перейти в личный кабинет"
              >
                <div className="w-7 h-7 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-xs text-secondary font-semibold overflow-hidden shrink-0">
                  <UserIcon className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors" />
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate group-hover:text-primary transition-colors">
                  {user.username}
                </span>
              </Link>

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Выйти из аккаунта"
                className="text-secondary hover:text-error"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button size="sm" variant="outline" className="text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                  Вход
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button size="sm" className="text-xs">
                  Регистрация
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
