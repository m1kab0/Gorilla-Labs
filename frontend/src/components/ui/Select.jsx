export default function Select({ label, id, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-label uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`min-h-12 w-full appearance-none rounded-md border border-line bg-surface bg-[length:11px] bg-[position:right_16px_center] bg-no-repeat px-4 pr-10 font-body text-body text-text transition-colors focus:border-accent ${className}`}
        style={{
          // Strzałka jako data-URI: natywna strzałka <select> na macOS/Androidzie
          // rysuje się w kolorze systemowym i na ciemnym tle bywa niewidoczna.
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%239EA0AB' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
