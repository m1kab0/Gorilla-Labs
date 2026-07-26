import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Exercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    setLoading(true);
    try {
      const data = await api('/exercises/');
      setExercises(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const matches = (ex, q) =>
    !q || ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q);

  const own = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => !ex.is_global && matches(ex, q));
  }, [exercises, search]);

  const global = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => ex.is_global && matches(ex, q));
  }, [exercises, search]);

  async function createExercise(e) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) {
      setError('Podaj nazwę ćwiczenia.');
      return;
    }
    try {
      const exercise = await api('/exercises/', {
        method: 'POST',
        body: { name: newName.trim(), muscle_group: newMuscle.trim() || null },
      });
      setExercises((prev) => [...prev, exercise]);
      setNewName('');
      setNewMuscle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteExercise(id) {
    try {
      await api(`/exercises/${id}`, { method: 'DELETE' });
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="view">
      <button className="back-link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </button>
      <h1 className="view-title">Twoje ćwiczenia</h1>
      <p className="view-subtitle">
        Dodawaj własne ćwiczenia — widzisz je tylko Ty, inni użytkownicy ich nie zobaczą.
      </p>

      <div className="field">
        <input
          type="text"
          placeholder="🔍 Szukaj ćwiczenia..."
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <form className="add-set-panel" onSubmit={createExercise}>
        <div className="field">
          <label htmlFor="new-exercise-name">Nazwa ćwiczenia</label>
          <input
            id="new-exercise-name"
            type="text"
            placeholder="np. Wyciskanie hantli na skosie"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="new-exercise-muscle">Partia mięśniowa (opcjonalnie)</label>
          <input
            id="new-exercise-muscle"
            type="text"
            placeholder="np. klatka piersiowa"
            value={newMuscle}
            onChange={(e) => setNewMuscle(e.target.value)}
          />
        </div>
        <button className="primary" type="submit">
          + Dodaj ćwiczenie
        </button>
        {error && <div className="error-banner">{error}</div>}
      </form>

      <div>
        <div className="exercise-header" style={{ borderRadius: 4, marginBottom: 10 }}>
          Twoje własne
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div className="empty-state">Wczytywanie…</div>
          ) : own.length === 0 ? (
            <div className="empty-state">
              {search ? 'Brak własnych ćwiczeń pasujących do wyszukiwania.' : 'Nie masz jeszcze własnych ćwiczeń. Dodaj pierwsze powyżej.'}
            </div>
          ) : (
            own.map((ex) => (
              <div key={ex.id} className="exercise-list-item">
                <div>
                  <div className="eli-name">{ex.name}</div>
                  {ex.muscle_group && <div className="eli-muscle">{ex.muscle_group}</div>}
                </div>
                <button className="set-delete" title="Usuń ćwiczenie" onClick={() => deleteExercise(ex.id)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="exercise-header" style={{ borderRadius: 4, marginBottom: 10 }}>
          Globalne (dostępne dla wszystkich)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!loading && global.length === 0 ? (
            <div className="empty-state">Brak globalnych ćwiczeń pasujących do wyszukiwania.</div>
          ) : (
            global.map((ex) => (
              <div key={ex.id} className="exercise-list-item global">
                <div>
                  <div className="eli-name">{ex.name}</div>
                  {ex.muscle_group && <div className="eli-muscle">{ex.muscle_group}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
