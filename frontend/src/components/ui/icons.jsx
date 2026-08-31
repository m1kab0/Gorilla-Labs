/**
 * Jeden zestaw ikon dla całej aplikacji. Wcześniej ikony żyły tylko w
 * BottomNav, więc pusty stan, nagłówek i podsumowania musiały radzić sobie
 * emoji albo znakami „✕/+”. Spójny zestaw robi z nich element systemu,
 * a nie ozdobę pojedynczego ekranu.
 *
 * Wszystkie rysowane obrysem `currentColor` — kolor sterowany klasą rodzica.
 */
function Svg({ size = 22, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* Sztanga z talerzami — treningi */
export function BarbellIcon(props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="9" width="3" height="6" rx="1" />
      <rect x="18.5" y="9" width="3" height="6" rx="1" />
      <rect x="6.5" y="6.5" width="3.5" height="11" rx="1.2" />
      <rect x="14" y="6.5" width="3.5" height="11" rx="1.2" />
      <path d="M10 12h4" />
    </Svg>
  );
}

/* Kalendarz — plany */
export function PlanIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3.5 9.5h17" />
      <path d="M7.5 13.5h3M13.5 13.5h3M7.5 17h3" />
    </Svg>
  );
}

/* Siatka 2×2 — biblioteka ćwiczeń */
export function LibraryIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

/* Słupki rosnące — postępy */
export function ProgressIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="13" width="3.5" height="7.5" rx="1.2" />
      <rect x="10.5" y="8.5" width="3.5" height="12" rx="1.2" />
      <rect x="16" y="4" width="3.5" height="16.5" rx="1.2" />
    </Svg>
  );
}

/* Płomień — seria tygodni pod rząd */
export function FlameIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 2.8s5.4 4 5.4 8.9a5.4 5.4 0 1 1-10.8 0C6.6 8.6 9.3 7 9.3 7s-.4 2.2.9 3c1.4-1.2 1.8-4.6 1.8-7.2z" />
      <path d="M12 20.6a2.6 2.6 0 0 0 2.6-2.6c0-1.7-2.6-3.6-2.6-3.6s-2.6 1.9-2.6 3.6a2.6 2.6 0 0 0 2.6 2.6z" />
    </Svg>
  );
}

/* Puchar — rekordy życiowe */
export function TrophyIcon(props) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" />
      <path d="M12 14v3.5M8.5 20.5h7M9.8 17.5h4.4l.8 3H9z" />
    </Svg>
  );
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  );
}

export function CloseIcon({ size = 16, ...props }) {
  return (
    <Svg size={size} strokeWidth="2.4" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function SearchIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 18, ...props }) {
  return (
    <Svg size={size} {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Svg>
  );
}
