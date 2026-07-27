import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

let rowIdCounter = 0;
function newRow() {
  rowIdCounter += 1;
  return { rowId: rowIdCounter, exercise_id: '', target_sets: '', target_reps: '' };
}

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(null);

  const [planName, setPlanName] = useState('');
  const [rows, setRows] = useState([newRow()]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [plansData, exercisesData] = await Promise.all([api('/plans/'), api('/exercises/')]);
      setPlans(plansData);
      setExercises(exercisesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateRow(rowId, field, value) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }

  async function createPlan(e) {
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
      const plan = await api('/plans/', {
        method: 'POST',
        body: {
          name: planName.trim(),
          exercises: validRows.map((r, idx) => ({
            exercise_id: parseInt(r.exercise_id, 10),
            order_index: idx,
            target_sets: r.target_sets ? parseInt(r.target_sets, 10) : null,
            target_reps: r.target_reps ? parseInt(r.target_reps, 10) : null,
          })),
        },
      });
      setPlans((prev) => [plan, ...prev]);
      setPlanName('');
      setRows([newRow()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePlan(planId) {
    if (!confirm('Usunąć ten plan? Treningi już zapisane na jego podstawie zostaną — usuwasz tylko szablon.')) return;
    try {
      await api(`/plans/${planId}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      alert(err.message);
    }
  }

  async function startWorkout(planId) {
    setStarting(planId);
    try {
      const workout = await api(`/plans/${planId}/start`, { method: 'POST' });
      navigate(`/workouts/${workout.id}`);
    } catch (err) {
      alert(err.message);
      setStarting(null);
    }
  }

  const exerciseOptions = useMemo(
    () => exercises.map((ex) => ({ id: ex.id, label: ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name })),
    [exercises]
  );

  return (
    <div className="view">
      <button className="back-link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </button>
      <h1 className="view-title">Twoje plany</h1>
      <p className="view-subtitle">Ułóż plan raz, odpalaj trening jednym kliknięciem.</p>

      <div className="workout-list">
        {loading ? (
          <div className="empty-state">Wczytywanie…</div>
        ) : plans.length === 0 ? (
          <div className="empty-state">Nie masz jeszcze żadnego planu. Stwórz pierwszy poniżej.</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="workout-card" style={{ cursor: 'default' }}>
              <div>
                <div className="wc-date">{plan.name}</div>
                <div className="wc-meta">
                  {plan.exercises.length === 0
                    ? 'Brak ćwiczeń w planie'
                    : plan.exercises.map((e) => e.exercise_name).join(', ')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="secondary"
                  disabled={starting === plan.id}
                  onClick={() => startWorkout(plan.id)}
                >
                  {starting === plan.id ? 'Startuję…' : 'Zacznij trening'}
                </button>
                <button className="set-delete" title="Usuń plan" onClick={() => deletePlan(plan.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="add-set-panel" onSubmit={createPlan}>
        <div className="field">
          <label htmlFor="plan-name">Nazwa planu</label>
          <input
            id="plan-name"
            type="text"
            placeholder="np. Push day"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => (
            <div
              key={row.rowId}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}
            >
              <div className="field">
                <label>Ćwiczenie</label>
                <select value={row.exercise_id} onChange={(e) => updateRow(row.rowId, 'exercise_id', e.target.value)}>
                  <option value="">Wybierz…</option>
                  {exerciseOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Serie</label>
                <input
                  type="number"
                  min="1"
                  placeholder="np. 3"
                  value={row.target_sets}
                  onChange={(e) => updateRow(row.rowId, 'target_sets', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Powt.</label>
                <input
                  type="number"
                  min="1"
                  placeholder="np. 10"
                  value={row.target_reps}
                  onChange={(e) => updateRow(row.rowId, 'target_reps', e.target.value)}
                />
              </div>
              <button
                type="button"
                className="set-delete"
                title="Usuń ćwiczenie z planu"
                onClick={() => removeRow(row.rowId)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="secondary" onClick={addRow}>
          + Dodaj ćwiczenie do planu
        </button>
        <button className="primary" type="submit">
          Zapisz plan
        </button>
        {error && <div className="error-banner">{error}</div>}
      </form>
    </div>
  );
}
