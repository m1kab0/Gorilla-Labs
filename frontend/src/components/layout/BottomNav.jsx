import { NavLink } from 'react-router-dom';
import { BarbellIcon, PlanIcon, LibraryIcon, ProgressIcon } from '../ui/icons';
import { haptic } from '../../lib/settings';

const TABS = [
  { to: '/workouts', label: 'Treningi', Icon: BarbellIcon },
  { to: '/plans', label: 'Plany', Icon: PlanIcon },
  { to: '/exercises', label: 'Ćwiczenia', Icon: LibraryIcon },
  { to: '/progress', label: 'Postępy', Icon: ProgressIcon },
];

/**
 * Dolna nawigacja z czterema zakładkami. Zmiany wobec poprzedniej wersji:
 * — doszły „Postępy” (nowy ekran),
 * — każdy cel ma minimum 56 px wysokości zamiast ~40 px z 10-pikselowym podpisem,
 * — aktywna zakładka dostaje kreskę u góry: sam kolor ikony to za słaby sygnał
 *   na ciemnym tle, zwłaszcza przy żółci, która „świeci” także w hover,
 * — tło jest półprzezroczyste z rozmyciem, żeby lista pod spodem nie urywała się płasko.
 */
export default function BottomNav() {
  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[560px] -translate-x-1/2 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
    >
      <div className="flex">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => haptic(8)}
            className={({ isActive }) =>
              `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-label no-underline transition-colors duration-200 ${
                isActive ? 'text-accent' : 'text-text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-0.5 rounded-full bg-accent transition-all duration-200 ${
                    isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
                <Icon size={22} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
