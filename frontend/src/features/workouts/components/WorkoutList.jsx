import EmptyState from '../../../components/ui/EmptyState';
import WorkoutCard from './WorkoutCard';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function WorkoutList({ workouts, onOpen, onDelete }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();

  if (workouts.length === 0) {
    return <EmptyState>Brak zapisanych treningów. Zacznij od kliknięcia powyżej.</EmptyState>;
  }

  async function handleDelete(workout) {
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami?')) return;
    startExit(workout.id);
    try {
      await onDelete(workout);
    } catch {
      cancelExit(workout.id);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {workouts.map((w, idx) => (
        <div
          key={w.id}
          className={`animate-rise transition-all duration-200 ${
            isExiting(w.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-32 opacity-100'
          }`}
          style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
        >
          <WorkoutCard workout={w} onOpen={onOpen} onDelete={handleDelete} />
        </div>
      ))}
    </div>
  );
}
