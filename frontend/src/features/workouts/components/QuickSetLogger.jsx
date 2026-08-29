import { useState } from 'react';
import RangeControl from '../../../components/ui/RangeControl';
import HoldToConfirmButton from '../../../components/ui/HoldToConfirmButton';
import Select from '../../../components/ui/Select';

/**
 * Szybkie logowanie serii: dwa suwaki + FAB na przytrzymanie.
 * Zastępuje wpisywanie w pola na najczęstszej ścieżce; pełny AddSetForm
 * (wyszukiwanie ćwiczenia, dodawanie nowego) zostaje pod spodem.
 */
export default function QuickSetLogger({ exercises, defaultExerciseId, onSubmit }) {
  const [exerciseId, setExerciseId] = useState(defaultExerciseId ? String(defaultExerciseId) : '');
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(60);

  const ready = !!exerciseId;

  return (
    <div className="flex flex-col gap-4 rounded border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-text-muted">Przeciągnij, by ustawić serię</div>

      <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="" disabled>
          Wybierz ćwiczenie
        </option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name}
          </option>
        ))}
      </Select>

      <RangeControl label="Powtórzenia" suffix="reps" value={reps} onChange={setReps} min={1} max={20} step={1} />
      <RangeControl label="Ciężar" suffix="kg" value={weight} onChange={setWeight} min={0} max={200} step={2.5} />

      <HoldToConfirmButton
        disabled={!ready}
        hint={ready ? `Przytrzymaj, by dodać ${reps}×${weight} kg` : 'Najpierw wybierz ćwiczenie'}
        onConfirm={() =>
          onSubmit({ exerciseId: parseInt(exerciseId, 10), reps, weightKg: weight || null })
        }
      />
    </div>
  );
}
