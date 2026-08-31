import StatTile from '../../../components/ui/StatTile';
import { useSettings } from '../../../lib/settings';
import { formatVolume, volumeUnit, formatWeight } from '../../../lib/units';
import { workoutStats } from '../utils/stats';

/**
 * Podsumowanie sesji na górze ekranu treningu.
 *
 * Ekran treningu pokazywał dotąd wyłącznie listę serii — wszystko o tej samej
 * wadze wizualnej, żadnej odpowiedzi na pytanie „ile dzisiaj zrobiłem?”.
 * Objętość (tonaż) to jedyna liczba, po której widać postęp z tygodnia na
 * tydzień, a nie było jej nigdzie w aplikacji.
 */
export default function WorkoutSummary({ workout }) {
  const { unit } = useSettings();
  const stats = workoutStats(workout);

  if (stats.setCount === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile value={stats.setCount} label="Serie" highlight />
      <StatTile
        value={formatVolume(stats.volume, unit)}
        suffix={volumeUnit(unit, stats.volume)}
        label="Objętość"
      />
      <StatTile
        value={stats.topSet?.weight_kg ? formatWeight(stats.topSet.weight_kg, unit).split(' ')[0] : '—'}
        suffix={stats.topSet?.weight_kg ? unit : ''}
        label="Najcięższa"
      />
    </div>
  );
}
