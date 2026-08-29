import { NavLink } from 'react-router-dom';

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

/* Sztanga z talerzami — treningi */
function BarbellIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2.5" y="9" width="3" height="6" rx="1" />
      <rect x="18.5" y="9" width="3" height="6" rx="1" />
      <rect x="6.5" y="6.5" width="3.5" height="11" rx="1.2" />
      <rect x="14" y="6.5" width="3.5" height="11" rx="1.2" />
      <path d="M10 12h4" />
    </svg>
  );
}

/* Kalendarz — plany */
function PlanIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3.5 9.5h17" />
      <path d="M7.5 13.5h3M13.5 13.5h3M7.5 17h3" />
    </svg>
  );
}

/* Siatka 2×2 — biblioteka ćwiczeń */
function LibraryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  );
}

const TABS = [
  { to: '/workouts', label: 'Treningi', Icon: BarbellIcon },
  { to: '/plans', label: 'Plany', Icon: PlanIcon },
  { to: '/exercises', label: 'Ćwiczenia', Icon: LibraryIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[560px] -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] no-underline transition-colors duration-200 ${
                isActive ? 'text-text [&_svg]:stroke-accent' : 'text-text-muted [&_svg]:stroke-text-muted'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
