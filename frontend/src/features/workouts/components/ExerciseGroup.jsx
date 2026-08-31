import SetRow from './SetRow';
import { useExitTransition } from '../../../hooks/useExitTransition';
import { useSettings } from '../../../lib/settings';
import { formatVolume, volumeUnit } from '../../../lib/units';
import { setVolume } from '../utils/stats';

/**
 * Nagłówek grupy pokazuje teraz też liczbę serii i objętość dla tego
 * ćwiczenia. Sama nazwa nie odpowiadała na pytanie „ile już zrobiłem na
 * klatkę?”, przez co trzeba było liczyć wiersze wzrokiem.
 */
export default function ExerciseGroup({ group, maxWeight, previousBest, onDeleteSet }) {
  const { startExit, cancelExit, isExiting } = useExitTransition();
  const { unit } = useSettings();

  const volume = group.sets.reduce((sum, s) => sum + setVolume(s), 0);
  const heaviest = Math.max(0, ...group.sets.map((s) => s.weight_kg || 0));
  // Rekord odznaczamy tylko na jednym wierszu — najcięższym w tej grupie i
  // tylko wtedy, gdy bije wszystko, co było w tym ćwiczeniu wcześniej.
  // Wymagamy `previousBest > 0`: pierwsze w życiu wejście w dane ćwiczenie
  // formalnie jest rekordem, ale odznaczanie każdego takiego wiersza sprawia,
  // że plakietka przestaje cokolwiek znaczyć.
  const recordSetId =
    previousBest > 0 && heaviest > previousBest
      ? group.sets.find((s) => (s.weight_kg || 0) === heaviest)?.id
      : null;

  async function handleDelete(setId) {
    startExit(setId);
    try {
      await onDeleteSet(setId);
    } catch {
      cancelExit(setId);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 bg-surface-raised px-4 py-3">
        <span className="truncate font-display text-body uppercase tracking-wide">
          {group.exercise_name || 'Ćwiczenie'}
        </span>
        <span className="shrink-0 font-mono text-label tabular-nums text-text-muted">
          {group.sets.length} {group.sets.length === 1 ? 'seria' : 'serie'} ·{' '}
          {formatVolume(volume, unit)} {volumeUnit(unit, volume)}
        </span>
      </div>
      {group.sets.map((s, i) => (
        <div
          key={s.id}
          className={`transition-all duration-200 ${
            isExiting(s.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <SetRow
            set={s}
            index={i}
            maxWeight={maxWeight}
            isRecord={s.id === recordSetId}
            onDelete={() => handleDelete(s.id)}
          />
        </div>
      ))}
    </div>
  );
}
