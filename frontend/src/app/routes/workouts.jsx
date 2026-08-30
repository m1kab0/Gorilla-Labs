import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useWorkouts, useCreateWorkout, useDeleteWorkout, WorkoutList } from '../../features/workouts';
import { useUser } from '../../lib/auth';
import GoalRing from '../../components/ui/GoalRing';

export default function WorkoutsRoute() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();

  async function handleCreate() {
    const workout = await createWorkout.mutateAsync();
    navigate(`/workouts/${workout.id}`);
  }

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = workouts.filter((w) => new Date(w.workout_date) >= startOfWeek).length;
  const goal = JSON.parse(localStorage.getItem('gorilla:settings') || '{}').weeklyGoal ?? 5;

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje treningi</h1>
        <GoalRing value={thisWeek} goal={goal} />
      </div>
      <p className="text-xs text-text-muted">Cel tygodnia · {thisWeek}/{goal} treningów</p>
      {!isLoading && (
        <p className="-mt-3.5 mb-1 text-sm text-text-muted">
          {user?.display_name ? `${user.display_name} — ` : ''}
          {workouts.length} zapisanych treningów
        </p>
      )}
      <ErrorBanner>{error?.message}</ErrorBanner>

      <div className="flex gap-2.5">
        <Button variant="primary" className="flex-1" onClick={handleCreate}>
          + Nowy trening (dziś)
        </Button>
        <Button variant="secondary" onClick={() => navigate('/plans')}>
          Z planu
        </Button>
      </div>

      <ErrorBanner>{deleteWorkout.error?.message}</ErrorBanner>
      <ErrorBanner>{createWorkout.error?.message}</ErrorBanner>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <WorkoutList
          workouts={workouts}
          onOpen={(w) => navigate(`/workouts/${w.id}`)}
          onDelete={(w) => deleteWorkout.mutateAsync(w.id)}
        />
      )}
    </div>
  );
}
