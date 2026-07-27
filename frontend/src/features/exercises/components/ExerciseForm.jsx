import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useCreateExercise } from '../api/create-exercise';

export default function ExerciseForm({ onCreated }) {
  const createExercise = useCreateExercise();
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
    const exercise = await createExercise.mutateAsync({ name: name.trim(), muscleGroup: muscleGroup.trim() });
    setName('');
    setMuscleGroup('');
    onCreated?.(exercise);
  }

  return (
    <form className="flex flex-col gap-3 rounded border border-line bg-surface p-4" onSubmit={handleSubmit}>
      <TextField
        id="new-exercise-name"
        label="Nazwa ćwiczenia"
        type="text"
        placeholder="np. Wyciskanie hantli na skosie"
        invalid={nameInvalid}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="new-exercise-muscle"
        label="Partia mięśniowa (opcjonalnie)"
        type="text"
        placeholder="np. klatka piersiowa"
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value)}
      />
      <Button type="submit" variant="primary" pulseOnClick>
        + Dodaj ćwiczenie
      </Button>
      <ErrorBanner>{createExercise.error?.message}</ErrorBanner>
    </form>
  );
}
