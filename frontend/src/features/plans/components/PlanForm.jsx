import { useState } from 'react';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useExercises } from '../../exercises';
import { useCreatePlan } from '../api/create-plan';

let rowIdCounter = 0;
function newRow() {
  rowIdCounter += 1;
  return { rowId: rowIdCounter, exercise_id: '', target_sets: '', target_reps: '' };
}

export default function PlanForm() {
  const { data: exercises = [] } = useExercises();
  const createPlan = useCreatePlan();
  const [planName, setPlanName] = useState('');
  const [rows, setRows] = useState([newRow()]);
  const [error, setError] = useState('');

  function updateRow(rowId, field, value) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!planName.trim()) {
      setError('Podaj nazwę planu.');
      return;
    }
    const validRows = rows.filter((r) => r.exercise_id);
    if (validRows.length === 0) {
      setError('Dodaj przynajmniej jedno ćwiczenie do planu.');
      return;
    }
    await createPlan.mutateAsync({
      name: planName.trim(),
      exercises: validRows.map((r, idx) => ({
        exercise_id: parseInt(r.exercise_id, 10),
        order_index: idx,
        target_sets: r.target_sets ? parseInt(r.target_sets, 10) : null,
        target_reps: r.target_reps ? parseInt(r.target_reps, 10) : null,
      })),
    });
    setPlanName('');
    setRows([newRow()]);
  }

  const exerciseOptions = exercises.map((ex) => ({
    id: ex.id,
    label: ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name,
  }));

  return (
    <form className="flex flex-col gap-3 rounded border border-line bg-surface p-4" onSubmit={handleSubmit}>
      <TextField
        id="plan-name"
        label="Nazwa planu"
        type="text"
        placeholder="np. Push day"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
      />

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.rowId} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
            <Select
              label="Ćwiczenie"
              value={row.exercise_id}
              onChange={(e) => updateRow(row.rowId, 'exercise_id', e.target.value)}
            >
              <option value="">Wybierz…</option>
              {exerciseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <TextField
              label="Serie"
              type="number"
              min="1"
              placeholder="np. 3"
              value={row.target_sets}
              onChange={(e) => updateRow(row.rowId, 'target_sets', e.target.value)}
            />
            <TextField
              label="Powt."
              type="number"
              min="1"
              placeholder="np. 10"
              value={row.target_reps}
              onChange={(e) => updateRow(row.rowId, 'target_reps', e.target.value)}
            />
            <button
              type="button"
              className="p-1.5 text-base text-text-muted hover:text-accent-text"
              title="Usuń ćwiczenie z planu"
              onClick={() => removeRow(row.rowId)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addRow}>
        + Dodaj ćwiczenie do planu
      </Button>
      <Button type="submit" variant="primary" pulseOnClick>
        Zapisz plan
      </Button>
      <ErrorBanner>{error || createPlan.error?.message}</ErrorBanner>
    </form>
  );
}
