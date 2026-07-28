import Button from '../../../components/ui/Button';

export default function PlanCard({ plan, onStart, onDelete, starting }) {
  return (
    <div className="flex items-center justify-between rounded border border-line bg-surface p-4">
      <div>
        <div className="font-display text-lg font-semibold">{plan.name}</div>
        <div className="mt-0.5 text-xs text-text-muted">
          {plan.exercises.length === 0
            ? 'Brak ćwiczeń w planie'
            : plan.exercises.map((e) => e.exercise_name).join(', ')}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" disabled={starting} onClick={() => onStart(plan)}>
          {starting ? 'Startuję…' : 'Zacznij trening'}
        </Button>
        <button
          className="p-1.5 text-base text-text-muted hover:text-danger-text"
          title="Usuń plan"
          onClick={() => onDelete(plan)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
