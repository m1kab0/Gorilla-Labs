# Gorilla — frontend (React + Vite + PWA)

Przepisana wersja frontendu na React, zachowująca identyczny wygląd i funkcje
poprzedniej wersji (vanilla JS): logowanie, treningi, serie z wizualizacją
talerzy, wyszukiwanie i dodawanie własnych ćwiczeń, usuwanie treningów.

**Nowość względem poprzedniej wersji:** token logowania jest teraz w
`localStorage` — sesja przetrwa odświeżenie strony (wcześniej trzeba było
logować się od nowa).

Plany treningowe są już zaimplementowane — zakładka "Plany" pozwala ułożyć
listę ćwiczeń z docelową liczbą serii/powtórzeń, a "Zacznij trening" tworzy
nowy trening z gotowymi polami do wypełnienia (tylko reps/kg) dla każdego
ćwiczenia z planu, bez ręcznego ich wyszukiwania.

Plany treningowe są w pełni zaimplementowane, wraz z odpowiadającym im
backendem (`/plans/*`).

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env
```

W `.env` ustaw adres swojego backendu:
```
VITE_API_BASE_URL=http://localhost:8000
```

Uruchom:
```bash
npm run dev
```

Wejdź na `http://localhost:5173`. Backend (FastAPI) musi działać równolegle
na porcie 8000, tak jak wcześniej.

## Build produkcyjny

```bash
npm run build
```
Wynik trafia do folderu `dist/` — statyczne pliki gotowe do wdrożenia na
dowolny serwer (nginx itd.), z wbudowanym PWA (można zainstalować z Safari
"Dodaj do ekranu głównego").

## Wdrożenie na iOS przez Capacitor

To pozwala spakować tę samą appkę React jako prawdziwą appkę iOS (WKWebView +
dostęp do natywnych API), bez pisania kodu drugi raz.

### 1. Zainstaluj Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```
Podczas `cap init` podaj:
- App name: `Gorilla`
- App Package ID: np. `pl.twojanazwa.gorilla` (format odwróconej domeny)

### 2. Dodaj platformę iOS
```bash
npm install @capacitor/ios
npx cap add ios
```

### 3. Zbuduj appkę i zsynchronizuj z projektem iOS
```bash
npm run build
npx cap sync ios
```

### 4. Otwórz w Xcode
```bash
npx cap open ios
```
To wymaga zainstalowanego **Xcode** (z App Store, tylko na macOS).

### 5. Uruchom na swoim iPhonie
W Xcode: podłącz iPhone kablem, wybierz go jako urządzenie docelowe (u góry
okna), kliknij ▶️ Run. Przy darmowym Apple ID appka wygaśnie po 7 dniach —
trzeba wtedy powtórzyć ten krok. Płatne konto Apple Developer ($99/rok)
usuwa ten limit.

**Ważne:** za każdym razem, gdy zmienisz kod React, musisz powtórzyć kroki
3-4 (`npm run build` → `npx cap sync ios`), żeby zmiany trafiły do appki iOS.

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
