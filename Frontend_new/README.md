# Żelazo — frontend (React + Vite + PWA)

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

**Wymaga rozszerzenia backendu** — patrz sekcja niżej.

## Wymagane zmiany w backendzie (dla planów treningowych)

Ta wersja frontendu korzysta z endpointów `/plans/*`, których backend jeszcze
może nie mieć. Jeśli `GET /plans/` w Swaggerze (`/docs`) nie istnieje, trzeba
dodać:

1. W `models.py`: pole `plan_id` w klasie `Workout` (`ForeignKey("workout_plans.id")`,
   `nullable=True`) oraz nowe klasy `WorkoutPlan` i `PlanExercise`.
2. W `schemas.py`: pole `plan_id` w `WorkoutCreate`/`WorkoutOut` oraz nowe
   schematy `PlanExerciseCreate`, `PlanExerciseOut`, `WorkoutPlanCreate`,
   `WorkoutPlanOut`.
3. Nowy plik `routers/plans.py` z endpointami CRUD dla planów + `POST /plans/{id}/start`.
4. W `main.py`: `from routers import auth, exercises, workouts, plans` i
   `app.include_router(plans.router)`.
5. Migracja: `alembic revision --autogenerate -m "add workout plans"` i
   `alembic upgrade head`.

Pełny kod tych zmian został przekazany osobno w rozmowie z Claude.

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
- App name: `Żelazo`
- App Package ID: np. `pl.twojanazwa.zelazo` (format odwróconej domeny)

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
├── lib/
│   ├── api.js              - wywołania do backendu + zarządzanie tokenem
│   └── AuthContext.jsx      - stan zalogowanego użytkownika (React Context)
├── components/
│   ├── ProtectedLayout.jsx  - layout dla stron wymagających logowania
│   └── PublicLayout.jsx     - layout dla logowania/rejestracji
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Workouts.jsx         - lista treningów
│   ├── WorkoutDetail.jsx    - szczegóły treningu, dodawanie serii
│   └── Exercises.jsx        - zarządzanie własnymi ćwiczeniami
├── styles.css               - design tokens (te same co w poprzedniej wersji)
├── App.jsx                  - routing
└── main.jsx                 - punkt wejścia
```
