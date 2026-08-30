/* Plan jako blok: nagłówek, spis ćwiczeń, żółte CTA na całą szerokość.
   Start planu to główna akcja ekranu, więc dostaje pełny przycisk zamiast
   małego guzika obok tytułu. */
export default function PlanCard({ plan, index = 0, onStart, onDelete, starting }) {
  return (
    <div
      className="animate-rise overflow-hidden rounded-[10px] bg-surface-raised"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="font-display text-[15px] uppercase tracking-wide">{plan.name}</div>
        <button
          className="-mr-1 p-1 text-base text-text-muted transition-colors hover:text-danger-text"
          title="Usuń plan"
          onClick={() => onDelete(plan)}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-4 pt-2.5 text-[12.5px] text-text-muted">
        {plan.exercises.length === 0 ? (
          <div>Brak ćwiczeń w planie</div>
        ) : (
          plan.exercises.map((e) => (
            <div key={e.id ?? e.exercise_name} className="flex justify-between gap-3">
              <span>{e.exercise_name}</span>
              {e.target_sets ? (
                <span className="shrink-0 font-mono text-text">
                  {e.target_sets}×{e.target_reps ?? '—'}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

      <button
        className="mx-4 mb-4 w-[calc(100%-32px)] rounded-md bg-accent px-4 py-3 font-display text-[13px] font-semibold uppercase text-accent-fg transition-colors hover:bg-accent-hover active:scale-[.98] disabled:opacity-60"
        disabled={starting}
        onClick={() => onStart(plan)}
      >
        {starting ? 'Startuję…' : 'Zacznij trening'}
      </button>
    </div>
  );
}
