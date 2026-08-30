import EmptyState from '../../../components/ui/EmptyState';
import PlanCard from './PlanCard';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function PlanList({ plans, startingId, onStart, onDelete }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();

  if (plans.length === 0) {
    return <EmptyState>Nie masz jeszcze żadnego planu. Stwórz pierwszy poniżej.</EmptyState>;
  }

  async function handleDelete(plan) {
    if (!confirm('Usunąć ten plan? Treningi już zapisane na jego podstawie zostaną — usuwasz tylko szablon.')) {
      return;
    }
    startExit(plan.id);
    try {
      await onDelete(plan);
    } catch {
      cancelExit(plan.id);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {plans.map((plan, idx) => (
        <div
          key={plan.id}
          className={`transition-all duration-200 ${
            isExiting(plan.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-[600px] opacity-100'
          }`}
        >
          <PlanCard plan={plan} index={idx} starting={startingId === plan.id} onStart={onStart} onDelete={handleDelete} />
        </div>
      ))}
    </div>
  );
}
