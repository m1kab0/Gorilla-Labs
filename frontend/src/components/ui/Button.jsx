import { useState } from 'react';
import { haptic } from '../../lib/settings';

/**
 * Warianty:
 * — primary  : żółte CTA, jedno na ekran (reguła 60/30/10),
 * — secondary: obrys — akcja równorzędna, ale nie główna,
 * — soft     : akcent w 8% — „prawie CTA” tam, gdzie dwa żółte przyciski obok
 *              siebie zabiłyby hierarchię (np. „+ Dodaj ćwiczenie do planu”),
 * — link     : akcja tekstowa.
 *
 * Wszystkie mają min-h-11 (44 px) — wcześniej `secondary` i `link` wypadały
 * poniżej progu z wytycznych dotykowych.
 */
const VARIANT_CLASSES = {
  primary:
    'bg-accent hover:bg-accent-hover text-accent-fg font-display font-semibold uppercase tracking-wide text-body rounded-md px-6 shadow-accent active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-transparent border border-line text-text hover:border-text-muted font-body text-body rounded-md px-6 active:scale-[0.98] disabled:opacity-50',
  soft:
    'bg-accent-soft border border-accent-line text-accent hover:bg-accent/15 font-body text-body rounded-md px-6 active:scale-[0.98] disabled:opacity-50',
  link: 'bg-transparent border-none text-text-muted hover:text-text text-body px-2',
};

export default function Button({
  variant = 'primary',
  pulseOnClick = false,
  onClick,
  className = '',
  children,
  ...props
}) {
  const [pulsed, setPulsed] = useState(false);

  function handleClick(e) {
    if (pulseOnClick) {
      haptic(14);
      setPulsed(true);
      setTimeout(() => setPulsed(false), 650);
    }
    onClick?.(e);
  }

  // Klasy pulsu muszą być `!`-ważne: o kaskadzie decyduje kolejność reguł w
  // wygenerowanym CSS, a nie kolejność klas w stringu, więc samo dopisanie
  // tła po bg-accent nic by nie dało.
  const pulseClasses = pulsed ? 'bg-success! hover:bg-success! text-accent-fg!' : '';

  return (
    <button
      className={`relative inline-flex min-h-11 items-center justify-center transition-[background,transform,border-color] duration-150 ${VARIANT_CLASSES[variant]} ${pulseClasses} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {pulseOnClick && (
        <span
          className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-body text-accent-fg transition-all duration-150 ${
            pulsed ? 'scale-100 opacity-100' : 'scale-[0.4] opacity-0'
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
      )}
    </button>
  );
}
