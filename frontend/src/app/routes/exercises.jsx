import { useMemo, useState } from 'react';
import Fab from '../../components/ui/Fab';
import { SkeletonList } from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useExercises, useDeleteExercise, ExerciseList, ExerciseForm, ExerciseSearch } from '../../features/exercises';

/**
 * Biblioteka ćwiczeń. Wcześniej ekran renderował obie listy naraz — własne
 * i globalne (kilkadziesiąt pozycji z seeda) — jedna pod drugą, z formularzem
 * dodawania wciśniętym pomiędzy nagłówek a wyniki. Żeby dojść do globalnych,
 * trzeba było przewinąć wszystko powyżej.
 *
 * Teraz: przełącznik „Moje / Globalne” z licznikami, formularz pod akcją
 * w strefie kciuka, a wyszukiwarka i filtry zostają na górze — działają
 * na obu zakładkach.
 */
export default function ExercisesRoute() {
  const { data: exercises = [], isLoading } = useExercises();
  const deleteExercise = useDeleteExercise();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);
  const [tab, setTab] = useState('own');
  const [formOpen, setFormOpen] = useState(false);

  const groups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))],
    [exercises],
  );

  const { own, global } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (ex) =>
      (!q || ex.name.toLowerCase().includes(q)) && (!group || ex.muscle_group === group);
    return {
      own: exercises.filter((ex) => !ex.is_global && matches(ex)),
      global: exercises.filter((ex) => ex.is_global && matches(ex)),
    };
  }, [exercises, query, group]);

  const visible = tab === 'own' ? own : global;

  return (
    <main className="flex flex-1 flex-col gap-5 px-6 pb-[152px] pt-6">
      <header>
        <h1 className="m-0 font-display text-display font-semibold tracking-wide">Ćwiczenia</h1>
        <p className="m-0 mt-1 text-body text-text-muted">
          Własne ćwiczenia widzisz tylko Ty. Globalne są dostępne dla wszystkich.
        </p>
      </header>

      <ExerciseSearch
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        activeGroup={group}
        onGroupChange={setGroup}
      />

      <SegmentedControl
        ariaLabel="Zakres biblioteki"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'own', label: `Moje (${own.length})` },
          { value: 'global', label: `Globalne (${global.length})` },
        ]}
      />

      <ErrorBanner>{deleteExercise.error?.message}</ErrorBanner>

      {isLoading ? (
        <SkeletonList count={5} height={56} />
      ) : (
        <ExerciseList
          exercises={visible}
          emptyTitle={query || group ? 'Nic nie pasuje' : tab === 'own' ? 'Brak własnych ćwiczeń' : 'Pusto'}
          emptyMessage={
            query || group
              ? 'Zmień frazę albo zdejmij filtr partii mięśniowej.'
              : tab === 'own'
                ? 'Dodaj ćwiczenie, którego nie ma w bibliotece globalnej — na przykład wariant z Twojej siłowni.'
                : 'Biblioteka globalna jest pusta.'
          }
          emptyAction={
            tab === 'own' && !query && !group
              ? { label: 'Dodaj ćwiczenie', onClick: () => setFormOpen(true) }
              : undefined
          }
          onDelete={tab === 'own' ? (ex) => deleteExercise.mutateAsync(ex.id) : undefined}
        />
      )}

      {formOpen && <ExerciseForm onCreated={() => setFormOpen(false)} />}

      <Fab
        label={formOpen ? 'Ukryj formularz' : 'Nowe ćwiczenie'}
        onClick={() => setFormOpen((v) => !v)}
      />
    </main>
  );
}
