import { NavLink } from 'react-router-dom';

/* Zębatka w headerze — wejście do /settings.
   Obraca się na hover, „wciska” na tap, na aktywnej trasie świeci akcentem.

   Stan aktywny miał `text-surface` na żółtym tle — czyli grafit #2F2F2F na
   #FFFF82. CLAUDE.md mówi wprost: treść NA żółtym to zawsze `accent-fg`.
   Poprawione, bo kontrast grafitu na żółci jest wyraźnie słabszy niż czerni.
   Pole dotyku podniesione z 38 do 44 px. */
export default function SettingsButton() {
  return (
    <NavLink
      to="/settings"
      aria-label="Ustawienia"
      className={({ isActive }) =>
        `flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-all duration-200 hover:rotate-[35deg] hover:border-accent hover:text-accent active:scale-95 ${
          isActive
            ? 'border-accent bg-accent text-accent-fg'
            : 'border-line bg-transparent text-text-muted'
        }`
      }
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </NavLink>
  );
}
