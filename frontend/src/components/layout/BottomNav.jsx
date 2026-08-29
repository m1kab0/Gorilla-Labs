import { NavLink } from 'react-router-dom';

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

/* Sztanga — treningi */
function BarbellIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 8v8M6 8v8M18 8v8M21 8v8M6 12h12" />
    </svg>
  );
}

/* Kartka z listą — plany */
function PlanIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 10h7M9 14h7M9 18h4" />
    </svg>
  );
}

/* Hantla — biblioteka ćwiczeń */
function DumbbellIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
    </svg>
  );
}

const TABS = [
  { to: '/workouts', label: 'Treningi', Icon: BarbellIcon },
  { to: '/plans', label: 'Plany', Icon: PlanIcon },
  { to: '/exercises', label: 'Ćwiczenia', Icon: DumbbellIcon },
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
