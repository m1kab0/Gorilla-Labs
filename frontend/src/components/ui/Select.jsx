export default function Select({ label, id, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
