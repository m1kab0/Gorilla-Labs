import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * Lekkie powiadomienia nad dolną nawigacją. Do tej pory jedyną informacją
 * zwrotną po zapisie był puls przycisku — niewidoczny, gdy akcja kończyła się
 * nawigacją albo gdy przycisk był poza kadrem. Toast działa niezależnie od tego,
 * gdzie użytkownik patrzy.
 */
const ToastContext = createContext(null);

const TONE_CLASSES = {
  success: 'border-success bg-success-soft text-text',
  error: 'border-danger bg-danger-bg text-danger-text',
  info: 'border-line bg-surface-raised text-text',
};

const TONE_ICON = { success: '✓', error: '!', info: 'i' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = 'success', duration = 2600 } = {}) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (m, o) => push(m, { ...o, tone: 'success' }),
      error: (m, o) => push(m, { ...o, tone: 'error', duration: 4000 }),
      info: (m, o) => push(m, { ...o, tone: 'info' }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-[calc(84px+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex w-full max-w-[560px] -translate-x-1/2 flex-col items-center gap-2 px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full animate-toast-in items-center gap-3 rounded-md border px-4 py-3 text-body shadow-raised ${TONE_CLASSES[t.tone]}`}
            onClick={() => dismiss(t.id)}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-label font-semibold ${
                t.tone === 'error' ? 'bg-danger text-text' : 'bg-success text-accent-fg'
              }`}
              aria-hidden="true"
            >
              {TONE_ICON[t.tone]}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Poza providerem zwracamy no-opy, żeby komponent dało się wyrenderować
   w izolacji (np. w przyszłym teście) bez owijania go całym drzewem. */
const NOOP_TOAST = { toast: () => {}, success: () => {}, error: () => {}, info: () => {} };

export function useToast() {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
