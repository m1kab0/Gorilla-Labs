import { useEffect, useRef, useState } from 'react';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Pierścień celu tygodnia. Poza animowanym wypełnieniem doszły dwie rzeczy:
 *
 * 1. W środku jest teraz „3/5”, a nie „60%”. Procent trzeba przeliczyć z
 *    powrotem na treningi, żeby coś z niego wynikało; ułamek mówi wprost,
 *    ile jeszcze zostało — a to jedyne pytanie, które użytkownik tu zadaje.
 * 2. Po domknięciu celu pierścień przechodzi na kolor sukcesu i „strzela”
 *    pulsem. Zasada szczytu i końca: moment domknięcia tygodnia jest
 *    najintensywniejszym punktem całego przepływu, a dotąd nie działo się nic.
 */
export default function GoalRing({ value, goal, size = 64, onComplete }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const done = goal > 0 && value >= goal;
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const celebratedRef = useRef(false);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = shownRef.current;
    const step = (now) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (pct - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  useEffect(() => {
    if (done && !celebratedRef.current) {
      celebratedRef.current = true;
      onComplete?.();
    }
    if (!done) celebratedRef.current = false;
  }, [done, onComplete]);

  const stroke = done ? 'var(--color-success)' : 'var(--color-accent)';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} z ${goal} treningów w tym tygodniu`}
    >
      {done && <div className="absolute inset-0 animate-pulse-ring rounded-full bg-success" aria-hidden="true" />}
      <svg className="relative -rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={RADIUS} fill="none" stroke="var(--color-surface)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          className="transition-[stroke-dashoffset,stroke] duration-200"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-label font-semibold tabular-nums text-text">
        {value}/{goal}
      </div>
    </div>
  );
}
