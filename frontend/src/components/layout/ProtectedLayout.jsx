import { Navigate, Outlet, Link } from 'react-router-dom';
import { useUser } from '../../lib/auth';
import BottomNav from './BottomNav';
import SettingsButton from './SettingsButton';

export default function ProtectedLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="relative flex flex-col items-center gap-3 border-b border-line px-5 pb-[18px] pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <div className="absolute right-4 top-[calc(24px+env(safe-area-inset-top,0px))]">
          <SettingsButton />
        </div>
        <Link
          to="/workouts"
          className="flex items-center gap-2.5 font-display text-[33px] font-bold uppercase tracking-wide text-text no-underline"
        >
          <img src="/gorilla-logo.png" alt="" className="h-[150px] w-[150px] shrink-0" />
          Gorilla
        </Link>
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}
