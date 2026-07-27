import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';

export default function PlanExerciseEntry({ planExercise, loggedCount, entry, onChange, onSubmit }) {
  return (
    <div className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-body font-medium">{planExercise.exercise_name}</span>
        <span className="text-xs text-text-muted">
          {loggedCount}
          {planExercise.target_sets ? ` / ${planExercise.target_sets}` : ''} serii
          {planExercise.target_reps ? ` · cel: ${planExercise.target_reps} powt.` : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Powtórzenia"
          type="number"
          min="1"
          inputMode="numeric"
          placeholder={planExercise.target_reps ? String(planExercise.target_reps) : ''}
          value={entry.reps}
          onChange={(e) => onChange('reps', e.target.value)}
        />
        <TextField
          label="Ciężar (kg)"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={entry.weight}
          onChange={(e) => onChange('weight', e.target.value)}
        />
      </div>
      <Button variant="primary" pulseOnClick onClick={onSubmit}>
        Dodaj serię
      </Button>
    </div>
  );
}
