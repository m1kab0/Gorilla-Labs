/**
 * Jedna powierzchnia dla wszystkich kart w aplikacji. Wcześniej każdy ekran
 * dobierał sobie własne tło, promień i padding (rounded, rounded-lg,
 * rounded-[10px], p-3, p-4…), przez co lista treningów, planów i ćwiczeń
 * wyglądały jak trzy różne aplikacje.
 */
const TONE_CLASSES = {
  base: 'bg-surface border border-line',
  raised: 'bg-surface-raised border border-transparent',
  accent: 'bg-accent-soft border border-accent-line',
  ghost: 'bg-transparent border border-dashed border-line',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
};

export default function Card({
  tone = 'base',
  padding = 'sm',
  className = '',
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`rounded-lg shadow-card ${TONE_CLASSES[tone]} ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    />
  );
}
