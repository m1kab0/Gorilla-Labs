/**
 * Prosty wykres słupkowy na czystym CSS — bez biblioteki, bo jedyne, czego
 * potrzebuje ekran postępów, to porównanie kilkunastu wartości obok siebie.
 * Ostatni słupek jest wyróżniony akcentem: „gdzie jestem teraz” to informacja,
 * której szuka się pierwszą sekundę.
 */
export default function BarChart({ data, formatValue = (v) => v, emptyLabel = 'Brak danych' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasAny = data.some((d) => d.value > 0);

  if (!hasAny) {
    return (
      <div className="flex h-[140px] items-center justify-center text-body text-text-muted">{emptyLabel}</div>
    );
  }

  return (
    <div>
      <div className="flex h-[148px] items-end gap-1.5">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-1.5">
              <span
                className={`text-center font-mono text-label tabular-nums ${
                  isLast ? 'text-accent' : 'text-text-muted'
                } ${d.value === 0 ? 'opacity-0' : ''}`}
              >
                {formatValue(d.value)}
              </span>
              {/* Wysokość słupka liczona wewnątrz kontenera o ustalonej wysokości —
                  procent na dziecku auto-wysokiego flexboxa rozwiązuje się do zera. */}
              <div className="flex h-[112px] items-end">
                <div
                  className={`w-full origin-bottom animate-bar-grow rounded-sm ${
                    isLast ? 'bg-accent' : 'bg-surface-raised'
                  }`}
                  style={{ height: `${Math.max(3, pct)}%`, animationDelay: `${i * 45}ms` }}
                  title={`${d.label}: ${formatValue(d.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={d.label}
            className={`flex-1 text-center text-label ${
              i === data.length - 1 ? 'text-text' : 'text-text-muted'
            }`}
          >
            {d.shortLabel ?? d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
