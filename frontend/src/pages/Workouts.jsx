import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    setLoading(true);
    try {
      const data = await api('/workouts/');
      setWorkouts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTodayWorkout() {
    try {
      const workout = await api('/workouts/', { method: 'POST', body: {} });
      navigate(`/workouts/${workout.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteWorkout(e, workoutId) {
    e.stopPropagation();
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami?')) return;
    try {
      await api(`/workouts/${workoutId}`, { method: 'DELETE' });
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view">
      <h1 className="view-title">Twoje treningi</h1>
      {!loading && (
        <p className="view-subtitle">
          {user?.display_name ? `${user.display_name} — ` : ''}
          {workouts.length} zapisanych treningów
        </p>
      )}
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="primary" style={{ flex: 1 }} onClick={createTodayWorkout}>
          + Nowy trening (dziś)
        </button>
        <button className="secondary" onClick={() => navigate('/plans')}>
          Z planu
        </button>
      </div>

      <div className="workout-list">
        {loading ? (
          <div className="empty-state">Wczytywanie…</div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">Brak zapisanych treningów. Zacznij od kliknięcia powyżej.</div>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="workout-card" onClick={() => navigate(`/workouts/${w.id}`)}>
              <div>
                <div className="wc-date">{formatDate(w.workout_date)}</div>
                <div className="wc-meta">{w.notes || 'Brak notatki'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="wc-count">
                  {w.sets.length}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> serii</span>
                </div>
                <button className="set-delete" title="Usuń trening" onClick={(e) => deleteWorkout(e, w.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
