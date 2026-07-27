# Frontend Bulletproof-React Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Prerequisite:** the backend plan (`2026-07-27-backend-restructure-and-plans-feature.md`) must be fully executed first — the Plans feature (Task 7 of this plan) depends on the `/plans/*` API it built.

**Goal:** Rename `Frontend_new/` to `frontend/`, delete the legacy `Frontend/`, and rebuild the app on a bulletproof-react folder structure with TanStack Query for data fetching and Tailwind CSS v4 for styling — applying the three measured WCAG contrast fixes and five approved animations along the way.

**Architecture:** `app/` (routing, providers, thin route pages) + `features/<name>/{api,components}` (the actual UI and data logic, one folder per domain: auth, workouts, exercises, plans) + `components/ui` (shared primitives: Button, TextField, ErrorBanner, EmptyState, Skeleton) + `lib/` (api-client, auth hooks, react-query client) + `config/` (env) + `styles/globals.css` (Tailwind import + `@theme` tokens + keyframes). `AuthContext` is removed entirely — `useUser()` (a TanStack Query hook) replaces it, since the query cache itself is the shared state.

**Tech Stack:** React 19, Vite 8, React Router 7, `@tanstack/react-query` (new dependency), Tailwind CSS v4 + `@tailwindcss/vite` (new dependency), `vite-plugin-pwa` (existing).

## Global Constraints

- No CSS Modules, no other CSS-in-JS library — styling is Tailwind utility classes in JSX plus one global stylesheet for `@theme` tokens and `@keyframes` only.
- Color/font tokens must resolve to the exact values in the design doc's contrast-fix table — do not reintroduce the original unfixed hex values, and do not change `--color-accent` (`#C24A36`), which is intentionally untouched.
- No frontend automated tests (Vitest/RTL) in this round — every task's verification step is manual: run `npm run dev` and check the running app in a browser.
- `confirm()` stays for destructive-action confirmations (delete workout/plan/exercise). `alert()` is removed entirely — mutation/API errors render through the existing `.error-banner` visual pattern (now a Tailwind-styled `ErrorBanner` component); client-side validation errors use the shake animation instead.
- All animations are 120–200ms — this app is used mid-set, at a gym; nothing may block or slow down the next action.
- Feature folders (`features/auth`, `features/workouts`, `features/exercises`, `features/plans`) are only imported through their `index.js` barrel from outside the folder — this is a documented convention, not tool-enforced.
- Polish-language UI copy throughout, matching the existing app exactly (copy the existing Polish strings verbatim when moving markup — do not retranslate or reword).
- The backend runs at `http://localhost:8000` (from `VITE_API_BASE_URL`) — assume it's already running with the `/plans/*` API from the backend plan.

---

## Task 1: Rename folder, delete legacy frontend, install dependencies, scaffold skeleton

**Files:**
- Rename: `Frontend_new/` → `frontend/`
- Delete: `Frontend/` (entire legacy vanilla-JS app)
- Modify: `frontend/package.json` (new dependencies)
- Modify: `frontend/vite.config.js` (add Tailwind plugin)
- Create: empty directory skeleton — `frontend/src/app/routes/`, `frontend/src/components/ui/`, `frontend/src/components/layout/`, `frontend/src/features/auth/`, `frontend/src/features/workouts/api/`, `frontend/src/features/workouts/components/`, `frontend/src/features/exercises/api/`, `frontend/src/features/exercises/components/`, `frontend/src/features/plans/api/`, `frontend/src/features/plans/components/`, `frontend/src/lib/`, `frontend/src/config/`, `frontend/src/styles/`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: the dependency set and folder skeleton every later task writes into. No code interfaces yet — old `src/pages`, `src/components`, `src/lib` still exist untouched here and get replaced/deleted feature-by-feature in later tasks (Task 4 onward), so the app keeps building at every step.

- [ ] **Step 1: Rename the folder, delete the legacy frontend**

```bash
cd /Users/karol/Desktop/gym-app
git mv Frontend_new frontend
git rm -r Frontend
```

- [ ] **Step 2: Install Tailwind CSS v4 and TanStack Query**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm install @tanstack/react-query
npm install -D tailwindcss @tailwindcss/vite
```

Expected: both commands exit 0, `package.json` now lists `@tanstack/react-query` under `dependencies` and `tailwindcss`/`@tailwindcss/vite` under `devDependencies`.

- [ ] **Step 3: Add the Tailwind Vite plugin**

In `/Users/karol/Desktop/gym-app/frontend/vite.config.js`, change:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
```

to:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
```

(Leave the rest of the file — the `VitePWA` config block and `server` block — exactly as-is.)

- [ ] **Step 4: Create the folder skeleton**

```bash
cd /Users/karol/Desktop/gym-app/frontend/src
mkdir -p app/routes components/ui components/layout \
  features/auth/components features/auth/api \
  features/workouts/api features/workouts/components \
  features/exercises/api features/exercises/components \
  features/plans/api features/plans/components \
  lib config styles
```

- [ ] **Step 5: Verify — the app still boots (old `src/pages` etc. are untouched, new empty dirs don't break anything)**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $DEV_PID
```

Expected: `200`

- [ ] **Step 6: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add -A -- frontend
git commit -m "chore(frontend): rename to frontend/, delete legacy vanilla-JS app, add Tailwind+TanStack Query"
```

---

## Task 2: Foundational plumbing — `config/env.js`, `lib/api-client.js`, `lib/react-query.js`, `styles/globals.css`

**Files:**
- Create: `frontend/src/config/env.js`
- Create: `frontend/src/lib/api-client.js`
- Create: `frontend/src/lib/react-query.js`
- Create: `frontend/src/styles/globals.css`
- Delete: `frontend/src/styles.css`
- Modify: `frontend/src/main.jsx` (only the CSS import line — `App` import is untouched until Task 4)

**Interfaces:**
- Consumes: nothing new (Task 1's skeleton dirs).
- Produces (for every later task):
  - `config/env.js` → `env.apiBaseUrl: string`
  - `lib/api-client.js` → `api(path: string, { method?, body?, form? }) => Promise<any>`, `getToken() => string | null`, `setToken(token: string | null) => void`
  - `lib/react-query.js` → `queryClient: QueryClient`
  - `styles/globals.css` → Tailwind utilities (`bg-bg`, `bg-surface`, `bg-surface-raised`, `border-line`, `text-text`, `text-text-muted`, `bg-accent`, `bg-accent-hover`, `text-accent-gold`, `text-accent-text`, `bg-danger-bg`, `font-display`, `font-body`, `font-mono`, `animate-rise`, `animate-shimmer`, `animate-shake`, `rounded` = 4px)

- [ ] **Step 1: Create `config/env.js`**

Create `/Users/karol/Desktop/gym-app/frontend/src/config/env.js`:

```javascript
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};
```

- [ ] **Step 2: Create `lib/api-client.js`**

Create `/Users/karol/Desktop/gym-app/frontend/src/lib/api-client.js`:

```javascript
import { env } from '../config/env';

const TOKEN_KEY = 'zelazo_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let fetchBody;
  if (form) {
    fetchBody = new URLSearchParams(form);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (body) {
    fetchBody = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, { method, headers, body: fetchBody });

  if (!res.ok) {
    let detail = 'Wystąpił błąd. Spróbuj ponownie.';
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {
      // brak treści JSON w odpowiedzi błędu - zostaw domyślny komunikat
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}
```

(Identical logic to the original `src/lib/api.js` — only the file location and error-detail-extraction behavior are unchanged; this is a pure move.)

- [ ] **Step 3: Create `lib/react-query.js`**

Create `/Users/karol/Desktop/gym-app/frontend/src/lib/react-query.js`:

```javascript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 4: Create `styles/globals.css`**

Create `/Users/karol/Desktop/gym-app/frontend/src/styles/globals.css`:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

@theme {
  --color-bg: #2B2925;
  --color-surface: #3A362F;
  --color-surface-raised: #443F37;
  --color-line: #4E483F;
  --color-text: #F0EDE4;
  --color-text-muted: #B5AC9C;
  --color-accent: #C24A36;
  --color-accent-hover: #C64F3A;
  --color-accent-gold: #D9A441;
  --color-accent-text: #EA8E70;
  --color-danger-bg: rgba(194, 74, 54, 0.15);

  --font-display: 'Oswald', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --radius-DEFAULT: 4px;

  --animate-rise: rise 0.45s ease backwards;
  --animate-shimmer: shimmer 1.3s ease-in-out infinite;
  --animate-shake: shake 0.32s ease;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: 150% 0; }
  100% { background-position: -50% 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
  background: var(--color-bg);
  background-image: radial-gradient(circle at 1px 1px, rgba(240, 237, 228, 0.035) 1px, transparent 0);
  background-size: 22px 22px;
  color: var(--color-text);
  font-family: var(--font-body);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

#root {
  max-width: 560px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 5: Point `main.jsx` at the new stylesheet, delete the old one**

In `/Users/karol/Desktop/gym-app/frontend/src/main.jsx`, change:

```javascript
import './styles.css'
```

to:

```javascript
import './styles/globals.css'
```

```bash
rm /Users/karol/Desktop/gym-app/frontend/src/styles.css
```

- [ ] **Step 6: Verify — dev server boots, Tailwind compiles, no CSS errors**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
curl -s http://localhost:5173/src/main.jsx | head -5
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5173/src/styles/globals.css"
kill $DEV_PID
```

Expected: `main.jsx` transpiles (some JS output printed, no error page), and the CSS request returns `200`.

- [ ] **Step 7: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/config frontend/src/lib/api-client.js frontend/src/lib/react-query.js frontend/src/styles/globals.css frontend/src/main.jsx
git rm frontend/src/styles.css
git commit -m "feat(frontend): add env config, api client, react-query client, Tailwind theme"
```

---

## Task 3: Auth hooks, shared UI primitives, shared exit-transition hook

**Files:**
- Create: `frontend/src/lib/auth.jsx`
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/components/ui/TextField.jsx`
- Create: `frontend/src/components/ui/Select.jsx`
- Create: `frontend/src/components/ui/ErrorBanner.jsx`
- Create: `frontend/src/components/ui/EmptyState.jsx`
- Create: `frontend/src/components/ui/Skeleton.jsx`
- Create: `frontend/src/hooks/useExitTransition.js`

**Interfaces:**
- Consumes: `api`, `getToken`, `setToken` from `lib/api-client.js` (Task 2).
- Produces (for every later task):
  - `lib/auth.jsx` → `useUser()` (TanStack Query result: `{ data: user | undefined, isLoading, ... }`), `useLogin()` (mutation, call with `{ email, password }`), `useRegister()` (mutation, call with `{ email, password, displayName }`), `useLogout()` (returns a plain `logout()` function)
  - `components/ui/Button.jsx` → `<Button variant="primary"|"secondary"|"link" pulseOnClick={bool} ...props>` (default export)
  - `components/ui/TextField.jsx` → `<TextField label id invalid ...props>` (default export, wraps `<input>`)
  - `components/ui/Select.jsx` → `<Select label id ...props>{children}</Select>` (default export, wraps `<select>`)
  - `components/ui/ErrorBanner.jsx` → `<ErrorBanner>{message}</ErrorBanner>` (default export, renders nothing if no children)
  - `components/ui/EmptyState.jsx` → `<EmptyState>{message}</EmptyState>` (default export)
  - `components/ui/Skeleton.jsx` → `<Skeleton className="" />` (default export)
  - `hooks/useExitTransition.js` → `useExitTransition()` returns `{ startExit(key), isExiting(key) }`

- [ ] **Step 1: Create `lib/auth.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/lib/auth.jsx`:

```jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken } from './api-client';

const USER_QUERY_KEY = ['auth', 'me'];

async function getMe() {
  return api('/auth/me');
}

export function useUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getMe,
    enabled: !!getToken(),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const tokenRes = await api('/auth/login', { method: 'POST', form: { username: email, password } });
      setToken(tokenRes.access_token);
      return getMe();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(USER_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  const login = useLogin();
  return useMutation({
    mutationFn: async ({ email, password, displayName }) => {
      await api('/auth/register', {
        method: 'POST',
        body: { email, password, display_name: displayName || null },
      });
      return login.mutateAsync({ email, password });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return function logout() {
    setToken(null);
    queryClient.clear();
  };
}
```

Note on `useLogout`: it clears the *entire* query cache, not just the user entry — this prevents a second user logging in on the same browser tab from momentarily seeing the previous user's cached workouts/exercises/plans before their own data loads.

- [ ] **Step 2: Create `components/ui/Button.jsx`** (implements animation #1, the set-logged confirmation pulse)

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/Button.jsx`:

```jsx
import { useState } from 'react';

const VARIANT_CLASSES = {
  primary:
    'bg-accent hover:bg-accent-hover text-white font-display font-semibold uppercase tracking-wide text-sm rounded px-[18px] py-[14px] transition-[background,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-transparent border border-line text-text hover:border-text-muted font-body text-sm rounded px-4 py-3',
  link: 'bg-transparent border-none text-text-muted hover:text-text underline underline-offset-2 text-[13px] p-1',
};

export default function Button({
  variant = 'primary',
  pulseOnClick = false,
  onClick,
  className = '',
  children,
  ...props
}) {
  const [pulsed, setPulsed] = useState(false);

  function handleClick(e) {
    if (pulseOnClick) {
      setPulsed(true);
      setTimeout(() => setPulsed(false), 650);
    }
    onClick?.(e);
  }

  return (
    <button
      className={`relative ${VARIANT_CLASSES[variant]} ${pulsed ? 'bg-[#4b7a4b]' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {pulseOnClick && (
        <span
          className={`absolute -right-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4b7a4b] text-[13px] text-white transition-all duration-150 ${
            pulsed ? 'scale-100 opacity-100' : 'scale-[0.4] opacity-0'
          }`}
        >
          ✓
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Create `components/ui/TextField.jsx`** (implements animation #4, shake-on-invalid)

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/TextField.jsx`:

```jsx
import { useEffect, useState } from 'react';

export default function TextField({ label, id, invalid = false, className = '', ...props }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!invalid) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 320);
    return () => clearTimeout(t);
  }, [invalid]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded border bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold ${
          invalid ? 'border-accent-text' : 'border-line'
        } ${shake ? 'animate-shake' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `components/ui/Select.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/Select.jsx`:

```jsx
export default function Select({ label, id, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/ui/ErrorBanner.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/ErrorBanner.jsx`:

```jsx
export default function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="rounded border border-accent bg-danger-bg px-3.5 py-2.5 text-[13px] text-[#F0C7BE]">
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Create `components/ui/EmptyState.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/EmptyState.jsx`:

```jsx
export default function EmptyState({ children }) {
  return (
    <div className="rounded border border-dashed border-line px-5 py-8 text-center text-sm text-text-muted">
      {children}
    </div>
  );
}
```

- [ ] **Step 7: Create `components/ui/Skeleton.jsx`** (implements animation #3, skeleton loading)

Create `/Users/karol/Desktop/gym-app/frontend/src/components/ui/Skeleton.jsx`:

```jsx
export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`h-[52px] animate-shimmer rounded bg-[linear-gradient(100deg,var(--color-surface)_30%,var(--color-surface-raised)_50%,var(--color-surface)_70%)] bg-[length:200%_100%] ${className}`}
    />
  );
}
```

- [ ] **Step 8: Create `hooks/useExitTransition.js`** (implements animation #2, collapse-on-delete)

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/hooks
```

Create `/Users/karol/Desktop/gym-app/frontend/src/hooks/useExitTransition.js`:

```javascript
import { useCallback, useState } from 'react';

/**
 * Tracks which list items are mid-delete so the list can render a
 * collapse animation instead of the row vanishing instantly. The caller
 * fires its delete mutation in parallel with startExit(key) — once the
 * mutation succeeds and the item drops out of the query data, the row
 * unmounts naturally after the animation has had time to play.
 */
export function useExitTransition() {
  const [exitingKeys, setExitingKeys] = useState(() => new Set());

  const startExit = useCallback((key) => {
    setExitingKeys((prev) => new Set(prev).add(key));
  }, []);

  const isExiting = useCallback((key) => exitingKeys.has(key), [exitingKeys]);

  return { startExit, isExiting };
}
```

- [ ] **Step 9: Verify — dev server still boots (nothing imports these new files yet, this is a compile-error check only)**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $DEV_PID
```

Expected: `200`

- [ ] **Step 10: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/lib/auth.jsx frontend/src/components/ui frontend/src/hooks
git commit -m "feat(frontend): add auth hooks, shared UI primitives, exit-transition hook"
```

---

## Task 4: Layouts + auth feature (login/register)

New files are created alongside the still-untouched old `src/App.jsx`/`src/pages`/`src/lib/AuthContext.jsx` — the app keeps running on the OLD routing throughout Tasks 4-7. Verification here is per-file (curl each new file's dev-server URL directly to force Vite to transpile/resolve it) rather than full click-through, since nothing wires these into the live app yet. The full cutover and click-through verification happens in Task 8.

**Files:**
- Create: `frontend/src/components/layout/ProtectedLayout.jsx`, `frontend/src/components/layout/PublicLayout.jsx`
- Create: `frontend/src/features/auth/components/LoginForm.jsx`, `frontend/src/features/auth/components/RegisterForm.jsx`, `frontend/src/features/auth/index.js`
- Create: `frontend/src/app/routes/login.jsx`, `frontend/src/app/routes/register.jsx`

**Interfaces:**
- Consumes: `useUser`, `useLogin`, `useRegister`, `useLogout` from `lib/auth.jsx` (Task 3); `Button`, `TextField`, `ErrorBanner` from `components/ui` (Task 3).
- Produces (for Task 8's router): `app/routes/login.jsx` default export, `app/routes/register.jsx` default export, `components/layout/ProtectedLayout.jsx` default export (an `<Outlet/>`-rendering layout route element), `components/layout/PublicLayout.jsx` default export (same).

- [ ] **Step 1: Create the layouts**

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/components/layout
```

Create `/Users/karol/Desktop/gym-app/frontend/src/components/layout/ProtectedLayout.jsx`:

```jsx
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser, useLogout } from '../../lib/auth';

export default function ProtectedLayout() {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="flex items-baseline justify-between border-b border-line px-5 pb-[18px] pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <Link
          to="/workouts"
          className="flex items-baseline gap-2 font-display text-[22px] font-bold uppercase tracking-wide text-text no-underline"
        >
          <span className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-accent" />
          Żelazo
        </Link>
        <div className="flex items-center gap-4">
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={() => navigate('/plans')}
          >
            Plany
          </button>
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={() => navigate('/exercises')}
          >
            Ćwiczenia
          </button>
          <button
            className="p-1 font-body text-[13px] text-text-muted underline underline-offset-[3px] hover:text-text"
            onClick={handleLogout}
          >
            Wyloguj
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/components/layout/PublicLayout.jsx`:

```jsx
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useUser } from '../../lib/auth';

export default function PublicLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return null;
  if (user) return <Navigate to="/workouts" replace />;

  return (
    <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <header className="flex items-baseline justify-between border-b border-line px-5 pb-[18px] pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <Link
          to="/login"
          className="flex items-baseline gap-2 font-display text-[22px] font-bold uppercase tracking-wide text-text no-underline"
        >
          <span className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-accent" />
          Żelazo
        </Link>
      </header>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 2: Create the auth feature's form components**

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/auth/components
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/auth/components/LoginForm.jsx`:

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../../lib/auth';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate('/workouts');
    } catch (_) {
      // błąd jest już wystawiony niżej przez login.error
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Zaloguj się</h1>
      <ErrorBanner>{login.error?.message}</ErrorBanner>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="login-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="login-password"
          label="Hasło"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={login.isPending}>
          {login.isPending ? 'Logowanie…' : 'Zaloguj'}
        </Button>
      </form>
      <div className="text-center text-[13px] text-text-muted">
        Nie masz konta?{' '}
        <Link to="/register" className="text-accent-gold underline">
          Zarejestruj się
        </Link>
      </div>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/auth/components/RegisterForm.jsx`:

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../../lib/auth';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function RegisterForm() {
  const register = useRegister();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, password, displayName });
      navigate('/workouts');
    } catch (_) {
      // błąd jest już wystawiony niżej przez register.error
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Załóż konto</h1>
      <ErrorBanner>{register.error?.message}</ErrorBanner>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="register-name"
          label="Imię / nick"
          type="text"
          autoComplete="nickname"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="register-password"
          label="Hasło"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={register.isPending}>
          {register.isPending ? 'Tworzenie konta…' : 'Utwórz konto'}
        </Button>
      </form>
      <div className="text-center text-[13px] text-text-muted">
        Masz już konto?{' '}
        <Link to="/login" className="text-accent-gold underline">
          Zaloguj się
        </Link>
      </div>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/auth/index.js`:

```javascript
export { default as LoginForm } from './components/LoginForm';
export { default as RegisterForm } from './components/RegisterForm';
```

- [ ] **Step 3: Create the route pages**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/login.jsx`:

```jsx
import { LoginForm } from '../../features/auth';

export default function LoginRoute() {
  return <LoginForm />;
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/register.jsx`:

```jsx
import { RegisterForm } from '../../features/auth';

export default function RegisterRoute() {
  return <RegisterForm />;
}
```

- [ ] **Step 4: Verify — each new file transpiles cleanly via Vite's on-demand dev server**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
for f in src/components/layout/ProtectedLayout.jsx src/components/layout/PublicLayout.jsx \
         src/features/auth/components/LoginForm.jsx src/features/auth/components/RegisterForm.jsx \
         src/features/auth/index.js src/app/routes/login.jsx src/app/routes/register.jsx; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/$f")
  echo "$f -> $code"
done
kill $DEV_PID
```

Expected: every line ends in `-> 200`. A `500` means a syntax error or unresolved import in that file — fix before moving on.

- [ ] **Step 5: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/components/layout frontend/src/features/auth frontend/src/app/routes/login.jsx frontend/src/app/routes/register.jsx
git commit -m "feat(frontend): add layouts and auth feature (login/register)"
```

---

## Task 5: Exercises feature

**Files:**
- Create: `frontend/src/features/exercises/api/get-exercises.js`, `create-exercise.js`, `delete-exercise.js`
- Create: `frontend/src/features/exercises/components/ExerciseListItem.jsx`, `ExerciseList.jsx`, `ExerciseForm.jsx`
- Create: `frontend/src/features/exercises/index.js`
- Create: `frontend/src/app/routes/exercises.jsx`

**Interfaces:**
- Consumes: `api` from `lib/api-client.js` (Task 2); `Button`, `TextField`, `ErrorBanner`, `EmptyState`, `Skeleton` from `components/ui` (Task 3); `useExitTransition` from `hooks/` (Task 3).
- Produces (for Task 6 (plans) and Task 7 (workouts) barrel imports, and Task 8's router):
  - `features/exercises` barrel exports: `useExercises()` (query, `data: Exercise[]`), `useCreateExercise()` (mutation, call with `{ name, muscleGroup }`), `useDeleteExercise()` (mutation, call with `id: number`), `ExerciseList` component (`{ exercises, emptyMessage, onDelete? }`), `ExerciseForm` component (`{ onCreated? }`)
  - `app/routes/exercises.jsx` default export

- [ ] **Step 1: Create the API hooks**

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/exercises/api
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/exercises/components
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/api/get-exercises.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getExercises() {
  return api('/exercises/');
}

export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: getExercises });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/api/create-exercise.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createExercise({ name, muscleGroup }) {
  return api('/exercises/', { method: 'POST', body: { name, muscle_group: muscleGroup || null } });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: (exercise) => {
      queryClient.setQueryData(['exercises'], (prev) => (prev ? [...prev, exercise] : [exercise]));
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/api/delete-exercise.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteExercise(id) {
  return api(`/exercises/${id}`, { method: 'DELETE' });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['exercises'], (prev) => prev?.filter((ex) => ex.id !== id) ?? []);
    },
  });
}
```

- [ ] **Step 2: Create the components** (list rendering implements animation #2, collapse-on-delete)

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/components/ExerciseListItem.jsx`:

```jsx
export default function ExerciseListItem({ exercise, onDelete }) {
  return (
    <div
      className={`flex items-center justify-between rounded border border-line bg-surface px-3.5 py-3 ${
        exercise.is_global ? 'opacity-75' : ''
      }`}
    >
      <div>
        <div className="font-body text-sm font-medium">{exercise.name}</div>
        {exercise.muscle_group && <div className="mt-0.5 text-xs text-text-muted">{exercise.muscle_group}</div>}
      </div>
      {onDelete && (
        <button
          className="p-1.5 text-base text-text-muted hover:text-accent-text"
          title="Usuń ćwiczenie"
          onClick={() => onDelete(exercise)}
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/components/ExerciseList.jsx`:

```jsx
import EmptyState from '../../../components/ui/EmptyState';
import ExerciseListItem from './ExerciseListItem';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function ExerciseList({ exercises, emptyMessage, onDelete }) {
  const { startExit, isExiting } = useExitTransition();

  if (exercises.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  function handleDelete(exercise) {
    startExit(exercise.id);
    onDelete(exercise);
  }

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className={`transition-all duration-200 ${
            isExiting(ex.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-20 opacity-100'
          }`}
        >
          <ExerciseListItem exercise={ex} onDelete={onDelete && handleDelete} />
        </div>
      ))}
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/components/ExerciseForm.jsx`:

```jsx
import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useCreateExercise } from '../api/create-exercise';

export default function ExerciseForm({ onCreated }) {
  const createExercise = useCreateExercise();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [nameInvalid, setNameInvalid] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameInvalid(true);
      return;
    }
    setNameInvalid(false);
    const exercise = await createExercise.mutateAsync({ name: name.trim(), muscleGroup: muscleGroup.trim() });
    setName('');
    setMuscleGroup('');
    onCreated?.(exercise);
  }

  return (
    <form className="flex flex-col gap-3 rounded border border-line bg-surface p-4" onSubmit={handleSubmit}>
      <TextField
        id="new-exercise-name"
        label="Nazwa ćwiczenia"
        type="text"
        placeholder="np. Wyciskanie hantli na skosie"
        invalid={nameInvalid}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="new-exercise-muscle"
        label="Partia mięśniowa (opcjonalnie)"
        type="text"
        placeholder="np. klatka piersiowa"
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value)}
      />
      <Button type="submit" variant="primary" pulseOnClick>
        + Dodaj ćwiczenie
      </Button>
      <ErrorBanner>{createExercise.error?.message}</ErrorBanner>
    </form>
  );
}
```

- [ ] **Step 3: Create the barrel**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/exercises/index.js`:

```javascript
export { useExercises } from './api/get-exercises';
export { useCreateExercise } from './api/create-exercise';
export { useDeleteExercise } from './api/delete-exercise';
export { default as ExerciseList } from './components/ExerciseList';
export { default as ExerciseForm } from './components/ExerciseForm';
```

- [ ] **Step 4: Create the route page**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/exercises.jsx`:

```jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useExercises, useDeleteExercise, ExerciseList, ExerciseForm } from '../../features/exercises';

export default function ExercisesRoute() {
  const navigate = useNavigate();
  const { data: exercises = [], isLoading } = useExercises();
  const deleteExercise = useDeleteExercise();
  const [search, setSearch] = useState('');

  const matches = (ex, q) =>
    !q || ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q);

  const own = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => !ex.is_global && matches(ex, q));
  }, [exercises, search]);

  const global = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => ex.is_global && matches(ex, q));
  }, [exercises, search]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <Button variant="link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </Button>
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje ćwiczenia</h1>
      <p className="-mt-3.5 mb-1 text-sm text-text-muted">
        Dodawaj własne ćwiczenia — widzisz je tylko Ty, inni użytkownicy ich nie zobaczą.
      </p>

      <input
        type="text"
        placeholder="🔍 Szukaj ćwiczenia..."
        autoComplete="off"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold"
      />

      <ExerciseForm />

      <div>
        <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
          Twoje własne
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton />
            <Skeleton />
          </div>
        ) : (
          <ExerciseList
            exercises={own}
            emptyMessage={
              search
                ? 'Brak własnych ćwiczeń pasujących do wyszukiwania.'
                : 'Nie masz jeszcze własnych ćwiczeń. Dodaj pierwsze powyżej.'
            }
            onDelete={(ex) => deleteExercise.mutate(ex.id)}
          />
        )}
      </div>

      <div>
        <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
          Globalne (dostępne dla wszystkich)
        </div>
        {!isLoading && (
          <ExerciseList exercises={global} emptyMessage="Brak globalnych ćwiczeń pasujących do wyszukiwania." />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify — each new file transpiles cleanly**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
for f in src/features/exercises/api/get-exercises.js src/features/exercises/api/create-exercise.js \
         src/features/exercises/api/delete-exercise.js src/features/exercises/components/ExerciseListItem.jsx \
         src/features/exercises/components/ExerciseList.jsx src/features/exercises/components/ExerciseForm.jsx \
         src/features/exercises/index.js src/app/routes/exercises.jsx; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/$f")
  echo "$f -> $code"
done
kill $DEV_PID
```

Expected: every line ends in `-> 200`.

- [ ] **Step 6: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/features/exercises frontend/src/app/routes/exercises.jsx
git commit -m "feat(frontend): add exercises feature"
```

---

## Task 6: Plans feature

Plans is built before Workouts because `WorkoutDetail` (Task 7) needs `usePlan()` for its plan-driven add-set panel — building plans first lets workouts import from it via the barrel, rather than the other way around.

**Files:**
- Create: `frontend/src/features/plans/api/get-plans.js`, `get-plan.js`, `create-plan.js`, `delete-plan.js`, `start-plan.js`
- Create: `frontend/src/features/plans/components/PlanCard.jsx`, `PlanList.jsx`, `PlanForm.jsx`
- Create: `frontend/src/features/plans/index.js`
- Create: `frontend/src/app/routes/plans.jsx`

**Interfaces:**
- Consumes: `api` from `lib/api-client.js`; `useExercises` from `features/exercises` barrel (Task 5, cross-feature import — allowed, routes and other features may import a feature's barrel); `Button`, `TextField`, `Select`, `ErrorBanner`, `EmptyState`, `Skeleton` from `components/ui`; `useExitTransition` from `hooks/`.
- Produces (for Task 7's workout-detail route and Task 8's router):
  - `features/plans` barrel exports: `usePlans()`, `usePlan(planId)` (query, `enabled: !!planId`), `useCreatePlan()`, `useDeletePlan()`, `useStartPlan()` (mutation, call with `planId: number`, resolves to the created `Workout`, invalidates the `['workouts']` query key on success), `PlanList`, `PlanForm` components
  - `app/routes/plans.jsx` default export

- [ ] **Step 1: Create the API hooks**

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/plans/api
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/plans/components
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/api/get-plans.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getPlans() {
  return api('/plans/');
}

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: getPlans });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/api/get-plan.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getPlan(planId) {
  return api(`/plans/${planId}`);
}

export function usePlan(planId) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: () => getPlan(planId),
    enabled: !!planId,
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/api/create-plan.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createPlan({ name, exercises }) {
  return api('/plans/', { method: 'POST', body: { name, exercises } });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plans'], (prev) => (prev ? [plan, ...prev] : [plan]));
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/api/delete-plan.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deletePlan(planId) {
  return api(`/plans/${planId}`, { method: 'DELETE' });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: (_data, planId) => {
      queryClient.setQueryData(['plans'], (prev) => prev?.filter((p) => p.id !== planId) ?? []);
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/api/start-plan.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function startPlan(planId) {
  return api(`/plans/${planId}/start`, { method: 'POST' });
}

export function useStartPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
```

- [ ] **Step 2: Create the components**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/components/PlanCard.jsx`:

```jsx
import Button from '../../../components/ui/Button';

export default function PlanCard({ plan, onStart, onDelete, starting }) {
  return (
    <div className="flex items-center justify-between rounded border border-line bg-surface p-4">
      <div>
        <div className="font-display text-lg font-semibold">{plan.name}</div>
        <div className="mt-0.5 text-xs text-text-muted">
          {plan.exercises.length === 0
            ? 'Brak ćwiczeń w planie'
            : plan.exercises.map((e) => e.exercise_name).join(', ')}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" disabled={starting} onClick={() => onStart(plan)}>
          {starting ? 'Startuję…' : 'Zacznij trening'}
        </Button>
        <button
          className="p-1.5 text-base text-text-muted hover:text-accent-text"
          title="Usuń plan"
          onClick={() => onDelete(plan)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/components/PlanList.jsx` (implements animation #2, collapse-on-delete):

```jsx
import EmptyState from '../../../components/ui/EmptyState';
import PlanCard from './PlanCard';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function PlanList({ plans, startingId, onStart, onDelete }) {
  const { startExit, isExiting } = useExitTransition();

  if (plans.length === 0) {
    return <EmptyState>Nie masz jeszcze żadnego planu. Stwórz pierwszy poniżej.</EmptyState>;
  }

  function handleDelete(plan) {
    startExit(plan.id);
    onDelete(plan);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`transition-all duration-200 ${
            isExiting(plan.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-32 opacity-100'
          }`}
        >
          <PlanCard plan={plan} starting={startingId === plan.id} onStart={onStart} onDelete={handleDelete} />
        </div>
      ))}
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/components/PlanForm.jsx`:

```jsx
import { useState } from 'react';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useExercises } from '../../exercises';
import { useCreatePlan } from '../api/create-plan';

let rowIdCounter = 0;
function newRow() {
  rowIdCounter += 1;
  return { rowId: rowIdCounter, exercise_id: '', target_sets: '', target_reps: '' };
}

export default function PlanForm() {
  const { data: exercises = [] } = useExercises();
  const createPlan = useCreatePlan();
  const [planName, setPlanName] = useState('');
  const [rows, setRows] = useState([newRow()]);
  const [error, setError] = useState('');

  function updateRow(rowId, field, value) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!planName.trim()) {
      setError('Podaj nazwę planu.');
      return;
    }
    const validRows = rows.filter((r) => r.exercise_id);
    if (validRows.length === 0) {
      setError('Dodaj przynajmniej jedno ćwiczenie do planu.');
      return;
    }
    await createPlan.mutateAsync({
      name: planName.trim(),
      exercises: validRows.map((r, idx) => ({
        exercise_id: parseInt(r.exercise_id, 10),
        order_index: idx,
        target_sets: r.target_sets ? parseInt(r.target_sets, 10) : null,
        target_reps: r.target_reps ? parseInt(r.target_reps, 10) : null,
      })),
    });
    setPlanName('');
    setRows([newRow()]);
  }

  const exerciseOptions = exercises.map((ex) => ({
    id: ex.id,
    label: ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name,
  }));

  return (
    <form className="flex flex-col gap-3 rounded border border-line bg-surface p-4" onSubmit={handleSubmit}>
      <TextField
        id="plan-name"
        label="Nazwa planu"
        type="text"
        placeholder="np. Push day"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
      />

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.rowId} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
            <Select
              label="Ćwiczenie"
              value={row.exercise_id}
              onChange={(e) => updateRow(row.rowId, 'exercise_id', e.target.value)}
            >
              <option value="">Wybierz…</option>
              {exerciseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <TextField
              label="Serie"
              type="number"
              min="1"
              placeholder="np. 3"
              value={row.target_sets}
              onChange={(e) => updateRow(row.rowId, 'target_sets', e.target.value)}
            />
            <TextField
              label="Powt."
              type="number"
              min="1"
              placeholder="np. 10"
              value={row.target_reps}
              onChange={(e) => updateRow(row.rowId, 'target_reps', e.target.value)}
            />
            <button
              type="button"
              className="p-1.5 text-base text-text-muted hover:text-accent-text"
              title="Usuń ćwiczenie z planu"
              onClick={() => removeRow(row.rowId)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addRow}>
        + Dodaj ćwiczenie do planu
      </Button>
      <Button type="submit" variant="primary" pulseOnClick>
        Zapisz plan
      </Button>
      <ErrorBanner>{error || createPlan.error?.message}</ErrorBanner>
    </form>
  );
}
```

- [ ] **Step 3: Create the barrel**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/plans/index.js`:

```javascript
export { usePlans } from './api/get-plans';
export { usePlan } from './api/get-plan';
export { useCreatePlan } from './api/create-plan';
export { useDeletePlan } from './api/delete-plan';
export { useStartPlan } from './api/start-plan';
export { default as PlanList } from './components/PlanList';
export { default as PlanForm } from './components/PlanForm';
```

- [ ] **Step 4: Create the route page**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/plans.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { usePlans, useDeletePlan, useStartPlan, PlanList, PlanForm } from '../../features/plans';

export default function PlansRoute() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const startPlan = useStartPlan();
  const [startingId, setStartingId] = useState(null);

  function handleDelete(plan) {
    if (!confirm('Usunąć ten plan? Treningi już zapisane na jego podstawie zostaną — usuwasz tylko szablon.')) return;
    deletePlan.mutate(plan.id);
  }

  async function handleStart(plan) {
    setStartingId(plan.id);
    try {
      const workout = await startPlan.mutateAsync(plan.id);
      navigate(`/workouts/${workout.id}`);
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <Button variant="link" onClick={() => navigate('/workouts')}>
        ← Wszystkie treningi
      </Button>
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje plany</h1>
      <p className="-mt-3.5 mb-1 text-sm text-text-muted">Ułóż plan raz, odpalaj trening jednym kliknięciem.</p>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <PlanList plans={plans} startingId={startingId} onStart={handleStart} onDelete={handleDelete} />
      )}

      <PlanForm />
    </div>
  );
}
```

- [ ] **Step 5: Verify — each new file transpiles cleanly**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
for f in src/features/plans/api/get-plans.js src/features/plans/api/get-plan.js \
         src/features/plans/api/create-plan.js src/features/plans/api/delete-plan.js src/features/plans/api/start-plan.js \
         src/features/plans/components/PlanCard.jsx src/features/plans/components/PlanList.jsx src/features/plans/components/PlanForm.jsx \
         src/features/plans/index.js src/app/routes/plans.jsx; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/$f")
  echo "$f -> $code"
done
kill $DEV_PID
```

Expected: every line ends in `-> 200`.

- [ ] **Step 6: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/features/plans frontend/src/app/routes/plans.jsx
git commit -m "feat(frontend): add plans feature"
```

---

## Task 7: Workouts feature (list + detail, the largest feature — barbell visual, plan-driven panel, quick-add)

**Files:**
- Create: `frontend/src/features/workouts/api/get-workouts.js`, `get-workout.js`, `create-workout.js`, `delete-workout.js`, `add-set.js`, `delete-set.js`
- Create: `frontend/src/features/workouts/utils/format-date.js`
- Create: `frontend/src/features/workouts/components/WorkoutCard.jsx`, `WorkoutList.jsx`, `SetRow.jsx`, `ExerciseGroup.jsx`, `PlanExerciseEntry.jsx`, `AddSetForm.jsx`
- Create: `frontend/src/features/workouts/index.js`
- Create: `frontend/src/app/routes/workouts.jsx`, `frontend/src/app/routes/workout-detail.jsx`

**Interfaces:**
- Consumes: `api` from `lib/api-client.js`; `useUser` from `lib/auth.jsx`; `useExercises`, `ExerciseForm` from `features/exercises` barrel (Task 5); `usePlan` from `features/plans` barrel (Task 6); `Button`, `TextField`, `Select`, `ErrorBanner`, `EmptyState`, `Skeleton` from `components/ui`; `useExitTransition` from `hooks/`.
- Produces (for Task 8's router): `features/workouts` barrel exports `useWorkouts()`, `useWorkout(workoutId)`, `useCreateWorkout()`, `useDeleteWorkout()`, `useAddSet(workoutId)` (mutation, call with `{ exerciseId, reps, weightKg }`), `useDeleteSet(workoutId)` (mutation, call with `setId`), `formatWorkoutDate(dateStr)`, `WorkoutList`, `ExerciseGroup`, `AddSetForm`, `PlanExerciseEntry` components; `app/routes/workouts.jsx` and `app/routes/workout-detail.jsx` default exports.

- [ ] **Step 1: Create the API hooks**

```bash
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/workouts/api
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/workouts/utils
mkdir -p /Users/karol/Desktop/gym-app/frontend/src/features/workouts/components
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/get-workouts.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getWorkouts() {
  return api('/workouts/');
}

export function useWorkouts() {
  return useQuery({ queryKey: ['workouts'], queryFn: getWorkouts });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/get-workout.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getWorkout(workoutId) {
  return api(`/workouts/${workoutId}`);
}

export function useWorkout(workoutId) {
  return useQuery({
    queryKey: ['workouts', workoutId],
    queryFn: () => getWorkout(workoutId),
    enabled: !!workoutId,
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/create-workout.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createWorkout() {
  return api('/workouts/', { method: 'POST', body: {} });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/delete-workout.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteWorkout(workoutId) {
  return api(`/workouts/${workoutId}`, { method: 'DELETE' });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: (_data, workoutId) => {
      queryClient.setQueryData(['workouts'], (prev) => prev?.filter((w) => w.id !== workoutId) ?? []);
      queryClient.removeQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/add-set.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function addSet(workoutId, { exerciseId, reps, weightKg }) {
  return api(`/workouts/${workoutId}/sets`, {
    method: 'POST',
    body: { exercise_id: exerciseId, reps, weight_kg: weightKg, set_number: 1 },
  });
}

export function useAddSet(workoutId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setInput) => addSet(workoutId, setInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/api/delete-set.js`:

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteSet(setId) {
  return api(`/workouts/sets/${setId}`, { method: 'DELETE' });
}

export function useDeleteSet(workoutId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
```

- [ ] **Step 2: Create the shared date formatter**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/utils/format-date.js`:

```javascript
export function formatWorkoutDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' });
}
```

- [ ] **Step 3: Create the list-view components** (`WorkoutList` implements animations #2 collapse-on-delete and #5 entrance stagger + hover-lift)

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/WorkoutCard.jsx`:

```jsx
import { formatWorkoutDate } from '../utils/format-date';

export default function WorkoutCard({ workout, onOpen, onDelete }) {
  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded border border-line bg-surface p-4 transition-colors duration-150 hover:border-accent-gold"
      onClick={() => onOpen(workout)}
    >
      <div>
        <div className="font-display text-lg font-semibold">{formatWorkoutDate(workout.workout_date)}</div>
        <div className="mt-0.5 text-xs text-text-muted">{workout.notes || 'Brak notatki'}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="font-mono text-xl text-accent-gold [text-shadow:0_0_14px_rgba(217,164,65,0.35)]">
          {workout.sets.length}
          <span className="text-[11px] text-text-muted"> serii</span>
        </div>
        <button
          className="p-1.5 text-base text-text-muted hover:text-accent-text"
          title="Usuń trening"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(workout);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/WorkoutList.jsx`:

```jsx
import EmptyState from '../../../components/ui/EmptyState';
import WorkoutCard from './WorkoutCard';
import { useExitTransition } from '../../../hooks/useExitTransition';

export default function WorkoutList({ workouts, onOpen, onDelete }) {
  const { startExit, isExiting } = useExitTransition();

  if (workouts.length === 0) {
    return <EmptyState>Brak zapisanych treningów. Zacznij od kliknięcia powyżej.</EmptyState>;
  }

  function handleDelete(workout) {
    startExit(workout.id);
    onDelete(workout);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {workouts.map((w, idx) => (
        <div
          key={w.id}
          className={`animate-rise transition-all duration-200 ${
            isExiting(w.id) ? 'max-h-0 -translate-x-3 overflow-hidden opacity-0' : 'max-h-32 opacity-100'
          }`}
          style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
        >
          <WorkoutCard workout={w} onOpen={onOpen} onDelete={handleDelete} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create the detail-view components**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/SetRow.jsx`:

```jsx
export default function SetRow({ set, index, maxWeight, onDelete }) {
  const plateWidthPct = set.weight_kg ? Math.max(15, Math.round((set.weight_kg / maxWeight) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 border-t border-line bg-surface px-3.5 py-3">
      <div className="w-[18px] font-mono text-xs text-text-muted">#{index + 1}</div>
      <div className="flex h-[22px] flex-1 items-center gap-0.5">
        <div className="h-1 flex-1 rounded-sm bg-line" />
        {set.weight_kg ? (
          <div
            className="flex-shrink-0 rounded-[3px] bg-accent"
            style={{ width: `${plateWidthPct}%`, height: Math.min(20, 8 + set.weight_kg / 8) }}
          />
        ) : null}
        <div className="h-1 flex-1 rounded-sm bg-line" />
      </div>
      <div className="flex items-baseline gap-1 whitespace-nowrap font-mono text-[15px] font-semibold">
        <span className="text-xl text-text">{set.reps}</span>
        <span className="text-[11px] text-text-muted">reps</span>
        {set.weight_kg ? (
          <>
            <span className="text-accent-gold">{set.weight_kg}</span>
            <span className="text-[11px] text-text-muted">kg</span>
          </>
        ) : null}
      </div>
      <button className="p-1.5 text-base text-text-muted hover:text-accent-text" title="Usuń serię" onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/ExerciseGroup.jsx`:

```jsx
import SetRow from './SetRow';

export default function ExerciseGroup({ group, maxWeight, onDeleteSet }) {
  return (
    <div className="overflow-hidden rounded border border-line">
      <div className="bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
        {group.exercise_name || 'Ćwiczenie'}
      </div>
      {group.sets.map((s, idx) => (
        <SetRow key={s.id} set={s} index={idx} maxWeight={maxWeight} onDelete={() => onDeleteSet(s.id)} />
      ))}
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/PlanExerciseEntry.jsx`:

```jsx
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';

export default function PlanExerciseEntry({ planExercise, loggedCount, entry, onChange, onSubmit }) {
  return (
    <div className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-body font-medium">{planExercise.exercise_name}</span>
        <span className="text-xs text-text-muted">
          {loggedCount}
          {planExercise.target_sets ? ` / ${planExercise.target_sets}` : ''} serii
          {planExercise.target_reps ? ` · cel: ${planExercise.target_reps} powt.` : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Powtórzenia"
          type="number"
          min="1"
          inputMode="numeric"
          placeholder={planExercise.target_reps ? String(planExercise.target_reps) : ''}
          value={entry.reps}
          onChange={(e) => onChange('reps', e.target.value)}
        />
        <TextField
          label="Ciężar (kg)"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={entry.weight}
          onChange={(e) => onChange('weight', e.target.value)}
        />
      </div>
      <Button variant="primary" pulseOnClick onClick={onSubmit}>
        Dodaj serię
      </Button>
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/components/AddSetForm.jsx` (implements animation #4, shake-on-invalid, for the reps field):

```jsx
import { useMemo, useState } from 'react';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import { ExerciseForm } from '../../exercises';

export default function AddSetForm({ exercises, hasPlan, onSubmit }) {
  const [search, setSearch] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [repsInvalid, setRepsInvalid] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (ex) => ex.name.toLowerCase().includes(q) || (ex.muscle_group || '').toLowerCase().includes(q)
    );
  }, [exercises, search]);

  function handleSubmit() {
    const repsNum = parseInt(reps, 10);
    if (!repsNum || repsNum <= 0 || !selectedExerciseId) {
      setRepsInvalid(true);
      return;
    }
    setRepsInvalid(false);
    onSubmit({
      exerciseId: parseInt(selectedExerciseId, 10),
      reps: repsNum,
      weightKg: weight ? parseFloat(weight) : null,
    });
    setReps('');
    setWeight('');
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-line bg-surface p-4">
      {hasPlan && <div className="text-[13px] text-text-muted">Dodatkowe ćwiczenie spoza planu:</div>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="exercise-search" className="text-xs uppercase tracking-wider text-text-muted">
          Ćwiczenie
        </label>
        <input
          id="exercise-search"
          type="text"
          placeholder="🔍 Szukaj ćwiczenia..."
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent-gold"
        />
        <Select value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)} className="mt-2">
          <option value="" disabled>
            Wybierz ćwiczenie
          </option>
          {filtered.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name}
            </option>
          ))}
        </Select>
        <Button variant="link" className="self-start" onClick={() => setQuickAddOpen((v) => !v)}>
          + Nie ma Twojego ćwiczenia? Dodaj nowe
        </Button>
      </div>

      {quickAddOpen && (
        <div className="border-t border-line pt-3">
          <ExerciseForm
            onCreated={(exercise) => {
              setSelectedExerciseId(String(exercise.id));
              setQuickAddOpen(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextField
          id="set-reps"
          label="Powtórzenia"
          type="number"
          min="1"
          inputMode="numeric"
          invalid={repsInvalid}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <TextField
          id="set-weight"
          label="Ciężar (kg)"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <Button variant="primary" pulseOnClick onClick={handleSubmit}>
        Dodaj serię
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create the barrel**

Create `/Users/karol/Desktop/gym-app/frontend/src/features/workouts/index.js`:

```javascript
export { useWorkouts } from './api/get-workouts';
export { useWorkout } from './api/get-workout';
export { useCreateWorkout } from './api/create-workout';
export { useDeleteWorkout } from './api/delete-workout';
export { useAddSet } from './api/add-set';
export { useDeleteSet } from './api/delete-set';
export { formatWorkoutDate } from './utils/format-date';
export { default as WorkoutList } from './components/WorkoutList';
export { default as ExerciseGroup } from './components/ExerciseGroup';
export { default as AddSetForm } from './components/AddSetForm';
export { default as PlanExerciseEntry } from './components/PlanExerciseEntry';
```

- [ ] **Step 6: Create the route pages**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/workouts.jsx`:

```jsx
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import { useWorkouts, useCreateWorkout, useDeleteWorkout, WorkoutList } from '../../features/workouts';
import { useUser } from '../../lib/auth';

export default function WorkoutsRoute() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();

  async function handleCreate() {
    const workout = await createWorkout.mutateAsync();
    navigate(`/workouts/${workout.id}`);
  }

  function handleDelete(workout) {
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami?')) return;
    deleteWorkout.mutate(workout.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">Twoje treningi</h1>
      {!isLoading && (
        <p className="-mt-3.5 mb-1 text-sm text-text-muted">
          {user?.display_name ? `${user.display_name} — ` : ''}
          {workouts.length} zapisanych treningów
        </p>
      )}
      <ErrorBanner>{error?.message}</ErrorBanner>

      <div className="flex gap-2.5">
        <Button variant="primary" className="flex-1" onClick={handleCreate}>
          + Nowy trening (dziś)
        </Button>
        <Button variant="secondary" onClick={() => navigate('/plans')}>
          Z planu
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <WorkoutList workouts={workouts} onOpen={(w) => navigate(`/workouts/${w.id}`)} onDelete={handleDelete} />
      )}
    </div>
  );
}
```

Create `/Users/karol/Desktop/gym-app/frontend/src/app/routes/workout-detail.jsx`:

```jsx
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';
import {
  useWorkout,
  useDeleteWorkout,
  useAddSet,
  useDeleteSet,
  formatWorkoutDate,
  ExerciseGroup,
  AddSetForm,
  PlanExerciseEntry,
} from '../../features/workouts';
import { useExercises } from '../../features/exercises';
import { usePlan } from '../../features/plans';

export default function WorkoutDetailRoute() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(workoutId, 10);

  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: exercises = [] } = useExercises();
  const { data: plan } = usePlan(workout?.plan_id);
  const deleteWorkout = useDeleteWorkout();
  const addSet = useAddSet(id);
  const deleteSet = useDeleteSet(id);

  const [planEntries, setPlanEntries] = useState({});

  function updatePlanEntry(exerciseId, field, value) {
    setPlanEntries((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], [field]: value } }));
  }

  function entryFor(exerciseId) {
    return planEntries[exerciseId] || { reps: '', weight: '' };
  }

  async function handleAddSetFromPlan(exerciseId) {
    const entry = entryFor(exerciseId);
    const repsNum = parseInt(entry.reps, 10);
    if (!repsNum || repsNum <= 0) return;
    await addSet.mutateAsync({ exerciseId, reps: repsNum, weightKg: entry.weight ? parseFloat(entry.weight) : null });
    updatePlanEntry(exerciseId, 'reps', '');
    updatePlanEntry(exerciseId, 'weight', '');
  }

  async function handleAddSetFreeform(setInput) {
    await addSet.mutateAsync(setInput);
  }

  async function handleDeleteWorkout() {
    if (!confirm('Usunąć ten trening razem z wszystkimi seriami? Tej operacji nie można odwrócić.')) return;
    await deleteWorkout.mutateAsync(id);
    navigate('/workouts');
  }

  const groups = useMemo(() => {
    if (!workout) return [];
    const map = new Map();
    workout.sets.forEach((s) => {
      if (!map.has(s.exercise_id)) {
        map.set(s.exercise_id, { exercise_id: s.exercise_id, exercise_name: s.exercise_name, sets: [] });
      }
      map.get(s.exercise_id).sets.push(s);
    });
    return Array.from(map.values());
  }, [workout]);

  const maxWeightOverall = useMemo(() => {
    if (!workout) return 1;
    return Math.max(1, ...workout.sets.map((s) => s.weight_kg || 0));
  }, [workout]);

  if (isLoading) return <div className="px-5 py-6">Wczytywanie…</div>;
  if (error)
    return (
      <div className="px-5 py-6">
        <ErrorBanner>{error.message}</ErrorBanner>
      </div>
    );
  if (!workout) return null;

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-[100px] pt-6">
      <div className="flex items-start justify-between">
        <Button variant="link" onClick={() => navigate('/workouts')}>
          ← Wszystkie treningi
        </Button>
        <Button variant="link" className="text-[13px] underline" onClick={handleDeleteWorkout}>
          Usuń trening
        </Button>
      </div>

      <h1 className="m-0 font-display text-[28px] font-semibold tracking-wide">
        {formatWorkoutDate(workout.workout_date)}
      </h1>

      {plan && (
        <div>
          <div className="mb-2.5 rounded bg-surface-raised px-3.5 py-2.5 font-display text-[15px] uppercase tracking-wide">
            Plan: {plan.name}
          </div>
          <div className="flex flex-col gap-2.5">
            {plan.exercises.map((pe) => (
              <PlanExerciseEntry
                key={pe.id}
                planExercise={pe}
                loggedCount={workout.sets.filter((s) => s.exercise_id === pe.exercise_id).length}
                entry={entryFor(pe.exercise_id)}
                onChange={(field, value) => updatePlanEntry(pe.exercise_id, field, value)}
                onSubmit={() => handleAddSetFromPlan(pe.exercise_id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {groups.length === 0 ? (
          <div className="rounded border border-dashed border-line px-5 py-8 text-center text-sm text-text-muted">
            Brak serii. Dodaj pierwszą poniżej.
          </div>
        ) : (
          groups.map((group) => (
            <ExerciseGroup
              key={group.exercise_id}
              group={group}
              maxWeight={maxWeightOverall}
              onDeleteSet={(setId) => deleteSet.mutate(setId)}
            />
          ))
        )}
      </div>

      <AddSetForm exercises={exercises} hasPlan={!!plan} onSubmit={handleAddSetFreeform} />
    </div>
  );
}
```

- [ ] **Step 7: Verify — each new file transpiles cleanly**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
for f in src/features/workouts/api/get-workouts.js src/features/workouts/api/get-workout.js \
         src/features/workouts/api/create-workout.js src/features/workouts/api/delete-workout.js \
         src/features/workouts/api/add-set.js src/features/workouts/api/delete-set.js \
         src/features/workouts/utils/format-date.js \
         src/features/workouts/components/WorkoutCard.jsx src/features/workouts/components/WorkoutList.jsx \
         src/features/workouts/components/SetRow.jsx src/features/workouts/components/ExerciseGroup.jsx \
         src/features/workouts/components/PlanExerciseEntry.jsx src/features/workouts/components/AddSetForm.jsx \
         src/features/workouts/index.js src/app/routes/workouts.jsx src/app/routes/workout-detail.jsx; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/$f")
  echo "$f -> $code"
done
kill $DEV_PID
```

Expected: every line ends in `-> 200`.

- [ ] **Step 8: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/features/workouts frontend/src/app/routes/workouts.jsx frontend/src/app/routes/workout-detail.jsx
git commit -m "feat(frontend): add workouts feature (list + detail)"
```

---

## Task 8: Cutover — wire up routing, delete legacy files, update README, full manual verification

This is the task where the app switches from the old `App.jsx`/`src/pages` to the new `app/` structure. Everything up to this point was additive; this task is the only one that deletes the old routing and app shell.

**Files:**
- Create: `frontend/src/app/provider.jsx`, `frontend/src/app/router.jsx`, `frontend/src/app/app.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/README.md`
- Delete: `frontend/src/App.jsx`, `frontend/src/pages/` (entire directory), `frontend/src/components/ProtectedLayout.jsx`, `frontend/src/components/PublicLayout.jsx` (the old flat versions — not `components/layout/`), `frontend/src/lib/AuthContext.jsx`, `frontend/src/lib/api.js` (the old version — not `lib/api-client.js`)

**Interfaces:**
- Consumes: every route/feature/layout produced by Tasks 4-7.
- Produces: the live, routable application. Nothing downstream depends on this — it's the final assembly.

- [ ] **Step 1: Create `app/provider.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/provider.jsx`:

```jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

export default function AppProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Create `app/router.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/router.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import LoginRoute from './routes/login';
import RegisterRoute from './routes/register';
import WorkoutsRoute from './routes/workouts';
import WorkoutDetailRoute from './routes/workout-detail';
import ExercisesRoute from './routes/exercises';
import PlansRoute from './routes/plans';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/workouts" element={<WorkoutsRoute />} />
          <Route path="/workouts/:workoutId" element={<WorkoutDetailRoute />} />
          <Route path="/exercises" element={<ExercisesRoute />} />
          <Route path="/plans" element={<PlansRoute />} />
        </Route>

        <Route path="/" element={<Navigate to="/workouts" replace />} />
        <Route path="*" element={<Navigate to="/workouts" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Create `app/app.jsx`**

Create `/Users/karol/Desktop/gym-app/frontend/src/app/app.jsx`:

```jsx
import AppProvider from './provider';
import AppRouter from './router';

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
```

- [ ] **Step 4: Point `main.jsx` at the new app shell**

Replace the contents of `/Users/karol/Desktop/gym-app/frontend/src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './app/app.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Delete the legacy files**

```bash
cd /Users/karol/Desktop/gym-app/frontend
rm src/App.jsx
rm -rf src/pages
rm src/components/ProtectedLayout.jsx src/components/PublicLayout.jsx
rm src/lib/AuthContext.jsx
rm src/lib/api.js
```

- [ ] **Step 6: Update `frontend/README.md`**

In `/Users/karol/Desktop/gym-app/frontend/README.md`, remove the entire section from `**Wymaga rozszerzenia backendu**` through the end of `## Wymagane zmiany w backendzie` (the five numbered items) — the Plans backend now exists. Replace that whole block with:

```markdown
Plany treningowe są w pełni zaimplementowane, wraz z odpowiadającym im
backendem (`/plans/*`).
```

Then replace the `## Struktura projektu` section's tree with:

```markdown
## Struktura projektu

```
src/
├── app/
│   ├── app.jsx              - punkt złożenia: provider + router
│   ├── provider.jsx          - QueryClientProvider (TanStack Query)
│   ├── router.jsx             - tabela tras
│   └── routes/                 - cienkie strony, jedna na trasę
├── components/
│   ├── ui/                     - Button, TextField, Select, ErrorBanner, EmptyState, Skeleton
│   └── layout/                  - ProtectedLayout, PublicLayout
├── features/
│   ├── auth/                     - LoginForm, RegisterForm
│   ├── workouts/                  - api/, components/, utils/, index.js
│   ├── exercises/                  - api/, components/, index.js
│   └── plans/                       - api/, components/, index.js
├── lib/
│   ├── api-client.js                 - wywołania do backendu + zarządzanie tokenem
│   ├── auth.jsx                       - useUser/useLogin/useRegister/useLogout (TanStack Query)
│   └── react-query.js                  - instancja QueryClient
├── hooks/
│   └── useExitTransition.js              - collapse-on-delete dla list
├── config/
│   └── env.js                              - odczyt zmiennych środowiskowych
├── styles/
│   └── globals.css                          - Tailwind + design tokeny + keyframes
└── main.jsx
```
```

(Leave the "Uruchomienie lokalne", "Build produkcyjny", and Capacitor sections exactly as they are.)

- [ ] **Step 7: Automated smoke check — dev server boots and every route resolves**

```bash
cd /Users/karol/Desktop/gym-app/frontend
npm run dev &
DEV_PID=$!
sleep 3
curl -s -o /dev/null -w "root: %{http_code}\n" http://localhost:5173/
curl -s -o /dev/null -w "app.jsx: %{http_code}\n" http://localhost:5173/src/app/app.jsx
curl -s -o /dev/null -w "main.jsx: %{http_code}\n" http://localhost:5173/src/main.jsx
kill $DEV_PID
```

Expected: all three `200`.

- [ ] **Step 8: Manual verification in a real browser — the golden path**

Ensure the backend is running (`cd backend/app && venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000`), then `cd frontend && npm run dev`, open `http://localhost:5173`, and click through:

1. Land on `/login` (not logged in) → register a new account → redirected to `/workouts`, empty state shown.
2. Log out → log back in with the same credentials → back on `/workouts`.
3. Click "+ Nowy trening (dziś)" → lands on the new workout's detail page.
4. In "Dodatkowe ćwiczenie spoza planu": search for an exercise, select it, enter reps + weight, submit → the set appears with the barbell/plate visual, weight-proportional plate width.
5. Click "+ Nie ma Twojego ćwiczenia? Dodaj nowe", create a new exercise inline → it becomes selected in the dropdown automatically.
6. Delete the set (✕) → row collapses instead of vanishing instantly.
7. Go to `/exercises` → confirm the two exercises just created appear under "Twoje własne"; global exercises appear underneath, undeletable.
8. Go to `/plans` → create a plan with at least one exercise, target sets/reps → plan appears in the list.
9. Click "Zacznij trening" on that plan → redirected to a new workout's detail page showing the plan name and a pre-filled entry per plan exercise.
10. Log a set from one of the plan-driven entries → it appears in the sets list below.
11. Go back to `/workouts` → both workouts are listed with correct set counts.
12. Go to `/plans`, delete the plan just used (confirm dialog appears — accept it) → go back to `/workouts` and open the workout that was started from it → it still exists and no longer shows plan-driven entries (its `plan_id` was nulled server-side).
13. Delete both workouts from `/workouts` → back to the empty state.
14. Submit the reps field empty on the add-set form → field shakes instead of a browser `alert()`.

Anything that doesn't match — a blank screen, a console error, a route not rendering — means a wiring mistake in Tasks 4-8 to go back and fix before proceeding.

- [ ] **Step 9: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add frontend/src/app/provider.jsx frontend/src/app/router.jsx frontend/src/app/app.jsx frontend/src/main.jsx frontend/README.md
git rm -r frontend/src/App.jsx frontend/src/pages frontend/src/components/ProtectedLayout.jsx frontend/src/components/PublicLayout.jsx frontend/src/lib/AuthContext.jsx frontend/src/lib/api.js
git commit -m "feat(frontend): wire up new app shell, delete legacy files, update README"
```

---

## Task 9: Write root `CLAUDE.md`

Written last, after both this plan and the backend plan are fully executed, so it reflects the true end state rather than the plan.

**Files:**
- Create: `/Users/karol/Desktop/gym-app/CLAUDE.md`

**Interfaces:**
- Consumes: the final state of both plans (backend restructure + Plans feature, frontend bulletproof-react rebuild).
- Produces: nothing downstream — this is the last task in both plans.

- [ ] **Step 1: Create `CLAUDE.md`**

Create `/Users/karol/Desktop/gym-app/CLAUDE.md`:

```markdown
# CLAUDE.md

This file gives Claude Code (and any other agent) the context needed to
work in this repository without re-deriving it from scratch every time.

## What this is

A gym/workout tracking app ("Żelazo"): log workouts, sets (reps/weight),
manage a personal + global exercise library, and build reusable training
plans that pre-fill a workout when started. FastAPI + PostgreSQL backend,
React + Vite frontend.

## Running the whole project locally

### Prerequisites

- PostgreSQL running locally. If not installed: `brew install postgresql@16 && brew services start postgresql@16`.
- A `gym_tracker` database and `gym_user` role matching `backend/app/.env`'s `DATABASE_URL`. If they don't exist:
  ```bash
  psql postgres -c "CREATE ROLE gym_user WITH LOGIN PASSWORD '<matches .env>';"
  psql postgres -c "CREATE DATABASE gym_tracker OWNER gym_user;"
  ```

### Backend

```bash
cd backend/app
venv/bin/python3 -m alembic upgrade head        # apply migrations
venv/bin/python3 -m scripts.seed_exercises      # seed global exercise library (idempotent)
venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Always invoke tools via `venv/bin/python3 -m <tool>`, never `venv/bin/pip` or `venv/bin/pytest` directly** — see Gotchas below.

Copy `backend/app/.env.example` to `backend/app/.env` and fill in real values if it doesn't already exist.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # if .env doesn't already exist; default already points at localhost:8000
npm run dev
```

Open `http://localhost:5173`. The backend must be running at the URL in `VITE_API_BASE_URL` (default `http://localhost:8000`).

## Architecture

### Backend (`backend/app/`)

```
main.py            - FastAPI app creation, router registration, CORS
core/
  config.py         - Settings (env-driven)
  security.py        - password hashing, JWT create/decode
  database.py          - engine/session/Base
api/
  deps.py               - get_current_user, get_db dependency wiring
  routers/
    auth.py, exercises.py, workouts.py, plans.py
models.py                - all SQLAlchemy models (User, Exercise, Workout, SetEntry, WorkoutPlan, PlanExercise) — deliberately flat, not split per entity
schemas.py                 - all Pydantic schemas — same reasoning
scripts/seed_exercises.py     - one-time global exercise seed
tests/                          - schema-level + auth-helper unit tests only (see Gotchas)
alembic/                          - migrations
```

### Frontend (`frontend/src/`)

```
app/            - routing, providers, thin route pages (app/routes/*)
components/
  ui/            - shared primitives: Button, TextField, Select, ErrorBanner, EmptyState, Skeleton
  layout/         - ProtectedLayout, PublicLayout
features/
  auth/, workouts/, exercises/, plans/
    api/           - one file per operation, each exports a fetcher + its useQuery/useMutation hook
    components/      - feature-specific UI, composed by app/routes/*
    index.js           - the ONLY thing other code should import from this feature
lib/
  api-client.js         - fetch wrapper + token handling
  auth.jsx                - useUser/useLogin/useRegister/useLogout (TanStack Query, no Context)
  react-query.js            - QueryClient instance
hooks/useExitTransition.js  - shared collapse-on-delete hook, used by every list
config/env.js                 - reads import.meta.env
styles/globals.css               - Tailwind import + @theme design tokens + @keyframes
```

**Import boundary convention** (not tool-enforced — oxlint doesn't have this configured; it's discipline, not a lint rule): features are only imported through their `index.js` barrel, from `app/routes/*` or from other features. Never reach into `features/<x>/components/Foo.jsx` directly from outside that feature.

**Data fetching**: TanStack Query throughout. Query keys: `['workouts']` / `['workouts', id]`, `['exercises']`, `['plans']` / `['plans', id]`, `['auth', 'me']`. Mutations invalidate or directly patch the relevant key on success — check the relevant `features/<x>/api/*.js` file before assuming a mutation needs a manual refetch.

## Findings / gotchas

- **The committed `venv` at `backend/app/venv` has a broken `pip` shebang** — it was created on a different machine and has that machine's absolute path baked into its scripts. `venv/bin/pip` and `venv/bin/pytest` will fail with "bad interpreter." Always use `venv/bin/python3 -m <tool>` instead. Nobody has regenerated this venv from scratch — it'd be worth doing (`rm -rf venv && python3 -m venv venv && venv/bin/python3 -m pip install -r requirements.txt -r requirements-dev.txt`) next time it causes friction.
- **`SECRET_KEY` was rotated** (it was previously committed to git in plaintext, along with both `.env` files, before a `.gitignore` was added). The *old* key still exists in git history — it was never scrubbed, since rewriting history is disruptive and wasn't warranted here. Rotating made the old key harmless (any JWTs it signed are rejected under the new key); it just means don't assume history is clean if you ever `git log -p` near the pre-cleanup commits.
- **CORS is still `allow_origins=["*"]` combined with `allow_credentials=True`** (`backend/app/main.py`) — a combination browsers technically reject, and moot here anyway since auth uses Bearer tokens, not cookies. Identified during the original review, never fixed — low priority since it's harmless as configured, but tighten it before this ever serves a non-Bearer-token client.
- **Backend test coverage is real but narrow**: `tests/test_auth.py` and `tests/test_schemas.py` (including the Plan schemas) are genuine unit tests. There is **no integration test suite** (`TestClient` + test DB) against any router — `auth`, `exercises`, `workouts`, and `plans` are all only verified manually via `curl`. If you're adding a new endpoint, there's no existing pattern to copy for testing it end-to-end; you'd be establishing one.
- **Frontend has zero automated tests** — no Vitest, no React Testing Library. This was an explicit scope decision (see `docs/superpowers/specs/2026-07-27-app-restructure-design.md`), not an oversight. Verification is manual browser click-through.
- **CI (`.github/workflows/CI.yaml`) only runs backend `pytest`** — there's no frontend lint/build/test step in CI at all. `npm run lint` (oxlint) and `npm run build` both exist as scripts but nothing invokes them automatically.
- **Branding is inconsistent**: the UI displays "Żelazo," the frontend `README.md` and PWA manifest say "Gorilla," and `package.json`'s `name` is `gym-tracker-react`. Never reconciled — pick one intentionally before this ships anywhere public-facing.
- **The `/plans/{id}` delete behavior is load-bearing**: deleting a `WorkoutPlan` must leave existing `Workout` rows created from it intact, with `plan_id` set to `NULL` (`ondelete="SET NULL"` on the FK) — not cascade-deleted, not blocked by a FK violation. This is directly promised by the frontend's own delete-confirmation copy. If you ever touch `models.Workout.plan_id` or its migration, re-verify this specific behavior (create plan → start workout from it → delete plan → confirm the workout still loads with `plan_id: null`).
```

- [ ] **Step 2: Commit**

```bash
cd /Users/karol/Desktop/gym-app
git add CLAUDE.md
git commit -m "docs: add root CLAUDE.md with architecture, run instructions, and known gaps"
```

---

## Definition of done

- `git log --oneline` shows the sequence of commits from Tasks 1-9.
- `frontend/` exists with the bulletproof-react layout described above; `Frontend/` and `Frontend_new/` no longer exist anywhere in git.
- `npm run dev` boots cleanly and every route in Task 8 Step 8's manual checklist works as described.
- `CLAUDE.md` exists at the repo root and accurately describes the final state of both the backend and frontend plans.
- Both this plan and `2026-07-27-backend-restructure-and-plans-feature.md` are fully checked off.
