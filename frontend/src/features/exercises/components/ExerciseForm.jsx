import { useState } from 'react';
import Card from '../../../components/ui/Card';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useToast } from '../../../components/ui/Toast';
import { useCreateExercise } from '../api/create-exercise';

/**
 * Partia mięśniowa jest polem tekstowym, ale nie musi być pisana od zera —
 * podpowiedzi jednym tapnięciem zamieniają wpisywanie na wybór, a przy okazji
 * trzymają nazewnictwo w ryzach (bez „klata” / „Klatka” / „klatka piersiowa”
 * jako trzech różnych grup w filtrach).
 */
const COMMON_GROUPS = ['Klatka piersiowa', 'Plecy', 'Nogi', 'Barki', 'Biceps', 'Triceps', 'Brzuch'];

export default function ExerciseForm({ onCreated, bare = false }) {
  const createExercise = useCreateExercise();
  const toast = useToast();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [nameInvalid, setNameInvalid] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameInvalid(true);
      return;
    }
    setNameInvalid(false);
    try {
      const exercise = await createExercise.mutateAsync({
        name: name.trim(),
        muscleGroup: muscleGroup.trim(),
      });
      toast.success(`Dodano „${exercise.name}”`);
      setName('');
      setMuscleGroup('');
      onCreated?.(exercise);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const body = (
    <>
      <TextField
        id="new-exercise-name"
        label="Nazwa ćwiczenia"
        type="text"
        placeholder="np. Wyciskanie hantli na skosie"
        invalid={nameInvalid}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex flex-col gap-3">
        <TextField
          id="new-exercise-muscle"
          label="Partia mięśniowa (opcjonalnie)"
          type="text"
          placeholder="np. klatka piersiowa"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {COMMON_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setMuscleGroup(muscleGroup === g ? '' : g)}
              className={`min-h-9 rounded-full border px-3 text-label transition-colors ${
                muscleGroup === g
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-line bg-surface-raised text-text-muted hover:text-text'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="primary" pulseOnClick disabled={createExercise.isPending}>
        {createExercise.isPending ? 'Dodaję…' : '+ Dodaj ćwiczenie'}
      </Button>
      <ErrorBanner>{createExercise.error?.message}</ErrorBanner>
    </>
  );

  // `bare` — gdy formularz siedzi już w cudzej karcie (logger serii),
  // druga ramka i cień robiłyby z niego pudełko w pudełku.
  if (bare) {
    return (
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {body}
      </form>
    );
  }

  return (
    <Card as="form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {body}
    </Card>
  );
}
