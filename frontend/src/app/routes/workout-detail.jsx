import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { BarbellIcon, ChevronLeftIcon } from '../../components/ui/icons';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/Toast';
import {
  useWorkout,
  useWorkouts,
  useDeleteWorkout,
  useAddSet,
  useDeleteSet,
  formatWorkoutDate,
  previousBests,
  ExerciseGroup,
  PlanExerciseEntry,
  SetLogger,
  WorkoutSummary,
} from '../../features/workouts';
import { useExercises } from '../../features/exercises';
import { usePlan } from '../../features/plans';
import { useSettings } from '../../lib/settings';
import { fromDisplayWeight } from '../../lib/units';

export default function WorkoutDetailRoute() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(workoutId, 10);

  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: allWorkouts = [] } = useWorkouts();
  const { data: exercises = [] } = useExercises();
  const { data: plan } = usePlan(workout?.plan_id);
  const { unit } = useSettings();
  const deleteWorkout = useDeleteWorkout();
  const addSet = useAddSet(id);
  const deleteSet = useDeleteSet(id);
  const confirm = useConfirm();
  const toast = useToast();

  const [planEntries, setPlanEntries] = useState({});

  function entryFor(exerciseId) {
    return { reps: '', weight: '', ...planEntries[exerciseId] };
  }

  function updatePlanEntry(exerciseId, field, value) {
    setPlanEntries((prev) => ({
      ...prev,
      [exerciseId]: { reps: '', weight: '', ...prev[exerciseId], [field]: value },
    }));
  }

  async function submitSet(input) {
    try {
      await addSet.mutateAsync(input);
      toast.success('Seria zapisana');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAddSetFromPlan(exerciseId) {
    const entry = entryFor(exerciseId);
    const repsNum = parseInt(entry.reps, 10);
    if (!repsNum || repsNum <= 0) {
      toast.error('Podaj liczbę powtórzeń.');
      return;
    }
    // Pola planu są w jednostce wybranej w ustawieniach; backend trzyma kilogramy.
    const weightDisplay = entry.weight ? parseFloat(entry.weight) : null;
    await submitSet({
      exerciseId,
      reps: repsNum,
      weightKg: weightDisplay ? fromDisplayWeight(weightDisplay, unit) : null,
    });
    updatePlanEntry(exerciseId, 'reps', '');
    updatePlanEntry(exerciseId, 'weight', '');
  }

  async function handleDeleteWorkout() {
    const ok = await confirm({
      title: 'Usunąć ten trening?',
      description: 'Zniknie razem ze wszystkimi seriami. Tej operacji nie da się cofnąć.',
    });
    if (!ok) return;
    try {
      await deleteWorkout.mutateAsync(id);
      toast.success('Trening usunięty');
      navigate('/workouts');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteSet(setId) {
    try {
      await deleteSet.mutateAsync(setId);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

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

  // Rekordy sprzed tej sesji — potrzebne, by plakietka „Rekord” pojawiła się
  // w treningu, w którym ciężar faktycznie padł, a nie w każdym kolejnym.
  const bests = useMemo(() => previousBests(allWorkouts, id), [allWorkouts, id]);

  const recentExerciseIds = useMemo(() => {
    if (!workout) return [];
    return [...new Set([...workout.sets].reverse().map((s) => s.exercise_id))].slice(0, 6);
  }, [workout]);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-6 pb-[104px] pt-6">
        <SkeletonList count={2} height={40} />
        <SkeletonList count={3} height={96} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 py-6">
        <ErrorBanner>{error.message}</ErrorBanner>
      </main>
    );
  }

  if (!workout) return null;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-[104px] pt-4">
      <div className="flex items-start justify-between gap-2">
        <Button variant="link" className="-ml-2 gap-1" onClick={() => navigate('/workouts')}>
          <ChevronLeftIcon />
          Treningi
        </Button>
        <Button variant="link" className="text-danger-text!" onClick={handleDeleteWorkout}>
          Usuń trening
        </Button>
      </div>

      <h1 className="m-0 font-display text-display font-semibold tracking-wide">
        {formatWorkoutDate(workout.workout_date)}
      </h1>

      {/* Podsumowanie sesji — pierwsza rzecz po dacie, bo „ile dziś zrobiłem”
          to pytanie, z którym wraca się na ten ekran. */}
      <WorkoutSummary workout={workout} />

      <ErrorBanner>{deleteWorkout.error?.message}</ErrorBanner>
      <ErrorBanner>{deleteSet.error?.message}</ErrorBanner>

      {plan && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide text-text-muted">
            Plan: {plan.name}
          </h2>
          {plan.exercises.map((pe) => (
            <PlanExerciseEntry
              key={pe.id}
              planExercise={pe}
              loggedCount={workout.sets.filter((s) => s.exercise_id === pe.exercise_id).length}
              entry={entryFor(pe.exercise_id)}
              onChange={(field, value) => updatePlanEntry(pe.exercise_id, field, value)}
              onSubmit={() => handleAddSetFromPlan(pe.exercise_id)}
            />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <EmptyState icon={<BarbellIcon size={24} />} title="Brak serii">
            Zapisz pierwszą serię w formularzu poniżej — podsumowanie i rekordy policzą się same.
          </EmptyState>
        ) : (
          groups.map((group) => (
            <ExerciseGroup
              key={group.exercise_id}
              group={group}
              maxWeight={maxWeightOverall}
              previousBest={bests.get(group.exercise_id) ?? 0}
              onDeleteSet={handleDeleteSet}
            />
          ))
        )}
      </section>

      {/* Jeden logger zamiast dwóch formularzy jeden pod drugim. */}
      <SetLogger
        exercises={exercises}
        defaultExerciseId={workout.sets.at(-1)?.exercise_id ?? plan?.exercises[0]?.exercise_id}
        recentExerciseIds={recentExerciseIds}
        lastSet={workout.sets.at(-1)}
        hasPlan={!!plan}
        submitting={addSet.isPending}
        onSubmit={submitSet}
      />
    </main>
  );
}
