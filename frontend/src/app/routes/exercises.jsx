import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useExercises, useDeleteExercise, ExerciseList, ExerciseForm } from '../../features/exercises';

export default function ExercisesRoute() {
  const navigate = useNavigate();
  const { data: exercises = [], isLoading } = useExercises();
  const deleteExercise = useDeleteExercise();
  const [search, setSearch] = useState('');

  const matches = (ex, q) =>
    !q || ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q);

  const own = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => !ex.is_global && matches(ex, q));
  }, [exercises, search]);

  const global = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => ex.is_global && matches(ex, q));
  }, [exercises, search]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <Button variant="link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </Button>
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje ćwiczenia</h1>
      <p className="-mt-3.5 mb-1 text-sm text-text-muted">
        Dodawaj własne ćwiczenia — widzisz je tylko Ty, inni użytkownicy ich nie zobaczą.
      </p>

      <input
        type="text"
        placeholder="🔍 Szukaj ćwiczenia..."
        autoComplete="off"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
      />

      <ExerciseForm />

      <div>
        <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
          Twoje własne
        </div>
        <ErrorBanner>{deleteExercise.error?.message}</ErrorBanner>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton />
            <Skeleton />
          </div>
        ) : (
          <ExerciseList
            exercises={own}
            emptyMessage={
              search
                ? 'Brak własnych ćwiczeń pasujących do wyszukiwania.'
                : 'Nie masz jeszcze własnych ćwiczeń. Dodaj pierwsze powyżej.'
            }
            onDelete={(ex) => deleteExercise.mutateAsync(ex.id)}
          />
        )}
      </div>

      <div>
        <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
          Globalne (dostępne dla wszystkich)
        </div>
        {!isLoading && (
          <ExerciseList exercises={global} emptyMessage="Brak globalnych ćwiczeń pasujących do wyszukiwania." />
        )}
      </div>
    </div>
  );
}
