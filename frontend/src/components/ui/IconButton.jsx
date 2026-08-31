/**
 * Ikonowy przycisk o gwarantowanym polu dotyku 44×44 pt. Wcześniej każdy „✕”
 * w aplikacji miał `p-1.5` wokół 16-pikselowego znaku — czyli ~28 px, poniżej
 * minimum z wytycznych Apple i Google. Ikona zostaje mała, klikalny obszar rośnie.
 */
const TONE_CLASSES = {
  muted: 'text-text-muted hover:text-text',
  danger: 'text-text-muted hover:text-danger-text hover:bg-danger-bg',
  accent: 'text-text-muted hover:text-accent',
};

export default function IconButton({
  label,
  tone = 'muted',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`-m-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-title transition-colors duration-150 active:scale-90 ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
