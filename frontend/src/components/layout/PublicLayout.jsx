import { Outlet, Navigate, Link } from 'react-router-dom';
import { useUser } from '../../lib/auth';

export default function PublicLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;
  if (user) return <Navigate to="/workouts" replace />;

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="flex items-baseline justify-between border-b border-line px-5 pb-[18px] pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <Link
          to="/login"
          className="flex items-baseline gap-2 font-display text-[22px] font-bold uppercase tracking-wide text-text no-underline"
        >
          <span className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-accent" />
          Żelazo
        </Link>
      </header>
      <Outlet />
    </div>
  );
}
