import EmptyState from '../../../components/ui/EmptyState';
import WorkoutCard from './WorkoutCard';
import { BarbellIcon } from '../../../components/ui/icons';
import { useExitTransition } from '../../../hooks/useExitTransition';
import { useConfirm } from '../../../components/ui/ConfirmProvider';
import { useToast } from '../../../components/ui/Toast';

export default function WorkoutList({ workouts, onOpen, onDelete, onCreate }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();
  const confirm = useConfirm();
  const toast = useToast();

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={<BarbellIcon size={24} />}
        title="Jeszcze pusto"
        action={onCreate ? { label: 'Zacznij pierwszy trening', onClick: onCreate } : undefined}
      >
        Każda zapisana seria buduje historię, z której później wyliczymy Twoje rekordy i objętość.
      </EmptyState>
    );
  }

  async function handleDelete(workout) {
    const ok = await confirm({
      title: 'Usunąć ten trening?',
      description: 'Zniknie razem ze wszystkimi zapisanymi w nim seriami. Tej operacji nie da się cofnąć.',
    });
    if (!ok) return;
    startExit(workout.id);
    try {
      await onDelete(workout);
      toast.success('Trening usunięty');
    } catch (err) {
      cancelExit(workout.id);
      toast.error(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {workouts.map((w, idx) => (
        <div
          key={w.id}
          className={`transition-all duration-200 ${
            isExiting(w.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-40 opacity-100'
          }`}
        >
          <WorkoutCard workout={w} index={idx} onOpen={onOpen} onDelete={handleDelete} />
        </div>
      ))}
    </div>
  );
}
