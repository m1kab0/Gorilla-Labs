import EmptyState from '../../../components/ui/EmptyState';
import ExerciseListItem from './ExerciseListItem';
import { LibraryIcon } from '../../../components/ui/icons';
import { useExitTransition } from '../../../hooks/useExitTransition';
import { useConfirm } from '../../../components/ui/ConfirmProvider';
import { useToast } from '../../../components/ui/Toast';

export default function ExerciseList({ exercises, emptyMessage, emptyTitle, emptyAction, onDelete }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();
  const confirm = useConfirm();
  const toast = useToast();

  if (exercises.length === 0) {
    return (
      <EmptyState icon={<LibraryIcon size={24} />} title={emptyTitle} action={emptyAction}>
        {emptyMessage}
      </EmptyState>
    );
  }

  /* Usunięcie ćwiczenia dotąd szło bez żadnego potwierdzenia — jedno omyłkowe
     tapnięcie w ✕ (który miał ~28 px pola dotyku) kasowało pozycję z biblioteki. */
  async function handleDelete(exercise) {
    const ok = await confirm({
      title: `Usunąć „${exercise.name}”?`,
      description: 'Ćwiczenie zniknie z Twojej biblioteki. Zapisane serie zostaną nienaruszone.',
    });
    if (!ok) return;
    startExit(exercise.id);
    try {
      await onDelete(exercise);
      toast.success('Ćwiczenie usunięte');
    } catch (err) {
      cancelExit(exercise.id);
      toast.error(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className={`transition-all duration-200 ${
            isExiting(ex.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-24 opacity-100'
          }`}
        >
          <ExerciseListItem exercise={ex} onDelete={onDelete && handleDelete} />
        </div>
      ))}
    </div>
  );
}
