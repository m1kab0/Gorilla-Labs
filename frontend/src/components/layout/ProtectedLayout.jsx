import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser, useLogout } from '../../lib/auth';

export default function ProtectedLayout() {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="flex flex-col items-center gap-3 border-b border-line px-5 pb-[18px] pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <Link
          to="/workouts"
          className="flex items-center gap-2.5 font-display text-[33px] font-bold uppercase tracking-wide text-text no-underline"
        >
          <img src="/gorilla-logo.png" alt="" className="h-[150px] w-[150px] shrink-0" />
          Gorilla
        </Link>
        <div className="flex items-center justify-center gap-4">
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={() => navigate('/plans')}
          >
            Plany
          </button>
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={() => navigate('/exercises')}
          >
            Ćwiczenia
          </button>
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={handleLogout}
          >
            Wyloguj
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
