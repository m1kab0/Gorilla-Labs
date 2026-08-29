import { formatWorkoutDate } from '../utils/format-date';

/* Stos „talerzy” po lewej — wizualna waga treningu, rośnie z liczbą serii. */
function PlateStack({ count }) {
  const bars = Array.from({ length: Math.min(5, Math.max(1, count)) }, (_, i) => 4 + i * 1.6);
  return (
    <div className="flex w-2 flex-col-reverse gap-0.5" aria-hidden="true">
      {bars.map((w, i) => (
        <div key={i} className="h-[3px] rounded-sm bg-accent" style={{ width: w }} />
      ))}
    </div>
  );
}

export default function WorkoutCard({ workout, index = 0, onOpen, onDelete }) {
  return (
    <div
      className="flex cursor-pointer animate-rise items-center justify-between rounded-lg bg-surface-raised p-4 transition-transform duration-200 active:scale-[.98]"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onOpen(workout)}
    >
      <div className="flex items-center gap-3">
        <PlateStack count={workout.sets.length} />
        <div>
          <div className="font-display text-[17px] font-semibold">{formatWorkoutDate(workout.workout_date)}</div>
          <div className="mt-0.5 text-[11.5px] text-text-muted">{workout.notes || 'Brak notatki'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="font-mono text-[22px] font-semibold text-accent [text-shadow:0_0_14px_rgba(255,255,130,0.30)]">
          {workout.sets.length}
        </div>
        <button
          className="p-1.5 text-base text-text-muted transition-colors hover:text-danger-text"
          title="Usuń trening"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(workout);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
