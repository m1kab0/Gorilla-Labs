import { useMemo, useState } from 'react';
import { SearchIcon, CloseIcon } from '../../../components/ui/icons';

/**
 * Wybór ćwiczenia jednym tapnięciem.
 *
 * Poprzednio ekran treningu miał pole „Szukaj ćwiczenia…”, które filtrowało
 * natywny `<select>` pod spodem — trzeba było wpisać tekst, a potem i tak
 * otworzyć listę systemową i wybrać z niej pozycję. Dwa kroki i dwa różne
 * modele interakcji na jedną decyzję.
 *
 * Tutaj: wybrane ćwiczenie widać jako pigułkę, ostatnio używane są pod ręką
 * (pusta wyszukiwarka nigdy nie pokazuje pustego ekranu), a wpisanie frazy
 * zawęża listę przycisków, w które wchodzi się bezpośrednio.
 */
export default function ExercisePicker({
  exercises,
  value,
  onChange,
  recentIds = [],
  label = 'Ćwiczenie',
  limit = 8,
}) {
  const [query, setQuery] = useState('');
  const selected = exercises.find((e) => String(e.id) === String(value));

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return exercises
        .filter(
          (ex) =>
            ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q),
        )
        .slice(0, limit);
    }
    // Bez frazy: najpierw ostatnio używane, potem reszta w kolejności z API.
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const recent = recentIds.map((id) => byId.get(id)).filter(Boolean);
    const rest = exercises.filter((e) => !recentIds.includes(e.id));
    return [...recent, ...rest].slice(0, limit);
  }, [exercises, query, recentIds, limit]);

  if (selected) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-label uppercase tracking-wider text-text-muted">{label}</span>
        <div className="flex items-center gap-3 rounded-md border border-accent-line bg-accent-soft px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-medium text-text">{selected.name}</div>
            {selected.muscle_group && (
              <div className="truncate text-label text-text-muted">{selected.muscle_group}</div>
            )}
          </div>
          <button
            type="button"
            aria-label="Zmień ćwiczenie"
            title="Zmień ćwiczenie"
            onClick={() => {
              onChange('');
              setQuery('');
            }}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label uppercase tracking-wider text-text-muted">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          <SearchIcon size={17} />
        </span>
        <input
          type="text"
          autoComplete="off"
          placeholder="Szukaj ćwiczenia…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Szukaj ćwiczenia"
          className="min-h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 font-body text-body text-text transition-colors placeholder:text-text-muted/70 focus:border-accent"
        />
      </div>

      {suggestions.length === 0 ? (
        <p className="m-0 px-1 text-label text-text-muted">
          Nic nie pasuje do „{query}”. Dodaj to ćwiczenie poniżej.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!query && recentIds.length > 0 && (
            <span className="w-full px-1 text-label text-text-muted">Ostatnio używane</span>
          )}
          {suggestions.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onChange(String(ex.id))}
              className="min-h-11 rounded-full border border-line bg-surface px-4 text-body text-text transition-colors hover:border-accent hover:text-accent active:scale-[0.97]"
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
