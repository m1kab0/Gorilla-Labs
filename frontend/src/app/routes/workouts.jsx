import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Fab from '../../components/ui/Fab';
import { SkeletonList } from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import GoalRing from '../../components/ui/GoalRing';
import Celebration from '../../components/ui/Celebration';
import {
  useWorkouts,
  useCreateWorkout,
  useDeleteWorkout,
  WorkoutList,
  workoutsThisWeek,
  weekStart,
} from '../../features/workouts';
import { useUser } from '../../lib/auth';
import { useSettings, haptic } from '../../lib/settings';
import { useToast } from '../../components/ui/Toast';

export default function WorkoutsRoute() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const { weeklyGoal } = useSettings();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const toast = useToast();
  const [celebrating, setCelebrating] = useState(false);

  const thisWeek = useMemo(() => workoutsThisWeek(workouts), [workouts]);
  const remaining = Math.max(0, weeklyGoal - thisWeek);

  async function handleCreate() {
    haptic(16);
    try {
      const workout = await createWorkout.mutateAsync();
      navigate(`/workouts/${workout.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Cel domykamy raz na tydzień — świętowanie ma być rzadkie, żeby coś znaczyło.
  const handleGoalComplete = useCallback(() => {
    if (isLoading || workouts.length === 0) return;
    const key = `gorilla:celebrated:${weekStart().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setCelebrating(true);
    haptic([20, 60, 20, 60, 40]);
  }, [isLoading, workouts.length]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-[152px] pt-6">
      <Celebration
        show={celebrating}
        message="Cel tygodnia domknięty!"
        onDone={() => setCelebrating(false)}
      />

      {/* Nagłówek z celem: pierścień obok tytułu, a pod nim jedno zdanie
          mówiące, co zrobić dalej. Wcześniej były tu trzy osobne linijki
          tekstu o tej samej wadze — imię, licznik treningów i cel. */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-display font-semibold tracking-wide">
            {user?.display_name ? `Cześć, ${user.display_name}` : 'Twoje treningi'}
          </h1>
          <p className="m-0 mt-1 text-body text-text-muted">
            {isLoading
              ? 'Wczytywanie…'
              : remaining > 0
                ? `Jeszcze ${remaining} ${remaining === 1 ? 'trening' : 'treningi'} do celu tygodnia`
                : 'Cel tygodnia zrobiony. Reszta to bonus.'}
          </p>
        </div>
        <GoalRing value={thisWeek} goal={weeklyGoal} onComplete={handleGoalComplete} />
      </header>

      <ErrorBanner>{error?.message}</ErrorBanner>
      <ErrorBanner>{createWorkout.error?.message}</ErrorBanner>

      {workouts.length > 0 && (
        <Button variant="soft" onClick={() => navigate('/plans')}>
          Zacznij z gotowego planu
        </Button>
      )}

      {isLoading ? (
        <SkeletonList count={4} height={80} />
      ) : (
        <WorkoutList
          workouts={workouts}
          onOpen={(w) => navigate(`/workouts/${w.id}`)}
          onDelete={(w) => deleteWorkout.mutateAsync(w.id)}
          onCreate={handleCreate}
        />
      )}

      {/* Główna akcja wyjęta z góry listy do strefy kciuka — na telefonie
          górna krawędź jest najdroższym miejscem na ekranie. */}
      <Fab label="Nowy trening" onClick={handleCreate} disabled={createWorkout.isPending} />
    </main>
  );
}
