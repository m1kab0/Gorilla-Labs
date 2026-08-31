/**
 * Pusty stan jako punkt startu, nie komunikat o braku danych. Wcześniej był
 * to przerywany prostokąt z jednym zdaniem — zero wskazówki, dokąd iść.
 * Teraz: ikona, krótki tytuł, wyjaśnienie i (opcjonalnie) akcja, która
 * wyprowadza użytkownika z pustki jednym tapnięciem.
 *
 * `children` nadal działa jako sam opis, żeby proste wywołania zostały proste.
 */
export default function EmptyState({ icon, title, action, children }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </div>
      )}
      {title && <div className="font-display text-title font-semibold uppercase tracking-wide">{title}</div>}
      {children && <p className="m-0 max-w-[36ch] text-body text-text-muted">{children}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="min-h-11 rounded-md bg-accent px-6 font-display text-body font-semibold uppercase tracking-wide text-accent-fg shadow-accent transition-colors hover:bg-accent-hover active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
