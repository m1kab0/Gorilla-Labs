import { useEffect, useRef, useState } from 'react';

const RADIUS = 33;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * FAB, który wykonuje akcję po przytrzymaniu (domyślnie 850 ms). Pierścień
 * pokazuje postęp; puszczenie przed końcem anuluje. Chroni przed przypadkowym
 * dopisaniem serii jednym tapnięciem.
 */
export default function HoldToConfirmButton({
  onConfirm,
  holdMs = 850,
  disabled = false,
  hint,
  children = '+',
}) {
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const holdingRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function tick(now) {
    if (!holdingRef.current) return;
    const t = Math.min(1, (now - startRef.current) / holdMs);
    setProgress(t);
    if (t >= 1) {
      holdingRef.current = false;
      setProgress(0);
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
      onConfirm();
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  function start(e) {
    if (disabled) return;
    e.preventDefault();
    holdingRef.current = true;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[78px] w-[78px]">
        {flash && (
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
        )}
        <svg className="absolute inset-0 -rotate-90" width="78" height="78" aria-hidden="true">
          <circle cx="39" cy="39" r={RADIUS} fill="none" stroke="var(--color-surface)" strokeWidth="5" />
          <circle
            cx="39"
            cy="39"
            r={RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <button
          type="button"
          disabled={disabled}
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          className="absolute inset-2 touch-none rounded-full bg-accent font-display text-[22px] font-bold text-accent-fg transition-transform duration-100 active:scale-[0.94] disabled:opacity-40"
        >
          {children}
        </button>
      </div>
      {hint && <div className="text-center text-[11px] text-text-muted">{hint}</div>}
    </div>
  );
}
