import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useExercises, useDeleteExercise, ExerciseList, ExerciseForm, ExerciseSearch } from '../../features/exercises';

export default function ExercisesRoute() {
  const navigate = useNavigate();
  const { data: exercises = [], isLoading } = useExercises();
  const deleteExercise = useDeleteExercise();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);

  const groups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))],
    [exercises],
  );

  const matches = (ex) => {
    const q = query.trim().toLowerCase();
    return (!q || ex.name.toLowerCase().includes(q)) && (!group || ex.muscle_group === group);
  };

  const own = useMemo(() => exercises.filter((ex) => !ex.is_global && matches(ex)), [exercises, query, group]);
  const global = useMemo(() => exercises.filter((ex) => ex.is_global && matches(ex)), [exercises, query, group]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <Button variant="link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </Button>
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje ćwiczenia</h1>
      <p className="-mt-3.5 mb-1 text-sm text-text-muted">
        Dodawaj własne ćwiczenia — widzisz je tylko Ty, inni użytkownicy ich nie zobaczą.
      </p>

      <ExerciseSearch
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        activeGroup={group}
        onGroupChange={setGroup}
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
              query || group
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
