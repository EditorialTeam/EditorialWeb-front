import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isMockMode } = useAuth();

  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsRegister(searchParams.get('tab') === 'register');
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation matching backend rules
    if (!email.trim() || !password) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (isRegister) {
      if (!username.trim()) {
        setErrorMessage('Укажите имя или псевдоним');
        return;
      }
      if (username.length > 100) {
        setErrorMessage('Имя не должно превышать 100 символов');
        return;
      }
      if (!acceptTerms) {
        setErrorMessage('Необходимо принять условия использования');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setIsRegister(false);
        setSuccessMessage('Аккаунт создан. Подготовка профиля может занять несколько секунд. После этого войдите с вашим email и паролем.');
        return;
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'INVALID_CREDENTIALS') {
        setErrorMessage('Неверный адрес электронной почты или пароль');
      } else if (err.code === 'ACCOUNT_STILL_PENDING') {
        setErrorMessage('Профиль ещё создаётся. Подождите несколько секунд и повторите вход.');
      } else if (err.code === 'CONFLICT') {
        setErrorMessage('Пользователь с таким email или именем уже существует');
      } else {
        setErrorMessage(err.message || 'Ошибка при выполнении запроса');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header / Minimal Logo */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2 tracking-tight font-bold text-xl text-primary group">
          <span className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105">
            E
          </span>
          <span className="font-extrabold tracking-tight">Editorial</span>
        </Link>
        <Link
          to="/"
          className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          На главную
        </Link>
      </header>

      {/* Main Auth Container */}
      <main className="w-full max-w-[440px] mx-auto my-auto bg-surface rounded-2xl border border-outline/70 shadow-sm p-6 sm:p-8">
        {/* Toggle Switcher */}
        <div className="flex rounded-xl bg-surface-container p-1 mb-8">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage(null);
            }}
            className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage(null);
            }}
            className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            {isRegister ? 'Создать аккаунт' : 'Вход в аккаунт'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {isRegister
              ? 'Присоединяйтесь к независимому журналу Editorial'
              : 'Рады снова видеть вас. Введите данные для входа.'}
          </p>
        </div>

        {/* Quick OAuth Buttons */}
        {isMockMode && <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setEmail('alex@example.com');
              setPassword('password123');
              if (isRegister) setUsername('alex');
            }}
            title="Заполнить демо-данными"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline/70 hover:bg-surface-container/60 hover:border-outline text-on-surface text-sm font-medium transition-all group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-xs">Демо: alex</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('elena@example.com');
              setPassword('password123');
              if (isRegister) setUsername('elena');
            }}
            title="Заполнить демо-данными"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline/70 hover:bg-surface-container/60 hover:border-outline text-on-surface text-sm font-medium transition-all group"
          >
            <svg className="w-4 h-4 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span className="text-xs">Демо: elena</span>
          </button>
        </div>}

        {/* Divider */}
        {isMockMode && <div className="relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-outline/70"></div>
          <span className="absolute bg-surface px-3 text-xs text-on-surface-variant font-medium">
            или через почту
          </span>
        </div>}

        {successMessage && <div role="status" className="mb-4 p-3 rounded-xl bg-surface-container border border-outline/70 text-secondary text-xs leading-relaxed">{successMessage}</div>}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs leading-relaxed animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Registration only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="user-name">
                Имя или псевдоним
              </label>
              <input
                id="user-name"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Марк Соловьев"
                required
                maxLength={100}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="auth-email">
              Электронная почта
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              maxLength={254}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-on-surface" htmlFor="auth-password">
                Пароль
              </label>
              {isRegister ? (
                <span className="text-[11px] text-on-surface-variant/70">Не менее 6 символов</span>
              ) : isMockMode ? (
                <button
                  type="button"
                  onClick={() => alert('Для демо-режима используйте пароль: password123')}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Забыли пароль?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
                maxLength={100}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors flex items-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me (login) or Terms (register) */}
          {!isRegister ? (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="remember-checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-outline/70 text-black cursor-pointer accent-primary"
              />
              <label htmlFor="remember-checkbox" className="text-xs text-on-surface-variant cursor-pointer select-none">
                Запомнить меня на этом устройстве
              </label>
            </div>
          ) : (
            <div className="flex items-start gap-2 pt-0.5">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-outline/70 text-black cursor-pointer accent-primary"
              />
              <label htmlFor="terms-checkbox" className="text-xs text-on-surface-variant leading-relaxed cursor-pointer select-none">
                Я принимаю <span className="underline hover:text-on-surface">Условия использования</span> и{' '}
                <span className="underline hover:text-on-surface">Политику конфиденциальности</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 mt-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Загрузка...</span>
            ) : isRegister ? (
              'Зарегистрироваться'
            ) : (
              'Войти'
            )}
          </button>
        </form>

        {/* Bottom Switcher */}
        <div className="mt-6 text-center text-xs text-on-surface-variant">
          <span>{isRegister ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}</span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
            }}
            className="ml-1 font-semibold text-primary hover:underline cursor-pointer"
          >
            {isRegister ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </main>

      {/* Clean minimal footer */}
      <footer className="w-full max-w-5xl mx-auto py-4 text-center text-xs text-on-surface-variant/70">
        © 2026 Editorial. Независимая платформа. Все права защищены.
      </footer>
    </div>
  );
};
