import { Navigate, Outlet, Link } from 'react-router-dom';
import { useUser } from '../../lib/auth';
import BottomNav from './BottomNav';
import SettingsButton from './SettingsButton';

/**
 * Nagłówek był największym problemem układu: logo 150 × 150 px plus napis
 * zabierały ~200 px na każdym ekranie, na telefonie o wysokości 667 px.
 * Zanim pojawiła się pierwsza treść, jedna trzecia ekranu była zajęta przez
 * brand — i nie przewijała się, bo nagłówek był częścią strony.
 *
 * Teraz: 40-pikselowe logo w przyklejonym pasku, ta sama wysokość co pasek
 * systemowy, z rozmyciem tła. Duże logo zostaje tam, gdzie ma sens —
 * na ekranach logowania (PublicLayout).
 */
export default function ProtectedLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-bg/90 px-6 pb-3 pt-[calc(12px+env(safe-area-inset-top,0px))] backdrop-blur-md">
        <Link
          to="/workouts"
          className="flex items-center gap-2 font-display text-title font-bold uppercase tracking-wide text-text no-underline"
        >
          <img src="/gorilla-logo.png" alt="" className="h-10 w-10 shrink-0 rounded-sm" />
          Gorilla
        </Link>
        <SettingsButton />
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}
