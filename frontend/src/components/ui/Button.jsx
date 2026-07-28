import { useState } from 'react';

const VARIANT_CLASSES = {
  primary:
    'bg-accent hover:bg-accent-hover text-accent-fg font-display font-semibold uppercase tracking-wide text-sm rounded px-[18px] py-[14px] transition-[background,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-transparent border border-line text-text hover:border-text-muted font-body text-sm rounded px-4 py-3',
  link: 'bg-transparent border-none text-text-muted hover:text-text underline underline-offset-2 text-[13px] p-1',
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
      className={`relative ${VARIANT_CLASSES[variant]} ${pulseClasses} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {pulseOnClick && (
        <span
          className={`absolute -right-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-success text-[13px] text-accent-fg transition-all duration-150 ${
            pulsed ? 'scale-100 opacity-100' : 'scale-[0.4] opacity-0'
          }`}
        >
          ✓
        </span>
      )}
    </button>
  );
}
