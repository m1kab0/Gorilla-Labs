export default function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="rounded border border-danger bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger-text">
      {children}
    </div>
  );
}
