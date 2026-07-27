import { useEffect, useState } from 'react';

export default function TextField({ label, id, invalid = false, className = '', ...props }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!invalid) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 320);
    return () => clearTimeout(t);
  }, [invalid]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded border bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold ${
          invalid ? 'border-accent-text' : 'border-line'
        } ${shake ? 'animate-shake' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}
