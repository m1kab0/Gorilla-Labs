import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import PublicLayout from './components/PublicLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import Exercises from './pages/Exercises';
import Plans from './pages/Plans';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:workoutId" element={<WorkoutDetail />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/plans" element={<Plans />} />
          </Route>

          <Route path="/" element={<Navigate to="/workouts" replace />} />
          <Route path="*" element={<Navigate to="/workouts" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
