/**
 * Przełącznik dwóch–trzech równorzędnych trybów. Używany zamiast układania
 * obu wariantów jeden pod drugim (jak dotąd robił ekran treningu z dwoma
 * formularzami serii) — koszt interakcji spada z „przewiń i wybierz” do jednego tapnięcia.
 */
export default function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 rounded-md bg-surface p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-11 flex-1 rounded-sm px-4 text-label font-medium uppercase tracking-wider transition-colors duration-150 ${
              active ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
