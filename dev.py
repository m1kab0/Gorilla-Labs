#!/usr/bin/env python3
"""
dev.py - Uruchamia backend (FastAPI) i frontend (Vite) jednocześnie,
każdy w osobnym oknie Terminal.app (macOS).

Użycie:
    python3 dev.py

Umieść ten plik w głównym katalogu repo (tam gdzie foldery backend/ i frontend/).

Zakładana struktura projektu (zgodna z CLAUDE.md):
    backend/app/   - venv + main.py (uruchamiane przez uvicorn)
    frontend/      - package.json (uruchamiane przez npm run dev)
"""

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

BACKEND_DIR = REPO_ROOT / "backend" / "app"
FRONTEND_DIR = REPO_ROOT / "frontend"

BACKEND_CMD = "venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
FRONTEND_CMD = "npm run dev"


def open_terminal_window(directory: Path, command: str, title: str) -> None:
    """Otwiera nowe okno Terminal.app, przechodzi do katalogu i odpala komendę."""
    if not directory.exists():
        print(f"Błąd: katalog {directory} nie istnieje.")
        sys.exit(1)

    # Podwójne apostrofy w ścieżce mogłyby zepsuć AppleScript - dla typowych
    # ścieżek projektowych nie powinno to być problemem.
    applescript = f'''
    tell application "Terminal"
        activate
        do script "cd '{directory}' && echo '--- {title} ---' && {command}"
    end tell
    '''
    subprocess.run(["osascript", "-e", applescript], check=True)


def main() -> None:
    if sys.platform != "darwin":
        print("Ten skrypt działa tylko na macOS (korzysta z Terminal.app przez osascript).")
        print("Wersję pod Ubuntu Server (tmux) dorobimy osobno.")
        sys.exit(1)

    print(f"Backend:  {BACKEND_DIR}")
    print(f"Frontend: {FRONTEND_DIR}")
    print()

    print("Uruchamiam backend...")
    open_terminal_window(BACKEND_DIR, BACKEND_CMD, "BACKEND (FastAPI)")

    print("Uruchamiam frontend...")
    open_terminal_window(FRONTEND_DIR, FRONTEND_CMD, "FRONTEND (Vite)")

    print()
    print("skończone front i back .")
    print("Backend:  http://localhost:8000")
    print("Frontend: http://localhost:5173")


if __name__ == "__main__":
    main()
