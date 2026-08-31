import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Zamiennik natywnego `confirm()`. Natywny dialog na mobile wypada z języka
 * wizualnego aplikacji, blokuje wątek i nie da się w nim wyjaśnić konsekwencji
 * (np. że usunięcie planu nie kasuje zapisanych treningów). Tu dostajemy
 * arkusz od dołu, w zasięgu kciuka, z opisem i wyróżnionym przyciskiem anuluj.
 *
 * API: `const confirm = useConfirm(); if (await confirm({...})) ...`
 */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest({
        title: 'Na pewno?',
        confirmLabel: 'Usuń',
        cancelLabel: 'Anuluj',
        tone: 'danger',
        ...options,
      });
    });
  }, []);

  const settle = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    if (!request) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 animate-fade-in bg-bg/70 backdrop-blur-sm"
            onClick={() => settle(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={request.title}
            className="relative w-full max-w-[560px] animate-sheet-up rounded-t-2xl border-t border-line bg-surface px-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-4 shadow-raised"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            <h2 className="m-0 font-display text-title font-semibold uppercase tracking-wide">
              {request.title}
            </h2>
            {request.description && (
              <p className="mb-0 mt-2 text-body text-text-muted">{request.description}</p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`min-h-12 rounded-md px-6 font-display text-body font-semibold uppercase tracking-wide transition-colors ${
                  request.tone === 'danger'
                    ? 'bg-danger text-text hover:opacity-90'
                    : 'bg-accent text-accent-fg hover:bg-accent-hover'
                }`}
              >
                {request.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => settle(false)}
                className="min-h-12 rounded-md border border-line px-6 text-body text-text transition-colors hover:border-text-muted"
              >
                {request.cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/* Fallback poza providerem: natywny confirm, żeby akcja destrukcyjna nigdy
   nie przeszła po cichu bez potwierdzenia. */
export function useConfirm() {
  return useContext(ConfirmContext) ?? ((o) => Promise.resolve(window.confirm(o?.title ?? 'Na pewno?')));
}
