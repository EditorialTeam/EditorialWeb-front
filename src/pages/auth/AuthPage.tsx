import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { authApi } from '@/core/api/authApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
export function AuthPage() {
  const [params, setParams] = useSearchParams();
  const register = params.get('tab') === 'register';
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null); setSuccess(null);
    try {
      if (register) {
        await authApi.register({ username: username.trim(), email: email.trim(), password, displayName: displayName.trim() });
        setParams({}); setPassword(''); setSuccess('Аккаунт создан. Подготовка профиля может занять несколько секунд. После этого можно войти.');
      } else await login({ email: email.trim(), password });
    } catch (err) {
      const problem = err as Error & { code?: string };
      setError(problem.code === 'ACCOUNT_STILL_PENDING' ? 'Профиль ещё создаётся. Повторите вход через несколько секунд.' : problem.message);
    } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background flex flex-col px-4 py-8"><header className="w-full max-w-5xl mx-auto"><Link to="/" className="text-xl font-bold tracking-tight">Editorial</Link></header><main className="my-auto py-12 w-full max-w-md mx-auto"><form onSubmit={submit} className="bg-surface rounded-xl border border-outline-variant p-6 sm:p-8 space-y-5"><h1 className="text-2xl font-bold">{register ? 'Создать аккаунт' : 'Войти в аккаунт'}</h1>
    {register && <Input label="Имя пользователя" value={username} onChange={event => setUsername(event.target.value)} required maxLength={100} autoComplete="username" disabled={busy} />}
    {register && <Input label="Отображаемое имя" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} autoComplete="nickname" disabled={busy} />}
    <Input label="Электронная почта" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} autoComplete="email" disabled={busy} />
    <Input label="Пароль" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={6} maxLength={100} autoComplete={register ? 'new-password' : 'current-password'} disabled={busy} helperText={register ? 'От 6 до 100 символов' : undefined} />
    <label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />Показать пароль</label>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}{success && <p role="status" className="text-sm text-secondary">{success}</p>}
    <Button type="submit" isLoading={busy} className="w-full">{register ? 'Зарегистрироваться' : 'Войти'}</Button>
    <button type="button" disabled={busy} className="text-sm text-secondary hover:underline" onClick={() => { setParams(register ? {} : { tab: 'register' }); setError(null); setSuccess(null); }}>{register ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт'}</button>
  </form></main></div>;
}
