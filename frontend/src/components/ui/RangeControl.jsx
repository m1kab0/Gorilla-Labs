import { useRef, useState } from 'react';

/**
 * Suwak przeciągany palcem/myszą z ręcznym wpisem po tapnięciu liczby.
 * Kontrolowany: value + onChange(number). Krok i zakres z propsów, bo
 * powtórzenia liczymy co 1, a ciężar co 2.5 kg.
 *
 * Doszły dwa przyciski ±krok. Suwak jest świetny do zgrubnego ustawienia,
 * ale trafienie palcem w 82.5 kg na 200-kilogramowej skali to loteria —
 * a korekta o jeden krok to najczęstsza operacja między seriami.
 */
export default function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
}) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step));

  function valueFromClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return clamp(min + t * (max - min));
  }

  function handlePointerDown(e) {
    if (editing) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(valueFromClientX(e.clientX));
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    onChange(valueFromClientX(e.clientX));
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function commitDraft() {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            aria-label={label}
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-[120px] rounded-sm border border-accent bg-surface px-3 py-1 font-mono text-metric font-semibold text-text outline-none"
          />
        ) : (
          <button
            type="button"
            title="Tapnij, aby wpisać ręcznie"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            className="flex items-baseline gap-1.5 font-mono text-metric font-semibold leading-none text-text"
          >
            {value}
            <span className="font-mono text-label text-text-muted">{suffix || label}</span>
          </button>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`${label}: mniej`}
            onClick={() => onChange(clamp(value - step))}
            className="h-11 w-11 rounded-full bg-surface-raised font-mono text-title text-text transition-transform active:scale-90"
          >
            −
          </button>
          <button
            type="button"
            aria-label={`${label}: więcej`}
            onClick={() => onChange(clamp(value + step))}
            className="h-11 w-11 rounded-full bg-surface-raised font-mono text-title text-text transition-transform active:scale-90"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onChange(clamp(value + step));
          if (e.key === 'ArrowLeft') onChange(clamp(value - step));
        }}
        className="relative h-8 cursor-grab touch-none rounded-full bg-surface active:cursor-grabbing"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        <div
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow-card"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
