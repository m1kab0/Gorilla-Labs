import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../../lib/auth';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate('/workouts');
    } catch {
      // błąd jest już wystawiony niżej przez login.error
    }
  }

  return (
    <div className="flex flex-col gap-6 px-6 pb-12">
      <h1 className="m-0 font-display text-display font-semibold tracking-wide">Zaloguj się</h1>
      <ErrorBanner>{login.error?.message}</ErrorBanner>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          id="login-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="login-password"
          label="Hasło"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={login.isPending}>
          {login.isPending ? 'Logowanie…' : 'Zaloguj'}
        </Button>
      </form>
      <div className="text-center text-body text-text-muted">
        Nie masz konta?{' '}
        <Link to="/register" className="text-accent underline underline-offset-2">
          Zarejestruj się
        </Link>
      </div>
    </div>
  );
}
