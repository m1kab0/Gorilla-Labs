import { useEffect, useState } from 'react';

export default function TextField({ label, id, invalid = false, hint, className = '', ...props }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!invalid) return undefined;
    setShake(true);
    const t = setTimeout(() => setShake(false), 320);
    return () => clearTimeout(t);
  }, [invalid]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-label uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={invalid || undefined}
        className={`min-h-12 w-full rounded-md border bg-surface px-4 font-body text-body text-text transition-colors placeholder:text-text-muted/70 ${
          invalid ? 'border-danger-text' : 'border-line focus:border-accent'
        } ${shake ? 'animate-shake' : ''} ${className}`}
        {...props}
      />
      {hint && <span className="text-label text-text-muted">{hint}</span>}
    </div>
  );
}
