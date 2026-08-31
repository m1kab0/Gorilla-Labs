import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import { useSettings } from '../../../lib/settings';

/**
 * Ćwiczenie z planu na ekranie treningu. Doszedł pasek postępu serii —
 * „2 / 4 serii” jako tekst wymagało czytania i porównywania dwóch liczb;
 * pasek odpowiada na to samo pytanie jednym spojrzeniem, a wypełniony
 * zmienia kolor na sukcesu, więc widać, co jest już domknięte.
 */
export default function PlanExerciseEntry({ planExercise, loggedCount, entry, onChange, onSubmit }) {
  const { unit } = useSettings();
  const target = planExercise.target_sets || 0;
  const pct = target ? Math.min(100, (loggedCount / target) * 100) : 0;
  const done = target > 0 && loggedCount >= target;

  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border bg-surface p-4 shadow-card transition-colors ${
        done ? 'border-success' : 'border-line'
      }`}
    >
      <div>
        {/* Nazwa i licznik w osobnych wierszach: na 375 px obie linijki obok
            siebie ścinały nazwę ćwiczenia do „Wyciskanie szt…”. */}
        <div className="truncate font-body font-medium">{planExercise.exercise_name}</div>
        <div className="mt-0.5 font-mono text-label tabular-nums text-text-muted">
          {loggedCount}
          {target ? ` / ${target}` : ''} serii
          {planExercise.target_reps ? ` · cel ${planExercise.target_reps} powt.` : ''}
        </div>
        {target > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-raised">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                done ? 'bg-success' : 'bg-accent'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Powtórzenia"
          type="number"
          min="1"
          inputMode="numeric"
          placeholder={planExercise.target_reps ? String(planExercise.target_reps) : '10'}
          value={entry.reps}
          onChange={(e) => onChange('reps', e.target.value)}
        />
        <TextField
          label={`Ciężar (${unit})`}
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={entry.weight}
          onChange={(e) => onChange('weight', e.target.value)}
        />
      </div>
      <Button variant={done ? 'soft' : 'primary'} pulseOnClick onClick={onSubmit}>
        Dodaj serię
      </Button>
    </div>
  );
}
