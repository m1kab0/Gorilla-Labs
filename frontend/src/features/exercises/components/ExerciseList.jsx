import EmptyState from '../../../components/ui/EmptyState';
import ExerciseListItem from './ExerciseListItem';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function ExerciseList({ exercises, emptyMessage, onDelete }) {
  const { startExit, isExiting } = useExitTransition();

  if (exercises.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  function handleDelete(exercise) {
    startExit(exercise.id);
    onDelete(exercise);
  }

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className={`transition-all duration-200 ${
            isExiting(ex.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <ExerciseListItem exercise={ex} onDelete={onDelete && handleDelete} />
        </div>
      ))}
    </div>
  );
}
