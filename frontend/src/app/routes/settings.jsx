import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../lib/auth';
import Toggle from '../../components/ui/Toggle';

/* Ustawienia trzymane lokalnie — backend nie ma jeszcze pól w profilu.
   Po dodaniu endpointu wystarczy podmienić useState na mutację. */
const STORAGE_KEY = 'gorilla:settings';

function loadSettings() {
  try {
    return { weeklyGoal: 5, unit: 'kg', haptics: true, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { weeklyGoal: 5, unit: 'kg', haptics: true };
  }
}

function Row({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-surface px-4 py-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13.5px]">{title}</span>
        <span className="text-[11px] text-text-muted">{hint}</span>
      </div>
      {children}
    </div>
  );
}

export default function SettingsRoute() {
  const [settings, setSettings] = useState(loadSettings);
  const logout = useLogout();
  const navigate = useNavigate();

  function update(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <main className="flex flex-col gap-3.5 px-[18px] pb-[100px] pt-[18px]">
      <h1 className="m-0 font-display text-[22px] font-semibold">Ustawienia</h1>

      <div className="flex flex-col gap-2">
        <Row title="Cel tygodnia" hint="Liczba treningów">
          <div className="flex items-center gap-3">
            <button
              className="h-8 w-8 rounded-full bg-surface-raised text-base text-text transition-transform active:scale-90"
              aria-label="Mniej"
              onClick={() => update({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
            >
              −
            </button>
            <span className="min-w-[18px] text-center font-mono text-sm text-accent">{settings.weeklyGoal}</span>
            <button
              className="h-8 w-8 rounded-full bg-surface-raised text-base text-text transition-transform active:scale-90"
              aria-label="Więcej"
              onClick={() => update({ weeklyGoal: Math.min(14, settings.weeklyGoal + 1) })}
            >
              +
            </button>
          </div>
        </Row>

        <Row title="Jednostki" hint="Ciężar i dystans">
          <div className="flex gap-1 rounded-lg bg-surface-raised p-1">
            {['kg', 'lb'].map((u) => (
              <button
                key={u}
                onClick={() => update({ unit: u })}
                className={`rounded-md px-3 py-1 font-mono text-xs transition-colors ${
                  settings.unit === u ? 'bg-accent text-accent-fg' : 'text-text-muted'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Wibracje" hint="Reakcja na przytrzymanie">
          <Toggle checked={settings.haptics} onChange={(v) => update({ haptics: v })} label="Wibracje" />
        </Row>
      </div>

      <button
        className="mt-1.5 rounded-xl border border-line px-4 py-3 text-[13px] text-text-muted transition-colors hover:border-text-muted hover:text-text"
        onClick={handleLogout}
      >
        Wyloguj
      </button>
    </main>
  );
}
