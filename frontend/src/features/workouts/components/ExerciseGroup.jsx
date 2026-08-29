import SetRow from './SetRow';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function ExerciseGroup({ group, maxWeight, onDeleteSet }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();

  async function handleDelete(setId) {
    startExit(setId);
    try {
      await onDeleteSet(setId);
    } catch {
      cancelExit(setId);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-surface">
      <div className="bg-surface-raised px-3.5 py-2.5 font-display text-sm uppercase tracking-wide">
        {group.exercise_name || 'Ćwiczenie'}
      </div>
      {group.sets.map((s) => (
        <div
          key={s.id}
          className={`transition-all duration-200 ${
            isExiting(s.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <SetRow set={s} maxWeight={maxWeight} onDelete={() => handleDelete(s.id)} />
        </div>
      ))}
    </div>
  );
}
