import { useNavigate } from 'react-router-dom';
import { useLogout, useUser } from '../../lib/auth';
import Toggle from '../../components/ui/Toggle';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/Toast';
import { useSettings, updateSettings, haptic } from '../../lib/settings';

/* Ustawienia trzymane lokalnie — backend nie ma jeszcze pól w profilu.
   Stan przeniesiony z lokalnego useState do `lib/settings`, żeby zmiana celu
   albo jednostki była natychmiast widoczna na pozostałych ekranach; wcześniej
   lista treningów czytała localStorage raz, przy renderze. */

function Row({ title, hint, children }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-md bg-surface px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body">{title}</span>
        <span className="text-label text-text-muted">{hint}</span>
      </div>
      {children}
    </div>
  );
}

export default function SettingsRoute() {
  const settings = useSettings();
  const { data: user } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  function update(patch) {
    haptic(8);
    updateSettings(patch);
  }

  async function handleLogout() {
    const ok = await confirm({
      title: 'Wylogować się?',
      description: 'Twoje treningi zostaną na koncie — zalogujesz się z powrotem w każdej chwili.',
      confirmLabel: 'Wyloguj',
      tone: 'default',
    });
    if (!ok) return;
    logout();
    toast.info('Wylogowano');
    navigate('/login');
  }

  return (
    <main className="flex flex-col gap-5 px-6 pb-[104px] pt-6">
      <header>
        <h1 className="m-0 font-display text-display font-semibold tracking-wide">Ustawienia</h1>
        {user?.email && <p className="m-0 mt-1 text-body text-text-muted">{user.email}</p>}
      </header>

      <div className="flex flex-col gap-2">
        <Row title="Cel tygodnia" hint="Liczba treningów">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-full bg-surface-raised font-mono text-title text-text transition-transform active:scale-90"
              aria-label="Zmniejsz cel tygodnia"
              onClick={() => update({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
            >
              −
            </button>
            <span className="min-w-6 text-center font-mono text-title font-semibold tabular-nums text-accent">
              {settings.weeklyGoal}
            </span>
            <button
              type="button"
              className="h-11 w-11 rounded-full bg-surface-raised font-mono text-title text-text transition-transform active:scale-90"
              aria-label="Zwiększ cel tygodnia"
              onClick={() => update({ weeklyGoal: Math.min(14, settings.weeklyGoal + 1) })}
            >
              +
            </button>
          </div>
        </Row>

        <Row title="Jednostki" hint="Ciężar w kartach, seriach i rekordach">
          <div className="flex gap-1 rounded-md bg-surface-raised p-1">
            {['kg', 'lb'].map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={settings.unit === u}
                onClick={() => update({ unit: u })}
                className={`min-h-9 rounded-sm px-4 font-mono text-label transition-colors ${
                  settings.unit === u ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Wibracje" hint="Reakcja na zapis serii i przytrzymanie">
          <Toggle
            checked={settings.haptics}
            onChange={(v) => {
              updateSettings({ haptics: v });
              if (v) haptic(18);
            }}
            label="Wibracje"
          />
        </Row>
      </div>

      <button
        type="button"
        className="min-h-12 rounded-md border border-line px-6 text-body text-text-muted transition-colors hover:border-danger hover:text-danger-text"
        onClick={handleLogout}
      >
        Wyloguj
      </button>
    </main>
  );
}
