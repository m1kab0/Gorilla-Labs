import { useState } from 'react';
import Card from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { CloseIcon } from '../../../components/ui/icons';
import { useToast } from '../../../components/ui/Toast';
import { useExercises } from '../../exercises';
import { useCreatePlan } from '../api/create-plan';

let rowIdCounter = 0;
function newRow() {
  rowIdCounter += 1;
  return { rowId: rowIdCounter, exercise_id: '', target_sets: '', target_reps: '' };
}

/**
 * Formularz planu. Zmiany:
 * — siatka `2fr 1fr 1fr auto` na 375-pikselowym ekranie dawała pola „Serie”
 *   i „Powt.” szerokości ~48 px, w których nie mieściła się nawet etykieta.
 *   Teraz nazwa ćwiczenia jest w osobnym wierszu, a liczby pod nią,
 * — każdy wiersz to numerowana karta, więc przy sześciu ćwiczeniach widać,
 *   które pola należą do którego,
 * — po zapisie leci toast: formularz czyścił się w ciszy i nie było wiadomo,
 *   czy plan powstał.
 */
export default function PlanForm({ onCreated }) {
  const { data: exercises = [] } = useExercises();
  const createPlan = useCreatePlan();
  const toast = useToast();
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
    try {
      await createPlan.mutateAsync({
        name: planName.trim(),
        exercises: validRows.map((r, idx) => ({
          exercise_id: parseInt(r.exercise_id, 10),
          order_index: idx,
          target_sets: r.target_sets ? parseInt(r.target_sets, 10) : null,
          target_reps: r.target_reps ? parseInt(r.target_reps, 10) : null,
        })),
      });
      toast.success(`Plan „${planName.trim()}” zapisany`);
      setPlanName('');
      setRows([newRow()]);
      onCreated?.();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const exerciseOptions = exercises.map((ex) => ({
    id: ex.id,
    label: ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name,
  }));

  return (
    <Card as="form" className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide">Nowy plan</h2>

      <TextField
        id="plan-name"
        label="Nazwa planu"
        type="text"
        placeholder="np. Push day"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
      />

      <div className="flex flex-col gap-3">
        {rows.map((row, idx) => (
          <div key={row.rowId} className="flex flex-col gap-3 rounded-md bg-surface-raised p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-label tabular-nums text-text-muted">
                Ćwiczenie {idx + 1}
              </span>
              {rows.length > 1 && (
                <IconButton
                  label="Usuń ćwiczenie z planu"
                  tone="danger"
                  onClick={() => removeRow(row.rowId)}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </div>
            <Select
              value={row.exercise_id}
              onChange={(e) => updateRow(row.rowId, 'exercise_id', e.target.value)}
            >
              <option value="">Wybierz ćwiczenie…</option>
              {exerciseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Serie"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="3"
                value={row.target_sets}
                onChange={(e) => updateRow(row.rowId, 'target_sets', e.target.value)}
              />
              <TextField
                label="Powtórzenia"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="10"
                value={row.target_reps}
                onChange={(e) => updateRow(row.rowId, 'target_reps', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="soft" onClick={addRow}>
        + Dodaj ćwiczenie do planu
      </Button>
      <Button type="submit" variant="primary" pulseOnClick disabled={createPlan.isPending}>
        {createPlan.isPending ? 'Zapisuję…' : 'Zapisz plan'}
      </Button>
      <ErrorBanner>{error || createPlan.error?.message}</ErrorBanner>
    </Card>
  );
}
