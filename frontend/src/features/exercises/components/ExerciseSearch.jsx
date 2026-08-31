import { SearchIcon, CloseIcon } from '../../../components/ui/icons';

/* Szukajka + filtry grup mięśniowych. Stan trzyma rodzic (routes/exercises).

   Doszły: ikona lupy (pole tekstowe bez afordancji ginęło wśród innych pól),
   przycisk czyszczenia frazy i wyróżnienie aktywnego filtra obrysem — sam
   żółty wypełniacz był mylony z przyciskiem akcji. */
export default function ExerciseSearch({ query, onQueryChange, groups, activeGroup, onGroupChange }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          <SearchIcon size={17} />
        </span>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Szukaj ćwiczenia…"
          aria-label="Szukaj ćwiczenia"
          className="min-h-12 w-full rounded-md border border-line bg-surface pl-11 pr-12 text-body text-text transition-colors placeholder:text-text-muted/70 focus:border-accent"
        />
        {query && (
          <button
            type="button"
            aria-label="Wyczyść wyszukiwanie"
            onClick={() => onQueryChange('')}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const active = activeGroup === g;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={active}
                onClick={() => onGroupChange(active ? null : g)}
                className={`min-h-11 rounded-full border px-4 text-body transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-line bg-surface text-text hover:border-text-muted'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
