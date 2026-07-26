import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function PublicLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/workouts" replace />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/login" className="brand">
          <span className="plate-dot" />
          Żelazo
        </Link>
      </header>
      <Outlet />
    </div>
  );
}
