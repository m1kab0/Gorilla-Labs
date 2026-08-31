/**
 * Kafel „liczba + podpis”. Wartość jest wizualnie ważniejsza od etykiety —
 * odwrotna proporcja (duże „Serie”, małe „12”) to najczęstszy błąd hierarchii
 * w podsumowaniach.
 */
export default function StatTile({ value, label, suffix, highlight = false }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 overflow-hidden rounded-md px-3 py-4 ${
        highlight ? 'bg-accent-soft' : 'bg-surface'
      }`}
    >
      <div className="flex items-baseline gap-1 whitespace-nowrap">
        <span
          className={`font-mono text-metric font-semibold tabular-nums ${
            highlight ? 'text-accent' : 'text-text'
          }`}
        >
          {value}
        </span>
        {suffix && <span className="font-mono text-label text-text-muted">{suffix}</span>}
      </div>
      <span className="truncate text-label uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  );
}
