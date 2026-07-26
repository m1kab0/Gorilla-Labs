import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/workouts" className="brand">
          <span className="plate-dot" />
          Żelazo
        </Link>
        <div className="topbar-links">
          <button className="link" onClick={() => navigate('/plans')}>
            Plany
          </button>
          <button className="link" onClick={() => navigate('/exercises')}>
            Ćwiczenia
          </button>
          <button className="link" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
