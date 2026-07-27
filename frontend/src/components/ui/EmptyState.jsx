export default function EmptyState({ children }) {
  return (
    <div className="rounded border border-dashed border-line px-5 py-8 text-center text-sm text-text-muted">
      {children}
    </div>
  );
}
