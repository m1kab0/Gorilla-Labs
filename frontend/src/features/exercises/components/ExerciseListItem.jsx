export default function ExerciseListItem({ exercise, onDelete }) {
  return (
    <div
      className={`flex items-center justify-between rounded border border-line bg-surface px-3.5 py-3 ${
        exercise.is_global ? 'opacity-75' : ''
      }`}
    >
      <div>
        <div className="font-body text-sm font-medium">{exercise.name}</div>
        {exercise.muscle_group && <div className="mt-0.5 text-xs text-text-muted">{exercise.muscle_group}</div>}
      </div>
      {onDelete && (
        <button
          className="p-1.5 text-base text-text-muted hover:text-danger-text"
          title="Usuń ćwiczenie"
          onClick={() => onDelete(exercise)}
        >
          ✕
        </button>
      )}
    </div>
  );
}
