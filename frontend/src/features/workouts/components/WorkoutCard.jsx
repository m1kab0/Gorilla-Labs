import { formatWorkoutDate } from '../utils/format-date';

export default function WorkoutCard({ workout, onOpen, onDelete }) {
  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded border border-line bg-surface p-4 transition-colors duration-150 hover:border-accent-light"
      onClick={() => onOpen(workout)}
    >
      <div>
        <div className="font-display text-lg font-semibold">{formatWorkoutDate(workout.workout_date)}</div>
        <div className="mt-0.5 text-xs text-text-muted">{workout.notes || 'Brak notatki'}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="font-mono text-xl text-accent-light [text-shadow:0_0_14px_rgba(232,95,190,0.35)]">
          {workout.sets.length}
          <span className="text-[11px] text-text-muted"> serii</span>
        </div>
        <button
          className="p-1.5 text-base text-text-muted hover:text-accent-text"
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
