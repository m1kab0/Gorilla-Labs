import IconButton from '../../../components/ui/IconButton';
import { CloseIcon } from '../../../components/ui/icons';
import { useSettings } from '../../../lib/settings';
import { formatWeight } from '../../../lib/units';

/* Seria jako słupki talerzy + odczyt „reps × kg”. Wysokość słupków skaluje
   się do najcięższej serii w treningu, więc progres widać bez czytania liczb.

   Doszły: numer serii (bez niego przy sześciu identycznych wierszach nie
   wiadomo, na której się jest), plakietka rekordu i pole dotyku 44 px na
   przycisku usuwania — wcześniej ~28 px, poniżej progu z wytycznych. */
export default function SetRow({ set, index, maxWeight, isRecord = false, onDelete }) {
  const { unit } = useSettings();
  const ratio = set.weight_kg && maxWeight ? set.weight_kg / maxWeight : 0;
  const bars = Array.from({ length: 3 }, (_, i) => Math.max(5, Math.round(22 * ratio) - i * 4));

  return (
    <div className="flex items-center gap-3 border-t border-surface-raised px-4 py-2">
      <span className="w-5 shrink-0 font-mono text-label tabular-nums text-text-muted">{index + 1}</span>

      <div className="flex h-[22px] shrink-0 items-end gap-0.5" aria-hidden="true">
        {set.weight_kg ? (
          bars.map((h, i) => <div key={i} className="w-[5px] rounded-sm bg-accent" style={{ height: h }} />)
        ) : (
          <div className="h-1 w-[17px] rounded-sm bg-line" />
        )}
      </div>

      <div className="flex flex-1 items-center gap-2 font-mono text-body font-semibold">
        {set.reps}×
        {set.weight_kg ? (
          <span className="text-accent">{formatWeight(set.weight_kg, unit)}</span>
        ) : (
          <span className="text-text-muted">bw</span>
        )}
        {isRecord && (
          <span className="animate-pop rounded-full bg-success px-2 py-0.5 font-body text-label font-semibold uppercase tracking-wider text-accent-fg">
            Rekord
          </span>
        )}
      </div>

      <IconButton label="Usuń serię" tone="danger" onClick={onDelete}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
