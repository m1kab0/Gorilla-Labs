import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';
import {
  useWorkout,
  useDeleteWorkout,
  useAddSet,
  useDeleteSet,
  formatWorkoutDate,
  ExerciseGroup,
  AddSetForm,
  PlanExerciseEntry,
} from '../../features/workouts';
import { useExercises } from '../../features/exercises';
import { usePlan } from '../../features/plans';

export default function WorkoutDetailRoute() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(workoutId, 10);

  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: exercises = [] } = useExercises();
  const { data: plan } = usePlan(workout?.plan_id);
  const deleteWorkout = useDeleteWorkout();
  const addSet = useAddSet(id);
  const deleteSet = useDeleteSet(id);

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

  async function handleAddSetFromPlan(exerciseId) {
    const entry = entryFor(exerciseId);
    const repsNum = parseInt(entry.reps, 10);
    if (!repsNum || repsNum <= 0) return;
    await addSet.mutateAsync({ exerciseId, reps: repsNum, weightKg: entry.weight ? parseFloat(entry.weight) : null });
    updatePlanEntry(exerciseId, 'reps', '');
    updatePlanEntry(exerciseId, 'weight', '');
  }

  async function handleAddSetFreeform(setInput) {
    await addSet.mutateAsync(setInput);
  }

  async function handleDeleteWorkout() {
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami? Tej operacji nie można odwrócić.')) return;
    try {
      await deleteWorkout.mutateAsync(id);
      navigate('/workouts');
    } catch {
      // handled via deleteWorkout.error rendered in <ErrorBanner>
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

  if (isLoading) return <div className="px-5 py-6">Wczytywanie…</div>;
  if (error)
    return (
      <div className="px-5 py-6">
        <ErrorBanner>{error.message}</ErrorBanner>
      </div>
    );
  if (!workout) return null;

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <div className="flex items-start justify-between">
        <Button variant="link" onClick={() => navigate('/workouts')}>
          ← Wszystkie treningi
        </Button>
        <Button variant="link" className="text-[13px] underline" onClick={handleDeleteWorkout}>
          Usuń trening
        </Button>
      </div>

      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">
        {formatWorkoutDate(workout.workout_date)}
      </h1>

      <ErrorBanner>{deleteWorkout.error?.message}</ErrorBanner>

      {plan && (
        <div>
          <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
            Plan: {plan.name}
          </div>
          <div className="flex flex-col gap-2.5">
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
          </div>
        </div>
      )}

      <ErrorBanner>{deleteSet.error?.message}</ErrorBanner>

      <div className="flex flex-col gap-3.5">
        {groups.length === 0 ? (
          <div className="rounded border border-dashed border-line px-5 py-8 text-center text-sm text-text-muted">
            Brak serii. Dodaj pierwszą poniżej.
          </div>
        ) : (
          groups.map((group) => (
            <ExerciseGroup
              key={group.exercise_id}
              group={group}
              maxWeight={maxWeightOverall}
              onDeleteSet={(setId) => deleteSet.mutateAsync(setId)}
            />
          ))
        )}
      </div>

      <AddSetForm exercises={exercises} hasPlan={!!plan} onSubmit={handleAddSetFreeform} />
    </div>
  );
}
