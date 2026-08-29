/* Seria jako słupki talerzy + odczyt „reps × kg”. Wysokość słupków skaluje
   się do najcięższej serii w treningu, więc progres widać bez czytania liczb. */
export default function SetRow({ set, maxWeight, onDelete }) {
  const ratio = set.weight_kg && maxWeight ? set.weight_kg / maxWeight : 0;
  const bars = Array.from({ length: 3 }, (_, i) => Math.max(5, Math.round(22 * ratio) - i * 4));

  return (
    <div className="flex items-center gap-2.5 border-t border-surface-raised px-3.5 py-3">
      <div className="flex h-[22px] items-end gap-0.5" aria-hidden="true">
        {set.weight_kg
          ? bars.map((h, i) => <div key={i} className="w-[5px] rounded-sm bg-accent" style={{ height: h }} />)
          : <div className="h-1 w-[17px] rounded-sm bg-line" />}
      </div>
      <div className="flex-1 font-mono text-[15px] font-semibold">
        {set.reps}×{set.weight_kg ? <span className="text-accent">{set.weight_kg} kg</span> : <span className="text-text-muted">bw</span>}
      </div>
      <button className="p-1.5 text-base text-text-muted transition-colors hover:text-danger-text" title="Usuń serię" onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}
