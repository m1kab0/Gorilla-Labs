import { PlusIcon } from './icons';

/**
 * Główna akcja ekranu w strefie kciuka. Do tej pory „+ Nowy trening” siedział
 * u góry listy — czyli w miejscu, do którego na telefonie trzeba przełożyć rękę.
 * FAB ląduje tuż nad dolną nawigacją i zostaje na miejscu przy przewijaniu.
 */
export default function Fab({ label, onClick, disabled = false, icon }) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-1/2 z-30 flex w-full max-w-[560px] -translate-x-1/2 justify-end px-6">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="pointer-events-auto flex min-h-14 items-center gap-2 rounded-full bg-accent pl-5 pr-6 font-display text-body font-semibold uppercase tracking-wide text-accent-fg shadow-accent transition-transform duration-150 active:scale-95 disabled:opacity-60"
      >
        {icon ?? <PlusIcon size={20} />}
        {label}
      </button>
    </div>
  );
}
