/* Szukajka + filtry grup mięśniowych z 1B. Stan trzyma rodzic (routes/exercises). */
export default function ExerciseSearch({ query, onQueryChange, groups, activeGroup, onGroupChange }) {
  return (
    <div className="flex flex-col gap-2.5">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Szukaj…"
        className="rounded-lg border-none bg-surface-raised px-3.5 py-3 text-[13px] text-text outline-none placeholder:text-text-muted focus:ring-1 focus:ring-accent"
      />
      {groups.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => onGroupChange(activeGroup === g ? null : g)}
              className={`rounded-2xl px-3 py-2 text-xs transition-colors ${
                activeGroup === g ? 'bg-accent text-accent-fg' : 'bg-surface-raised text-text'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
