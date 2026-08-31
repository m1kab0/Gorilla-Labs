import { Outlet, Navigate, Link } from 'react-router-dom';
import { useUser } from '../../lib/auth';

/**
 * Ekrany logowania/rejestracji to jedyne miejsce, gdzie duże logo pracuje na
 * rzecz użytkownika (rozpoznanie aplikacji), a nie przeciwko niemu — formularz
 * i tak jest krótki, więc miejsce jest. Poza nimi brand żyje w pasku 40 px.
 */
export default function PublicLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;
  if (user) return <Navigate to="/workouts" replace />;

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="flex flex-col items-center gap-4 px-6 pb-8 pt-[calc(40px+env(safe-area-inset-top,0px))]">
        <Link
          to="/login"
          className="flex flex-col items-center gap-3 font-display text-display font-bold uppercase tracking-wide text-text no-underline"
        >
          <img
            src="/gorilla-logo.png"
            alt=""
            className="h-24 w-24 shrink-0 rounded-2xl shadow-raised"
          />
          Gorilla
        </Link>
        <p className="m-0 text-body text-text-muted">Dziennik treningowy</p>
      </header>
      <Outlet />
    </div>
  );
}
