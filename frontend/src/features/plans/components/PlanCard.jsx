import IconButton from '../../../components/ui/IconButton';
import { CloseIcon } from '../../../components/ui/icons';

/* Plan jako blok: nagłówek, spis ćwiczeń, żółte CTA na całą szerokość.
   Start planu to główna akcja ekranu, więc dostaje pełny przycisk zamiast
   małego guzika obok tytułu.

   Doszła liczba ćwiczeń przy nazwie (przy trzech planach o podobnym składzie
   to pierwsza rzecz, po której się je rozróżnia) i pełne pole dotyku na
   przycisku usuwania. */
export default function PlanCard({ plan, index = 0, onStart, onDelete, starting }) {
  const count = plan.exercises.length;

  return (
    <div
      className="animate-rise overflow-hidden rounded-lg bg-surface-raised shadow-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2 py-3 pl-4 pr-3">
        <div className="min-w-0 pt-1.5">
          <div className="truncate font-display text-title font-semibold uppercase tracking-wide">
            {plan.name}
          </div>
          <div className="text-label text-text-muted">
            {count === 0 ? 'Pusty plan' : `${count} ${count === 1 ? 'ćwiczenie' : 'ćwiczenia'}`}
          </div>
        </div>
        <IconButton label="Usuń plan" tone="danger" onClick={() => onDelete(plan)}>
          <CloseIcon />
        </IconButton>
      </div>

      {count > 0 && (
        <div className="flex flex-col gap-2 px-4 pb-4 text-body text-text-muted">
          {plan.exercises.map((e) => (
            <div key={e.id ?? e.exercise_name} className="flex justify-between gap-3">
              <span className="truncate">{e.exercise_name}</span>
              {e.target_sets ? (
                <span className="shrink-0 font-mono text-label tabular-nums text-text">
                  {e.target_sets}×{e.target_reps ?? '—'}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          type="button"
          className="min-h-12 w-full rounded-md bg-accent px-6 font-display text-body font-semibold uppercase tracking-wide text-accent-fg shadow-accent transition-colors hover:bg-accent-hover active:scale-[.98] disabled:opacity-60"
          disabled={starting}
          onClick={() => onStart(plan)}
        >
          {starting ? 'Startuję…' : 'Zacznij trening'}
        </button>
      </div>
    </div>
  );
}
