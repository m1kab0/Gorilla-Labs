export default function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="flex animate-rise items-start gap-3 rounded-md border border-danger bg-danger-bg px-4 py-3 text-body text-danger-text"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger font-mono text-label font-semibold text-text"
      >
        !
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
