import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useWorkouts, useCreateWorkout, useDeleteWorkout, WorkoutList } from '../../features/workouts';
import { useUser } from '../../lib/auth';

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

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje treningi</h1>
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
