import IconButton from '../../../components/ui/IconButton';
import { CloseIcon } from '../../../components/ui/icons';
import { useSettings } from '../../../lib/settings';
import { formatVolume, volumeUnit } from '../../../lib/units';
import { formatWorkoutDate } from '../utils/format-date';
import { workoutVolume } from '../utils/stats';

/* Stos „talerzy” po lewej — wizualna waga treningu, rośnie z liczbą serii. */
function PlateStack({ count }) {
  const bars = Array.from({ length: Math.min(5, Math.max(1, count)) }, (_, i) => 4 + i * 1.6);
  return (
    <div className="flex w-2 shrink-0 flex-col-reverse gap-0.5" aria-hidden="true">
      {bars.map((w, i) => (
        <div key={i} className="h-[3px] rounded-sm bg-accent" style={{ width: w }} />
      ))}
    </div>
  );
}

/**
 * Karta treningu. Zmiany: cała karta jest przyciskiem (a nie `div` z onClick,
 * czyli czymś, czego nie da się otworzyć klawiaturą ani czytnikiem ekranu),
 * druga linia pokazuje objętość i liczbę ćwiczeń zamiast „Brak notatki”
 * — pusta notatka nie jest informacją — a kasowanie ma pełne pole dotyku.
 */
export default function WorkoutCard({ workout, index = 0, onOpen, onDelete }) {
  const { unit } = useSettings();
  const setCount = workout.sets.length;
  const volume = workoutVolume(workout);
  const exerciseCount = new Set(workout.sets.map((s) => s.exercise_id)).size;

  const subtitle = workout.notes
    ? workout.notes
    : setCount === 0
      ? 'Pusty trening — dodaj pierwszą serię'
      : `${exerciseCount} ${exerciseCount === 1 ? 'ćwiczenie' : 'ćwiczenia'} · ${formatVolume(volume, unit)} ${volumeUnit(unit, volume)}`;

  return (
    <div
      className="flex animate-rise items-center gap-3 rounded-lg bg-surface-raised pr-3 shadow-card transition-transform duration-200 active:scale-[.98]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4 text-left"
      >
        <PlateStack count={setCount} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-title font-semibold">
            {formatWorkoutDate(workout.workout_date)}
          </div>
          <div className="mt-0.5 truncate text-label text-text-muted">{subtitle}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-mono text-metric font-semibold tabular-nums text-accent [text-shadow:0_0_14px_rgba(255,255,130,0.30)]">
            {setCount}
          </span>
          <span className="text-label uppercase tracking-wider text-text-muted">serii</span>
        </div>
      </button>
      <IconButton label="Usuń trening" tone="danger" onClick={() => onDelete(workout)}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
