import { useEffect, useState } from 'react';

/**
 * Krótki wystrzał „talerzy” po domknięciu celu tygodnia. Zasada szczytu i
 * końca mówi, że użytkownik zapamięta moment najintensywniejszy i ostatni —
 * w dzienniku treningowym tym szczytem jest zamknięcie tygodnia, a nie
 * dodanie kolejnej serii. Dotąd to zdarzenie mijało bez żadnego sygnału.
 *
 * Kosztuje ~1 s, sam się sprząta i respektuje `prefers-reduced-motion`
 * (globalna reguła w globals.css ścina czas animacji do zera).
 */
const PIECES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    dx: `${Math.cos(angle) * (90 + (i % 4) * 26)}px`,
    dy: `${Math.sin(angle) * (90 + (i % 3) * 30) - 40}px`,
    rot: `${(i % 2 ? 1 : -1) * (180 + i * 24)}deg`,
    delay: `${(i % 5) * 40}ms`,
    color: i % 3 === 0 ? 'bg-success' : 'bg-accent',
  };
});

export default function Celebration({ show, message, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return undefined;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden="true">
      <div className="relative">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className={`absolute h-2 w-3 animate-confetti rounded-sm ${p.color}`}
            style={{ '--dx': p.dx, '--dy': p.dy, '--rot': p.rot, animationDelay: p.delay }}
          />
        ))}
      </div>
      {message && (
        <div className="animate-pop rounded-xl border border-accent-line bg-surface px-6 py-4 text-center shadow-raised">
          <div className="font-display text-title font-semibold uppercase tracking-wide text-accent">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
