export default function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="rounded border border-accent bg-danger-bg px-3.5 py-2.5 text-[13px] text-[#F0C7BE]">
      {children}
    </div>
  );
}
