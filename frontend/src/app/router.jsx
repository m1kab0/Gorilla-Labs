import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import LoginRoute from './routes/login';
import RegisterRoute from './routes/register';
import WorkoutsRoute from './routes/workouts';
import WorkoutDetailRoute from './routes/workout-detail';
import ExercisesRoute from './routes/exercises';
import PlansRoute from './routes/plans';
import ProgressRoute from './routes/progress';
import SettingsRoute from './routes/settings';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/workouts" element={<WorkoutsRoute />} />
          <Route path="/workouts/:workoutId" element={<WorkoutDetailRoute />} />
          <Route path="/exercises" element={<ExercisesRoute />} />
          <Route path="/plans" element={<PlansRoute />} />
          <Route path="/progress" element={<ProgressRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
        </Route>

        <Route path="/" element={<Navigate to="/workouts" replace />} />
        <Route path="*" element={<Navigate to="/workouts" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
