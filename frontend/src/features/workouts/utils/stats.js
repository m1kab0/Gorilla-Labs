/**
 * Statystyki liczone po stronie klienta z tego, co i tak zwraca `GET /workouts/`
 * (każdy trening przychodzi razem z seriami). Żaden nowy endpoint nie jest
 * potrzebny, a dzięki temu ekran postępów działa od razu, bez zmian w backendzie.
 * Gdy kiedyś pojawi się `/stats`, te funkcje zostają jako fallback offline.
 */

/** Objętość serii = powtórzenia × ciężar. Seria bez ciężaru (bw) nie wnosi tonażu. */
export function setVolume(set) {
  return (set.reps || 0) * (set.weight_kg || 0);
}

export function workoutVolume(workout) {
  return (workout.sets || []).reduce((sum, s) => sum + setVolume(s), 0);
}

export function workoutStats(workout) {
  const sets = workout?.sets || [];
  const exercises = new Set(sets.map((s) => s.exercise_id));
  const topSet = sets.reduce(
    (best, s) => ((s.weight_kg || 0) > (best?.weight_kg || 0) ? s : best),
    null,
  );
  return {
    setCount: sets.length,
    repCount: sets.reduce((sum, s) => sum + (s.reps || 0), 0),
    exerciseCount: exercises.size,
    volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
    topSet,
  };
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // poniedziałek
  return d;
}

export function weekStart(date = new Date()) {
  return startOfWeek(date);
}

export function workoutsThisWeek(workouts) {
  const from = startOfWeek(new Date());
  return workouts.filter((w) => new Date(`${w.workout_date}T00:00:00`) >= from).length;
}

/**
 * Ostatnie `weeks` tygodni jako kubełki od najstarszego do bieżącego.
 * Bieżący tydzień jest zawsze ostatni — wykres ma się kończyć „tu i teraz”.
 */
export function weeklyBuckets(workouts, weeks = 8) {
  const current = startOfWeek(new Date());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const from = new Date(current);
    from.setDate(from.getDate() - (weeks - 1 - i) * 7);
    return { from, volume: 0, count: 0, sets: 0 };
  });

  workouts.forEach((w) => {
    const ws = startOfWeek(new Date(`${w.workout_date}T00:00:00`)).getTime();
    const bucket = buckets.find((b) => b.from.getTime() === ws);
    if (!bucket) return;
    bucket.volume += workoutVolume(w);
    bucket.count += 1;
    bucket.sets += (w.sets || []).length;
  });

  return buckets.map((b) => ({
    ...b,
    label: b.from.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
  }));
}

/** Ile tygodni pod rząd (licząc wstecz od bieżącego) ma przynajmniej jeden trening. */
export function weeklyStreak(workouts) {
  if (workouts.length === 0) return 0;
  const weeksWithWork = new Set(
    workouts.map((w) => startOfWeek(new Date(`${w.workout_date}T00:00:00`)).getTime()),
  );
  const cursor = startOfWeek(new Date());
  // Bieżący tydzień bez treningu jeszcze nie zrywa serii — jest w toku.
  if (!weeksWithWork.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (weeksWithWork.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

/** Rekord = najcięższa seria w danym ćwiczeniu, z datą i powtórzeniami. */
export function personalRecords(workouts) {
  const best = new Map();
  workouts.forEach((w) => {
    (w.sets || []).forEach((s) => {
      if (!s.weight_kg) return;
      const current = best.get(s.exercise_id);
      if (!current || s.weight_kg > current.weight_kg) {
        best.set(s.exercise_id, {
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name,
          weight_kg: s.weight_kg,
          reps: s.reps,
          date: w.workout_date,
        });
      }
    });
  });
  return [...best.values()].sort((a, b) => b.weight_kg - a.weight_kg);
}

/**
 * Najcięższa seria w każdym ćwiczeniu **przed** danym treningiem — potrzebne,
 * by odznaczyć „rekord!” dokładnie w tej sesji, w której padł, a nie
 * w każdej kolejnej z tym samym ciężarem.
 */
export function previousBests(workouts, currentWorkoutId) {
  const best = new Map();
  const current = workouts.find((w) => w.id === currentWorkoutId);
  const currentDate = current ? current.workout_date : null;

  workouts.forEach((w) => {
    if (w.id === currentWorkoutId) return;
    if (currentDate && w.workout_date > currentDate) return;
    (w.sets || []).forEach((s) => {
      if (!s.weight_kg) return;
      const prev = best.get(s.exercise_id) || 0;
      if (s.weight_kg > prev) best.set(s.exercise_id, s.weight_kg);
    });
  });
  return best;
}

/** Podział objętości na partie mięśniowe — wymaga mapy exercise_id → grupa. */
export function muscleSplit(workouts, exercises) {
  const groupOf = new Map(exercises.map((e) => [e.id, e.muscle_group || 'Inne']));
  const totals = new Map();
  workouts.forEach((w) => {
    (w.sets || []).forEach((s) => {
      const group = groupOf.get(s.exercise_id) || 'Inne';
      totals.set(group, (totals.get(group) || 0) + (setVolume(s) || s.reps || 0));
    });
  });
  const all = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const sum = all.reduce((acc, [, v]) => acc + v, 0) || 1;
  return all.map(([group, value]) => ({ group, value, share: Math.round((value / sum) * 100) }));
}
