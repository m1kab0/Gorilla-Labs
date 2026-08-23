#!/usr/bin/env python3
"""
dev.py - Uruchamia backend (FastAPI) i frontend (Vite) jednocześnie.

Użycie:
    python3 dev.py              - wykrywa środowisko i wybiera sposób uruchomienia
    python3 dev.py --tmux       - wymusza tmux, nawet jeśli jest pulpit
    python3 dev.py --no-attach  - w trybie tmux nie podłącza się do sesji

Sposób uruchomienia zależy od tego, gdzie skrypt działa:
    macOS                        - dwa okna Terminal.app (osascript)
    Linux z pulpitem             - dwa okna emulatora terminala
    Linux bez pulpitu (SSH)      - jedna sesja tmux z dwoma oknami

Umieść ten plik w głównym katalogu repo (tam gdzie foldery backend/ i frontend/).

Zakładana struktura projektu (zgodna z CLAUDE.md):
    backend/app/   - venv + main.py (uruchamiane przez uvicorn)
    frontend/      - package.json (uruchamiane przez npm run dev)
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

BACKEND_DIR = REPO_ROOT / "backend" / "app"
FRONTEND_DIR = REPO_ROOT / "frontend"

BACKEND_CMD = "venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
FRONTEND_CMD = "npm run dev"

TMUX_SESSION = "gorilla-dev"

# Emulatory terminala sprawdzane po kolei; wartością jest sposób podania komendy,
# bo każdy z nich robi to inaczej.
LINUX_TERMINALS = [
    ("gnome-terminal", lambda d, c: ["gnome-terminal", f"--working-directory={d}", "--", "bash", "-lc", c]),
    ("konsole", lambda d, c: ["konsole", "--workdir", str(d), "-e", "bash", "-lc", c]),
    ("xfce4-terminal", lambda d, c: ["xfce4-terminal", f"--working-directory={d}", "-e", f"bash -lc '{c}'"]),
    ("x-terminal-emulator", lambda d, c: ["x-terminal-emulator", "-e", f"bash -lc 'cd {d} && {c}'"]),
    ("xterm", lambda d, c: ["xterm", "-e", f"bash -lc 'cd {d} && {c}'"]),
]


def fail(message: str, hint: str = "") -> None:
    """Kończy działanie z komunikatem i - jeśli jest - podpowiedzią co zrobić."""
    print(f"Błąd: {message}")
    if hint:
        print(f"       {hint}")
    sys.exit(1)


def check_prerequisites() -> None:
    """Sprawdza to, czego brak daje inaczej mało czytelne błędy w osobnym oknie.

    Bez tego uvicorn albo npm wystartują w nowym oknie/panelu, natychmiast
    padną i zamkną się razem z komunikatem, którego nikt nie zdąży przeczytać.
    """
    if not BACKEND_DIR.exists():
        fail(f"katalog {BACKEND_DIR} nie istnieje.",
             "Uruchom skrypt z głównego katalogu repo.")
    if not FRONTEND_DIR.exists():
        fail(f"katalog {FRONTEND_DIR} nie istnieje.",
             "Uruchom skrypt z głównego katalogu repo.")

    if not (BACKEND_DIR / "venv" / "bin" / "python3").exists():
        fail("brak venv w backend/app.",
             "cd backend/app && python3 -m venv venv && "
             "venv/bin/python3 -m pip install -r requirements.txt")

    if not (FRONTEND_DIR / "node_modules").exists():
        fail("brak node_modules we frontendzie.",
             "cd frontend && npm install")

    if not (BACKEND_DIR / ".env").exists():
        fail("brak backend/app/.env.",
             "cp backend/app/.env.example backend/app/.env i uzupełnij wartości.")


def has_desktop() -> bool:
    """Czy jest sesja graficzna, w której da się otworzyć okno terminala."""
    return bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))


def run_macos() -> None:
    """Otwiera dwa okna Terminal.app - po jednym na każdy serwer."""
    for directory, command, title in (
        (BACKEND_DIR, BACKEND_CMD, "BACKEND (FastAPI)"),
        (FRONTEND_DIR, FRONTEND_CMD, "FRONTEND (Vite)"),
    ):
        applescript = f'''
        tell application "Terminal"
            activate
            do script "cd '{directory}' && echo '--- {title} ---' && {command}"
        end tell
        '''
        subprocess.run(["osascript", "-e", applescript], check=True)

    print_urls("localhost")


def run_linux_desktop() -> bool:
    """Otwiera dwa okna w pierwszym znalezionym emulatorze terminala.

    Zwraca False, gdy żadnego nie ma - wtedy wołający spada na tmux.
    """
    for name, build_argv in LINUX_TERMINALS:
        if not shutil.which(name):
            continue
        subprocess.Popen(build_argv(BACKEND_DIR, BACKEND_CMD))
        subprocess.Popen(build_argv(FRONTEND_DIR, FRONTEND_CMD))
        print(f"Otwarto dwa okna w {name}.")
        print_urls("localhost")
        return True
    return False


def run_tmux(attach: bool = True) -> None:
    """Uruchamia oba serwery w jednej sesji tmux, w osobnych oknach.

    Na serwerze bez pulpitu to jedyny sensowny wariant, a przy okazji
    rozwiązuje problem zrywającego się SSH: procesy należą do sesji tmux,
    więc rozłączenie ich nie zabija.
    """
    if not shutil.which("tmux"):
        fail("brak tmux.", "sudo apt install -y tmux")

    exists = subprocess.run(
        ["tmux", "has-session", "-t", TMUX_SESSION],
        capture_output=True,
    ).returncode == 0

    if exists:
        print(f"Sesja '{TMUX_SESSION}' już działa - podłączam się do istniejącej.")
    else:
        # -d: nie podłączaj się od razu, najpierw dołóż drugie okno.
        subprocess.run(
            ["tmux", "new-session", "-d", "-s", TMUX_SESSION,
             "-n", "backend", "-c", str(BACKEND_DIR), BACKEND_CMD],
            check=True,
        )
        subprocess.run(
            ["tmux", "new-window", "-t", f"{TMUX_SESSION}:",
             "-n", "frontend", "-c", str(FRONTEND_DIR), FRONTEND_CMD],
            check=True,
        )
        print(f"Uruchomiono sesję tmux '{TMUX_SESSION}' (okna: backend, frontend).")

    print_urls("adres-serwera")
    print()
    print("W tmux: Ctrl+B potem 0/1 - przełączanie okien, Ctrl+B potem D - odłączenie.")
    print(f"Powrót do sesji:  tmux attach -t {TMUX_SESSION}")
    print(f"Zatrzymanie:      tmux kill-session -t {TMUX_SESSION}")

    if not attach:
        return

    # Podmieniamy proces na tmux, żeby po odłączeniu (Ctrl+B D) wrócić
    # prosto do powłoki, bez wiszącego pośrednika.
    if os.environ.get("TMUX"):
        # Jesteśmy już w tmux - attach by się nie udał (zagnieżdżenie).
        os.execvp("tmux", ["tmux", "switch-client", "-t", TMUX_SESSION])
    os.execvp("tmux", ["tmux", "attach-session", "-t", TMUX_SESSION])


def print_urls(host: str) -> None:
    print()
    print(f"Backend:  http://{host}:8000")
    print(f"Frontend: http://{host}:5173")


def main() -> None:
    force_tmux = "--tmux" in sys.argv
    attach = "--no-attach" not in sys.argv

    print(f"Backend:  {BACKEND_DIR}")
    print(f"Frontend: {FRONTEND_DIR}")
    print()

    check_prerequisites()

    if force_tmux:
        run_tmux(attach=attach)
        return

    if sys.platform == "darwin":
        run_macos()
        return

    if sys.platform.startswith("linux"):
        if has_desktop() and run_linux_desktop():
            return
        run_tmux(attach=attach)
        return

    fail(f"nieobsługiwany system: {sys.platform}.",
         "Uruchom oba serwery ręcznie albo użyj --tmux.")


if __name__ == "__main__":
    main()
