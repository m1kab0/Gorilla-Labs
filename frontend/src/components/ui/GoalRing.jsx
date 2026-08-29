import { useEffect, useState } from 'react';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Pierścień celu tygodnia — animowane wypełnienie i licznik przy wejściu. */
export default function GoalRing({ value, goal, size = 56 }) {
  const target = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = shown;
    const step = (now) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${value} z ${goal} treningów w tym tygodniu`}>
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={RADIUS} fill="none" stroke="var(--color-surface)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          className="transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold text-text">
        {shown}%
      </div>
    </div>
  );
}
