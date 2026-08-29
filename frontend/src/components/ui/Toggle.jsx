export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[26px] w-11 shrink-0 rounded-[13px] p-[3px] transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-line'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-bg transition-transform duration-[220ms] ease-[cubic-bezier(.22,.9,.32,1.3)] ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
