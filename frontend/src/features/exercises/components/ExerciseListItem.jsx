import IconButton from '../../../components/ui/IconButton';
import { CloseIcon } from '../../../components/ui/icons';

export default function ExerciseListItem({ exercise, onDelete }) {
  return (
    <div
      className={`flex min-h-14 items-center justify-between gap-3 rounded-md border border-line bg-surface py-2 pl-4 pr-3 ${
        exercise.is_global ? 'opacity-75' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="truncate font-body text-body font-medium">{exercise.name}</div>
        {exercise.muscle_group && (
          <div className="truncate text-label text-text-muted">{exercise.muscle_group}</div>
        )}
      </div>
      {onDelete && (
        <IconButton label={`Usuń ćwiczenie ${exercise.name}`} tone="danger" onClick={() => onDelete(exercise)}>
          <CloseIcon />
        </IconButton>
      )}
    </div>
  );
}
