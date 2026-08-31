import { useSyncExternalStore } from 'react';

/**
 * Ustawienia trzymane lokalnie — backend nie ma jeszcze pól w profilu.
 *
 * Dlaczego mały store zamiast `useState` w /settings: cel tygodnia czytał
 * dotąd `JSON.parse(localStorage.getItem(...))` bezpośrednio w renderze listy
 * treningów. Zmiana celu w ustawieniach nie odświeżała pierścienia, dopóki
 * użytkownik nie przeładował strony, a uszkodzony wpis w localStorage wywracał
 * cały ekran. `useSyncExternalStore` naprawia jedno i drugie, a przy okazji
 * synchronizuje stan między kartami (`storage`).
 *
 * Po dodaniu endpointu w backendzie wystarczy podmienić `read`/`write`.
 */
const STORAGE_KEY = 'gorilla:settings';

export const DEFAULT_SETTINGS = {
  weeklyGoal: 5,
  unit: 'kg',
  haptics: true,
};

const listeners = new Set();
let cache = null;

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const merged = { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    // Zwracamy tę samą referencję, dopóki treść się nie zmieniła — inaczej
    // useSyncExternalStore wpada w pętlę „snapshot ciągle nowy”.
    if (!cache || JSON.stringify(cache) !== JSON.stringify(merged)) cache = merged;
    return cache;
  } catch {
    if (!cache) cache = DEFAULT_SETTINGS;
    return cache;
  }
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getSettings() {
  return read();
}

export function updateSettings(patch) {
  const next = { ...read(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((l) => l());
  return next;
}

export function useSettings() {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
}

/** Krótka wibracja, o ile użytkownik jej nie wyłączył i sprzęt ją obsługuje. */
export function haptic(pattern = 12) {
  if (!read().haptics) return;
  navigator.vibrate?.(pattern);
}
