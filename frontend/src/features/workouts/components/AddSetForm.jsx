import { useMemo, useState } from 'react';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import { ExerciseForm } from '../../exercises';

export default function AddSetForm({ exercises, hasPlan, onSubmit }) {
  const [search, setSearch] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [repsInvalid, setRepsInvalid] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (ex) => ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q)
    );
  }, [exercises, search]);

  function handleSubmit() {
    const repsNum = parseInt(reps, 10);
    if (!repsNum || repsNum <= 0 || !selectedExerciseId) {
      setRepsInvalid(true);
      return;
    }
    setRepsInvalid(false);
    onSubmit({
      exerciseId: parseInt(selectedExerciseId, 10),
      reps: repsNum,
      weightKg: weight ? parseFloat(weight) : null,
    });
    setReps('');
    setWeight('');
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-line bg-surface p-4">
      {hasPlan && <div className="text-[13px] text-text-muted">Dodatkowe ćwiczenie spoza planu:</div>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="exercise-search" className="text-xs uppercase tracking-wider text-text-muted">
          Ćwiczenie
        </label>
        <input
          id="exercise-search"
          type="text"
          placeholder="🔍 Szukaj ćwiczenia..."
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        />
        <Select value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)} className="mt-2">
          <option value="" disabled>
            Wybierz ćwiczenie
          </option>
          {filtered.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name}
            </option>
          ))}
        </Select>
        <Button variant="link" className="self-start" onClick={() => setQuickAddOpen((v) => !v)}>
          + Nie ma Twojego ćwiczenia? Dodaj nowe
        </Button>
      </div>

      {quickAddOpen && (
        <div className="border-t border-line pt-3">
          <ExerciseForm
            onCreated={(exercise) => {
              setSelectedExerciseId(String(exercise.id));
              setSearch('');
              setQuickAddOpen(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextField
          id="set-reps"
          label="Powtórzenia"
          type="number"
          min="1"
          inputMode="numeric"
          invalid={repsInvalid}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <TextField
          id="set-weight"
          label="Ciężar (kg)"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <Button variant="primary" pulseOnClick onClick={handleSubmit}>
        Dodaj serię
      </Button>
    </div>
  );
}
