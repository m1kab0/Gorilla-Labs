import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TextField from '../../../components/ui/TextField';
import RangeControl from '../../../components/ui/RangeControl';
import SegmentedControl from '../../../components/ui/SegmentedControl';
import HoldToConfirmButton from '../../../components/ui/HoldToConfirmButton';
import { ExerciseForm, ExercisePicker } from '../../exercises';
import { useSettings } from '../../../lib/settings';
import { fromDisplayWeight, toDisplayWeight, formatNumber } from '../../../lib/units';

/**
 * Jeden komponent zamiast dwóch formularzy serii.
 *
 * Ekran treningu miał dotąd `QuickSetLogger` (dwa suwaki + FAB na
 * przytrzymanie) i pod nim `AddSetForm` (wyszukiwarka + select + pola liczbowe)
 * — dwa różne sposoby zrobienia tej samej rzeczy, jeden pod drugim. Użytkownik
 * musiał najpierw zdecydować, którym formularzem się posłużyć, a dopiero potem
 * zapisać serię; do tego oba trzymały własny stan wybranego ćwiczenia, więc
 * wybór w jednym nie przenosił się na drugi.
 *
 * Teraz jest jedna karta z przełącznikiem trybu wpisywania. Domyślnie
 * klawiatura: seria to dane powtarzalne i precyzyjne, a do takich suwak jest
 * złym narzędziem (dobry jest do jednorazowego ustawienia). Suwaki zostają
 * dla tych, którzy logują w trakcie serii, jedną ręką.
 *
 * Dodatkowo: „Powtórz ostatnią” — na siłowni kolejna seria to najczęściej
 * dokładnie ta sama seria, a dotąd trzeba ją było wyklikać od zera.
 */
const MODES = [
  { value: 'keypad', label: 'Klawiatura' },
  { value: 'slider', label: 'Suwaki' },
];

const MODE_KEY = 'gorilla:set-logger-mode';

export default function SetLogger({
  exercises,
  defaultExerciseId,
  recentExerciseIds = [],
  lastSet,
  hasPlan = false,
  submitting = false,
  onSubmit,
}) {
  const { unit } = useSettings();
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'keypad');
  const [exerciseId, setExerciseId] = useState(defaultExerciseId ? String(defaultExerciseId) : '');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [sliderReps, setSliderReps] = useState(8);
  const [sliderWeight, setSliderWeight] = useState(unit === 'lb' ? 135 : 60);
  const [repsInvalid, setRepsInvalid] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Gdy plan albo poprzednia seria podpowiada ćwiczenie, a użytkownik jeszcze
  // niczego nie wybrał — przyjmij podpowiedź zamiast pustego pola.
  useEffect(() => {
    if (!exerciseId && defaultExerciseId) setExerciseId(String(defaultExerciseId));
  }, [defaultExerciseId, exerciseId]);

  function changeMode(next) {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
    // Przenieś wartości między trybami, żeby przełączenie nie kasowało pracy.
    if (next === 'slider') {
      const r = parseInt(reps, 10);
      const w = parseFloat(weight);
      if (r > 0) setSliderReps(r);
      if (!Number.isNaN(w)) setSliderWeight(w);
    } else {
      setReps(String(sliderReps));
      setWeight(String(sliderWeight));
    }
  }

  function submit({ reps: r, weightDisplay }) {
    if (!r || r <= 0 || !exerciseId) {
      setRepsInvalid(true);
      return;
    }
    setRepsInvalid(false);
    onSubmit({
      exerciseId: parseInt(exerciseId, 10),
      reps: r,
      weightKg: weightDisplay ? fromDisplayWeight(weightDisplay, unit) : null,
    });
    setReps('');
    setWeight('');
  }

  function repeatLast() {
    if (!lastSet) return;
    onSubmit({
      exerciseId: lastSet.exercise_id,
      reps: lastSet.reps,
      weightKg: lastSet.weight_kg ?? null,
    });
  }

  const lastSetLabel = lastSet
    ? `${lastSet.reps}×${
        lastSet.weight_kg
          ? `${formatNumber(toDisplayWeight(lastSet.weight_kg, unit))} ${unit}`
          : 'bw'
      }`
    : null;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide">
          {hasPlan ? 'Dodatkowa seria' : 'Dodaj serię'}
        </h2>
        <SegmentedControl
          options={MODES}
          value={mode}
          onChange={changeMode}
          ariaLabel="Sposób wpisywania serii"
        />
      </div>

      {lastSet && (
        <button
          type="button"
          onClick={repeatLast}
          disabled={submitting}
          className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-accent-line bg-accent-soft px-4 text-body text-text transition-colors hover:bg-accent/15 active:scale-[0.98] disabled:opacity-50"
        >
          <span className="truncate">
            Powtórz ostatnią · <span className="text-text-muted">{lastSet.exercise_name}</span>
          </span>
          <span className="shrink-0 font-mono font-semibold text-accent">{lastSetLabel}</span>
        </button>
      )}

      <ExercisePicker
        exercises={exercises}
        value={exerciseId}
        onChange={setExerciseId}
        recentIds={recentExerciseIds}
      />

      <Button variant="link" className="self-start" onClick={() => setQuickAddOpen((v) => !v)}>
        {quickAddOpen ? '− Ukryj dodawanie ćwiczenia' : '+ Nie ma Twojego ćwiczenia? Dodaj nowe'}
      </Button>

      {quickAddOpen && (
        <div className="border-t border-line pt-4">
          <ExerciseForm
            bare
            onCreated={(exercise) => {
              setExerciseId(String(exercise.id));
              setQuickAddOpen(false);
            }}
          />
        </div>
      )}

      {mode === 'keypad' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="set-reps"
              label="Powtórzenia"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="10"
              invalid={repsInvalid}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <TextField
              id="set-weight"
              label={`Ciężar (${unit})`}
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              placeholder="Puste = masa własna"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            pulseOnClick
            disabled={submitting || !exerciseId}
            onClick={() => submit({ reps: parseInt(reps, 10), weightDisplay: parseFloat(weight) || 0 })}
          >
            {submitting ? 'Zapisuję…' : 'Dodaj serię'}
          </Button>
        </>
      ) : (
        <>
          <RangeControl
            label="Powtórzenia"
            suffix="powt."
            value={sliderReps}
            onChange={setSliderReps}
            min={1}
            max={30}
            step={1}
          />
          <RangeControl
            label="Ciężar"
            suffix={unit}
            value={sliderWeight}
            onChange={setSliderWeight}
            min={0}
            max={unit === 'lb' ? 440 : 200}
            step={unit === 'lb' ? 5 : 2.5}
          />
          <HoldToConfirmButton
            disabled={!exerciseId || submitting}
            hint={
              exerciseId
                ? `Przytrzymaj, by dodać ${sliderReps}×${sliderWeight} ${unit}`
                : 'Najpierw wybierz ćwiczenie'
            }
            onConfirm={() => submit({ reps: sliderReps, weightDisplay: sliderWeight })}
          />
        </>
      )}
    </Card>
  );
}
