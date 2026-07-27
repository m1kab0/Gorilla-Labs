export function formatWorkoutDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' });
}
