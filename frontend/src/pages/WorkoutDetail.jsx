import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function WorkoutDetail() {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [planEntries, setPlanEntries] = useState({}); // { [exercise_id]: { reps, weight } }

  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickMuscle, setQuickMuscle] = useState('');

  useEffect(() => {
    loadAll();
  }, [workoutId]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [workoutData, exercisesData] = await Promise.all([
        api(`/workouts/${workoutId}`),
        api('/exercises/'),
      ]);
      setWorkout(workoutData);
      setExercises(exercisesData);

      if (workoutData.plan_id) {
        const planData = await api(`/plans/${workoutData.plan_id}`);
        setPlan(planData);
        setPlanEntries((prev) => {
          const next = { ...prev };
          planData.exercises.forEach((pe) => {
            if (!next[pe.exercise_id]) next[pe.exercise_id] = { reps: '', weight: '' };
          });
          return next;
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshWorkout() {
    const data = await api(`/workouts/${workoutId}`);
    setWorkout(data);
  }

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (ex) => ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q)
    );
  }, [exercises, exerciseSearch]);

  const groups = useMemo(() => {
    if (!workout) return [];
    const map = new Map();
    workout.sets.forEach((s) => {
      if (!map.has(s.exercise_id)) {
        map.set(s.exercise_id, { exercise_id: s.exercise_id, exercise_name: s.exercise_name, sets: [] });
      }
      map.get(s.exercise_id).sets.push(s);
    });
    return Array.from(map.values());
  }, [workout]);

  const maxWeightOverall = useMemo(() => {
    if (!workout) return 1;
    return Math.max(1, ...workout.sets.map((s) => s.weight_kg || 0));
  }, [workout]);

  function updatePlanEntry(exerciseId, field, value) {
    setPlanEntries((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], [field]: value } }));
  }

  async function addSetFromPlan(exerciseId) {
    const entry = planEntries[exerciseId] || {};
    const repsNum = parseInt(entry.reps, 10);
    if (!repsNum || repsNum <= 0) {
      alert('Podaj liczbę powtórzeń większą od zera.');
      return;
    }
    const body = {
      exercise_id: exerciseId,
      reps: repsNum,
      weight_kg: entry.weight ? parseFloat(entry.weight) : null,
      set_number: 1,
    };
    try {
      await api(`/workouts/${workoutId}/sets`, { method: 'POST', body });
      updatePlanEntry(exerciseId, 'reps', '');
      updatePlanEntry(exerciseId, 'weight', '');
      await refreshWorkout();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddSet() {
    const repsNum = parseInt(reps, 10);
    if (!repsNum || repsNum <= 0) {
      alert('Podaj liczbę powtórzeń większą od zera.');
      return;
    }
    if (!selectedExerciseId) {
      alert('Wybierz ćwiczenie.');
      return;
    }
    const body = {
      exercise_id: parseInt(selectedExerciseId, 10),
      reps: repsNum,
      weight_kg: weight ? parseFloat(weight) : null,
      set_number: 1,
    };
    try {
      await api(`/workouts/${workoutId}/sets`, { method: 'POST', body });
      setReps('');
      setWeight('');
      await refreshWorkout();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteSet(setId) {
    try {
      await api(`/workouts/sets/${setId}`, { method: 'DELETE' });
      await refreshWorkout();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteWorkout() {
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami? Tej operacji nie można odwrócić.')) return;
    try {
      await api(`/workouts/${workoutId}`, { method: 'DELETE' });
      navigate('/workouts');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleQuickAddExercise() {
    if (!quickName.trim()) {
      alert('Podaj nazwę ćwiczenia.');
      return;
    }
    try {
      const exercise = await api('/exercises/', {
        method: 'POST',
        body: { name: quickName.trim(), muscle_group: quickMuscle.trim() || null },
      });
      setExercises((prev) => [...prev, exercise]);
      setSelectedExerciseId(String(exercise.id));
      setQuickName('');
      setQuickMuscle('');
      setQuickAddOpen(false);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="view">Wczytywanie…</div>;
  if (error) return <div className="view"><div className="error-banner">{error}</div></div>;
  if (!workout) return null;

  return (
    <div className="view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button className="back-link" onClick={() => navigate('/workouts')}>
          ← Wszystkie treningi
        </button>
        <button
          className="set-delete"
          style={{ fontSize: 13, textDecoration: 'underline', color: 'var(--text-muted)' }}
          onClick={deleteWorkout}
        >
          Usuń trening
        </button>
      </div>

      <h1 className="view-title">{formatDate(workout.workout_date)}</h1>

      {plan && (
        <div>
          <div className="exercise-header" style={{ borderRadius: 4, marginBottom: 10 }}>
            Plan: {plan.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.exercises.map((pe) => {
              const loggedCount = workout.sets.filter((s) => s.exercise_id === pe.exercise_id).length;
              const entry = planEntries[pe.exercise_id] || { reps: '', weight: '' };
              return (
                <div key={pe.id} className="add-set-panel" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{pe.exercise_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {loggedCount}
                      {pe.target_sets ? ` / ${pe.target_sets}` : ''} serii
                      {pe.target_reps ? ` · cel: ${pe.target_reps} powt.` : ''}
                    </span>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Powtórzenia</label>
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        placeholder={pe.target_reps ? String(pe.target_reps) : ''}
                        value={entry.reps}
                        onChange={(e) => updatePlanEntry(pe.exercise_id, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Ciężar (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        value={entry.weight}
                        onChange={(e) => updatePlanEntry(pe.exercise_id, 'weight', e.target.value)}
                      />
                    </div>
                  </div>
                  <button className="primary" onClick={() => addSetFromPlan(pe.exercise_id)}>
                    Dodaj serię
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.length === 0 ? (
          <div className="empty-state">Brak serii. Dodaj pierwszą poniżej.</div>
        ) : (
          groups.map((group) => (
            <div key={group.exercise_id} className="exercise-group">
              <div className="exercise-header">{group.exercise_name || 'Ćwiczenie'}</div>
              {group.sets.map((s, idx) => {
                const plateWidthPct = s.weight_kg
                  ? Math.max(15, Math.round((s.weight_kg / maxWeightOverall) * 100))
                  : 0;
                return (
                  <div key={s.id} className="set-row">
                    <div className="set-index">#{idx + 1}</div>
                    <div className="barbell">
                      <div className="bar" />
                      {s.weight_kg ? (
                        <div
                          className="plate"
                          style={{ width: `${plateWidthPct}%`, height: Math.min(20, 8 + s.weight_kg / 8) }}
                        />
                      ) : null}
                      <div className="bar" />
                    </div>
                    <div className="set-numbers">
                      <span className="reps">{s.reps}</span>
                      <span className="unit">reps</span>
                      {s.weight_kg ? (
                        <>
                          <span className="weight">{s.weight_kg}</span>
                          <span className="unit">kg</span>
                        </>
                      ) : null}
                    </div>
                    <button className="set-delete" title="Usuń serię" onClick={() => deleteSet(s.id)}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="add-set-panel">
        {plan && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Dodatkowe ćwiczenie spoza planu:
          </div>
        )}
        <div className="field">
          <label htmlFor="exercise-search">Ćwiczenie</label>
          <input
            id="exercise-search"
            type="text"
            placeholder="🔍 Szukaj ćwiczenia..."
            autoComplete="off"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
          />
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            style={{ marginTop: 8 }}
          >
            <option value="" disabled>
              Wybierz ćwiczenie
            </option>
            {filteredExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="link"
            style={{ alignSelf: 'flex-start', padding: '6px 0' }}
            onClick={() => setQuickAddOpen((v) => !v)}
          >
            + Nie ma Twojego ćwiczenia? Dodaj nowe
          </button>
        </div>

        {quickAddOpen && (
          <div className="field" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <label htmlFor="quick-exercise-name">Nazwa nowego ćwiczenia</label>
            <input
              id="quick-exercise-name"
              type="text"
              placeholder="np. Wyciskanie hantli na skosie"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
            />
            <label htmlFor="quick-exercise-muscle" style={{ marginTop: 8 }}>
              Partia mięśniowa (opcjonalnie)
            </label>
            <input
              id="quick-exercise-muscle"
              type="text"
              placeholder="np. klatka piersiowa"
              value={quickMuscle}
              onChange={(e) => setQuickMuscle(e.target.value)}
            />
            <button type="button" className="secondary" style={{ marginTop: 8 }} onClick={handleQuickAddExercise}>
              Dodaj i wybierz
            </button>
          </div>
        )}

        <div className="row">
          <div className="field">
            <label htmlFor="set-reps">Powtórzenia</label>
            <input
              id="set-reps"
              type="number"
              min="1"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="set-weight">Ciężar (kg)</label>
            <input
              id="set-weight"
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <button className="primary" onClick={handleAddSet}>
          Dodaj serię
        </button>
      </div>
    </div>
  );
}
