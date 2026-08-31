/**
 * Przelicznik jednostek. Przełącznik kg/lb istniał w ustawieniach od początku,
 * ale nic go nie czytało — każdy ciężar był twardo pokazywany w kilogramach.
 * Backend przechowuje kilogramy i tak zostaje; konwersja jest wyłącznie
 * warstwą prezentacji, więc nie ma ryzyka rozjechania danych.
 */
const LB_PER_KG = 2.2046226218;

export function toDisplayWeight(kg, unit) {
  if (kg == null) return null;
  return unit === 'lb' ? kg * LB_PER_KG : kg;
}

export function fromDisplayWeight(value, unit) {
  if (value == null) return null;
  return unit === 'lb' ? value / LB_PER_KG : value;
}

/** Liczba bez zbędnego „.0” — 82.5 zostaje 82,5, a 80.0 to po prostu 80. */
export function formatNumber(value, maxDecimals = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 10 ** maxDecimals) / 10 ** maxDecimals;
  return String(Number(rounded));
}

/** „82,5 kg” / „182 lb”. Bez ciężaru (masa własna) zwraca `bodyweightLabel`. */
export function formatWeight(kg, unit = 'kg', { bodyweightLabel = 'bw' } = {}) {
  if (kg == null || kg === 0) return bodyweightLabel;
  return `${formatNumber(toDisplayWeight(kg, unit))} ${unit}`;
}

/** Objętość (tonaż) rośnie szybko — powyżej 10 000 skracamy do „12,4 t”. */
export function formatVolume(kg, unit = 'kg') {
  const value = toDisplayWeight(kg, unit) ?? 0;
  if (unit === 'kg' && value >= 10000) return `${formatNumber(value / 1000)} t`;
  if (value >= 100000) return `${formatNumber(value / 1000)}k`;
  return formatNumber(value, 0);
}

export function volumeUnit(unit = 'kg', kg = 0) {
  if (unit === 'kg' && (toDisplayWeight(kg, unit) ?? 0) >= 10000) return '';
  return unit;
}
