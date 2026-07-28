import { env } from '../config/env';

const TOKEN_KEY = 'gorilla_token';
const LEGACY_TOKEN_KEY = 'zelazo_token';

// Przenieś token ze starego klucza, żeby zmiana nazwy nie wylogowała nikogo.
// Do usunięcia, gdy sesje sprzed rebrandingu wygasną.
const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
if (legacyToken) {
  if (!localStorage.getItem(TOKEN_KEY)) localStorage.setItem(TOKEN_KEY, legacyToken);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

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
