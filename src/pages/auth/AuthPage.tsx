import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { authApi } from '@/core/api/authApi';
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, isMockMode } = useAuth();

  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<string>('');
  const [isRegistrationCompleted, setIsRegistrationCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isRegistrationCompleted && !isActivating) {
      navigate('/');
    }
  }, [isAuthenticated, isRegistrationCompleted, isActivating, navigate]);

  useEffect(() => {
    setIsRegister(searchParams.get('tab') === 'register');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRegistrationCompleted(false);
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
        setIsActivating(true);
        setActivationStatus('Создание учетной записи...');
        await authApi.register({
          username: username.trim(),
          email: email.trim(),
          password,
        });

        // Polling loop checking account active status
        setActivationStatus('Подготавливаем профиль...');
        const maxAttempts = 20;
        let isActivated = false;

        for (let i = 1; i <= maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            setActivationStatus(`Проверка статуса активации профиля (${i}/${maxAttempts})...`);
            await login({
              email: email.trim(),
              password,
            });
            isActivated = true;
            break;
          } catch (pollErr: any) {
            if (pollErr.code === 'ACCOUNT_STILL_PENDING') {
              continue;
            }
            throw pollErr;
          }
        }

        setIsActivating(false);
        if (isActivated) {
          setIsRegistrationCompleted(true);
          setSuccessMessage('Аккаунт успешно создан и активирован! Ваш профиль готов к работе.');
          return;
        } else {
          setIsRegister(false);
          setSuccessMessage('Аккаунт создан, но синхронизация профиля занимает чуть дольше обычного. Пожалуйста, подождите минуту и войдите.');
          return;
        }
      } else {
        await login({
          email: email.trim(),
          password,
        });
        navigate('/');
      }
    } catch (err: any) {
      setIsActivating(false);
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
          <span className="font-bold tracking-tight">Editorial</span>
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
      <main className="w-full max-w-[440px] mx-auto my-auto bg-surface rounded-xl border border-outline/70 p-6 sm:p-8">
        {isRegistrationCompleted ? (
          <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Регистрация завершена!</h2>
              <p className="text-xs text-on-surface-variant mt-2 max-w-sm mx-auto leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
              >
                Перейти в каталог статей
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full py-2.5 px-4 rounded-xl border border-outline/70 hover:bg-surface-container text-on-surface text-sm font-semibold transition-colors"
              >
                Перейти в профиль
              </button>
            </div>
          </div>
        ) : isActivating ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mx-auto border border-primary/20">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Активация аккаунта</h2>
              <p className="text-xs text-on-surface-variant mt-2 max-w-xs mx-auto leading-relaxed">
                {activationStatus}
              </p>
            </div>
            <div className="p-3 bg-surface-container rounded-xl border border-outline/70 text-[11px] text-secondary leading-relaxed">
              Создаём профиль. Это может занять несколько секунд.
            </div>
          </div>
        ) : (
          <>
            {/* Toggle Switcher */}
            <div className="flex rounded-xl bg-surface-container p-1 mb-8">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMessage(null);
                }}
                className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  !isRegister
                    ? 'bg-surface text-on-surface'
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
                className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  isRegister
                    ? 'bg-surface text-on-surface'
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
                  ? 'Сохраняйте статьи и следите за авторами.'
                  : 'Введите почту и пароль.'}
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
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline/70 hover:bg-surface-container/60 hover:border-outline text-on-surface text-sm font-medium transition-colors group"
          >
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
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline/70 hover:bg-surface-container/60 hover:border-outline text-on-surface text-sm font-medium transition-colors group"
          >
            <span className="text-xs">Демо: elena</span>
          </button>
        </div>}

        {/* Divider */}
        {isMockMode && <div className="relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-outline/70"></div>
          <span className="absolute bg-surface px-3 text-xs text-on-surface-variant font-medium">
            вход по почте
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
              {isRegister && <span className="text-xs text-secondary">Не менее 6 символов</span>}
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

          {isRegister && (
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
            className="w-full py-2.5 px-4 mt-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          </>
        )}
      </main>

      {/* Clean minimal footer */}
      <footer className="w-full max-w-5xl mx-auto py-4 text-center text-xs text-on-surface-variant/70">
        © {new Date().getFullYear()} Editorial
      </footer>
    </div>
  );
};
