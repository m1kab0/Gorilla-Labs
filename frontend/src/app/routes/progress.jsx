import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import BarChart from '../../components/ui/BarChart';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ProgressIcon, FlameIcon, TrophyIcon } from '../../components/ui/icons';
import {
  useWorkouts,
  weeklyBuckets,
  weeklyStreak,
  personalRecords,
  muscleSplit,
  workoutVolume,
} from '../../features/workouts';
import { useExercises } from '../../features/exercises';
import { useSettings } from '../../lib/settings';
import { formatVolume, volumeUnit, formatWeight, toDisplayWeight, formatNumber } from '../../lib/units';

/**
 * Nowy ekran: Postępy.
 *
 * Aplikacja zbierała komplet danych o objętości i rekordach, ale nie pokazywała
 * z nich niczego — jedyną informacją zwrotną był licznik serii przy dacie.
 * Bez trendu nie widać, czy trening w ogóle działa, a to jedyny powód, dla
 * którego ktoś prowadzi dziennik dłużej niż miesiąc.
 *
 * Wszystko liczone po stronie klienta z `GET /workouts/` (zwraca serie razem
 * z treningami), więc backend nie wymaga żadnej zmiany.
 */
export default function ProgressRoute() {
  const navigate = useNavigate();
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const { data: exercises = [] } = useExercises();
  const { unit } = useSettings();

  const buckets = useMemo(() => weeklyBuckets(workouts, 8), [workouts]);
  const streak = useMemo(() => weeklyStreak(workouts), [workouts]);
  const records = useMemo(() => personalRecords(workouts), [workouts]);
  const split = useMemo(() => muscleSplit(workouts, exercises), [workouts, exercises]);

  const totals = useMemo(() => {
    const volume = workouts.reduce((sum, w) => sum + workoutVolume(w), 0);
    const sets = workouts.reduce((sum, w) => sum + (w.sets?.length || 0), 0);
    return { volume, sets, count: workouts.length };
  }, [workouts]);

  const chartData = useMemo(
    () =>
      buckets.map((b) => ({
        label: b.label,
        shortLabel: b.label.slice(0, 5),
        value: Math.round(toDisplayWeight(b.volume, unit) ?? 0),
      })),
    [buckets, unit],
  );

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-6 pb-[104px] pt-6">
        <SkeletonList count={1} height={40} />
        <SkeletonList count={3} height={120} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-[104px] pt-6">
      <header>
        <h1 className="m-0 font-display text-display font-semibold tracking-wide">Postępy</h1>
        <p className="m-0 mt-1 text-body text-text-muted">
          Wszystko policzone z Twoich zapisanych serii.
        </p>
      </header>

      <ErrorBanner>{error?.message}</ErrorBanner>

      {workouts.length === 0 ? (
        <EmptyState
          icon={<ProgressIcon size={24} />}
          title="Nie ma czego liczyć"
          action={{ label: 'Zacznij pierwszy trening', onClick: () => navigate('/workouts') }}
        >
          Po kilku treningach zobaczysz tu tonaż tydzień po tygodniu, serię tygodni pod rząd
          i rekordy w każdym ćwiczeniu.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={streak} suffix="tyg." label="Seria" highlight />
            <StatTile value={totals.count} label="Treningi" />
            <StatTile
              value={formatVolume(totals.volume, unit)}
              suffix={volumeUnit(unit, totals.volume)}
              label="Tonaż"
            />
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide">
                Objętość tygodniowo
              </h2>
              <span className="shrink-0 text-label text-text-muted">ostatnie 8 tyg. · {unit}</span>
            </div>
            <BarChart
              data={chartData}
              formatValue={(v) => (v >= 1000 ? `${formatNumber(v / 1000)}k` : formatNumber(v, 0))}
              emptyLabel="Brak serii z ciężarem w tym okresie"
            />
          </Card>

          {streak > 0 && (
            <Card tone="accent" className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                <FlameIcon size={22} />
              </span>
              <div>
                <div className="font-display text-title font-semibold uppercase tracking-wide text-accent">
                  {streak} {streak === 1 ? 'tydzień' : streak < 5 ? 'tygodnie' : 'tygodni'} pod rząd
                </div>
                <p className="m-0 mt-0.5 text-label text-text-muted">
                  Jeden trening w tym tygodniu przedłuża serię.
                </p>
              </div>
            </Card>
          )}

          {records.length > 0 && (
            <Card className="flex flex-col gap-4">
              <h2 className="m-0 flex items-center gap-2 font-display text-title font-semibold uppercase tracking-wide">
                <TrophyIcon size={18} />
                Rekordy
              </h2>
              <div className="flex flex-col">
                {records.slice(0, 8).map((r, i) => (
                  <div
                    key={r.exercise_id}
                    className={`flex items-center justify-between gap-3 py-3 ${
                      i > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-body">{r.exercise_name}</div>
                      <div className="text-label text-text-muted">
                        {r.reps} powt. ·{' '}
                        {new Date(`${r.date}T00:00:00`).toLocaleDateString('pl-PL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-title font-semibold tabular-nums text-accent">
                      {formatWeight(r.weight_kg, unit)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {split.length > 0 && (
            <Card className="flex flex-col gap-4">
              <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide">
                Rozkład na partie
              </h2>
              <div className="flex flex-col gap-3">
                {split.slice(0, 6).map((s) => (
                  <div key={s.group} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-body">
                      <span className="truncate">{s.group}</span>
                      <span className="shrink-0 font-mono text-label tabular-nums text-text-muted">
                        {s.share}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${Math.max(2, s.share)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
