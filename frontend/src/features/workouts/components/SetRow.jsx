export default function SetRow({ set, index, maxWeight, onDelete }) {
  const plateWidthPct = set.weight_kg ? Math.max(15, Math.round((set.weight_kg / maxWeight) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 border-t border-line bg-surface px-3.5 py-3">
      <div className="w-[18px] font-mono text-xs text-text-muted">#{index + 1}</div>
      <div className="flex h-[22px] flex-1 items-center gap-0.5">
        <div className="h-1 flex-1 rounded-sm bg-line" />
        {set.weight_kg ? (
          <div
            className="flex-shrink-0 rounded-[3px] bg-accent"
            style={{ width: `${plateWidthPct}%`, height: Math.min(20, 8 + set.weight_kg / 8) }}
          />
        ) : null}
        <div className="h-1 flex-1 rounded-sm bg-line" />
      </div>
      <div className="flex items-baseline gap-1 whitespace-nowrap font-mono text-[15px] font-semibold">
        <span className="text-xl text-text">{set.reps}</span>
        <span className="text-[11px] text-text-muted">reps</span>
        {set.weight_kg ? (
          <>
            <span className="text-accent">{set.weight_kg}</span>
            <span className="text-[11px] text-text-muted">kg</span>
          </>
        ) : null}
      </div>
      <button className="p-1.5 text-base text-text-muted hover:text-danger-text" title="Usuń serię" onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}
