import EmptyState from '../../../components/ui/EmptyState';
import PlanCard from './PlanCard';
import { PlanIcon } from '../../../components/ui/icons';
import { useExitTransition } from '../../../hooks/useExitTransition';
import { useConfirm } from '../../../components/ui/ConfirmProvider';
import { useToast } from '../../../components/ui/Toast';

export default function PlanList({ plans, startingId, onStart, onDelete, onCreate }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();
  const confirm = useConfirm();
  const toast = useToast();

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<PlanIcon size={24} />}
        title="Brak planów"
        action={onCreate ? { label: 'Ułóż pierwszy plan', onClick: onCreate } : undefined}
      >
        Plan to szablon treningu: układasz go raz, a potem każda sesja startuje z gotową listą ćwiczeń.
      </EmptyState>
    );
  }

  async function handleDelete(plan) {
    const ok = await confirm({
      title: `Usunąć plan „${plan.name}”?`,
      description:
        'Treningi zapisane na jego podstawie zostaną nienaruszone — usuwasz wyłącznie szablon.',
    });
    if (!ok) return;
    startExit(plan.id);
    try {
      await onDelete(plan);
      toast.success('Plan usunięty');
    } catch (err) {
      cancelExit(plan.id);
      toast.error(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan, idx) => (
        <div
          key={plan.id}
          className={`transition-all duration-200 ${
            isExiting(plan.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-[600px] opacity-100'
          }`}
        >
          <PlanCard
            plan={plan}
            index={idx}
            starting={startingId === plan.id}
            onStart={onStart}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  );
}
