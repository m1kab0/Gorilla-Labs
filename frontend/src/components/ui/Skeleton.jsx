export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`h-[52px] animate-shimmer rounded bg-[linear-gradient(100deg,var(--color-surface)_30%,var(--color-surface-raised)_50%,var(--color-surface)_70%)] bg-[length:200%_100%] ${className}`}
    />
  );
}
