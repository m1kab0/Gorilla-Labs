import { useRef, useState } from 'react';

/**
 * Suwak przeciągany palcem/myszą z ręcznym wpisem po tapnięciu liczby.
 * Kontrolowany: value + onChange(number). Krok i zakres z propsów, bo
 * powtórzenia liczymy co 1, a ciężar co 2.5 kg.
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

  function valueFromClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + t * (max - min);
    return Math.round(raw / step) * step;
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
    if (!Number.isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, Math.round(parsed / step) * step)));
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between">
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
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
            className="w-[110px] rounded border border-accent bg-surface px-2 py-1 font-mono text-[26px] font-semibold text-text outline-none"
          />
        ) : (
          <button
            type="button"
            title="Tapnij, aby wpisać ręcznie"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            className="font-mono text-[26px] font-semibold leading-none text-text"
          >
            {value}
          </button>
        )}
        <span className="mb-1 font-mono text-[11px] text-text-muted">{suffix || label}</span>
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
          if (e.key === 'ArrowRight') onChange(Math.min(max, value + step));
          if (e.key === 'ArrowLeft') onChange(Math.max(min, value - step));
        }}
        className="relative h-[26px] cursor-grab touch-none rounded-[13px] bg-surface active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[13px] bg-accent"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
