import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../../lib/auth';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function RegisterForm() {
  const register = useRegister();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, password, displayName });
      navigate('/workouts');
    } catch {
      // błąd jest już wystawiony niżej przez register.error
    }
  }

  return (
    <div className="flex flex-col gap-6 px-6 pb-12">
      <h1 className="m-0 font-display text-display font-semibold tracking-wide">Załóż konto</h1>
      <ErrorBanner>{register.error?.message}</ErrorBanner>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          id="register-name"
          label="Imię / nick"
          type="text"
          autoComplete="nickname"
          hint="Pokażemy je w powitaniu na liście treningów."
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="register-password"
          label="Hasło"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          hint="Minimum 6 znaków."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={register.isPending}>
          {register.isPending ? 'Tworzenie konta…' : 'Utwórz konto'}
        </Button>
      </form>
      <div className="text-center text-body text-text-muted">
        Masz już konto?{' '}
        <Link to="/login" className="text-accent underline underline-offset-2">
          Zaloguj się
        </Link>
      </div>
    </div>
  );
}
