/**
 * Szkielet ładowania. `height` pozwala dopasować go do tego, co faktycznie
 * się doładuje — szkielet w rozmiarze docelowej treści nie przesuwa układu,
 * gdy dane dojdą (CLS), a szkielet w jednym uniwersalnym rozmiarze przesuwa.
 */
export default function Skeleton({ className = '', height = 64 }) {
  return (
    <div
      style={{ height }}
      className={`animate-shimmer rounded-lg bg-[linear-gradient(100deg,var(--color-surface)_30%,var(--color-surface-raised)_50%,var(--color-surface)_70%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

/** Kilka szkieletów z rzędu — najczęstszy przypadek na listach. */
export function SkeletonList({ count = 3, height = 64 }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}
