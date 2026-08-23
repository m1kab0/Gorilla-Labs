# Automatyczne wdrożenia (CD)

Maszyna sama sprawdza co minutę, czy na `origin/main` pojawił się nowy commit,
i jeśli tak — przebudowuje obrazy, uruchamia migracje i restartuje kontenery.

Nie wymaga żadnych kluczy po stronie GitHuba ani otwartych portów przychodzących,
bo to serwer odpytuje GitHuba, a nie odwrotnie.

## Instalacja (raz, na maszynie)

Zakłada, że repo jest w `/home/ubuntu/gym-app`. Jeśli jest gdzie indziej,
popraw `WorkingDirectory` i `ExecStart` w `gorilla-deploy.service`.

```bash
sudo cp deploy/gorilla-deploy.service deploy/gorilla-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gorilla-deploy.timer
```

## Sprawdzenie, że działa

Kiedy zegar odpali się następnym razem:

```bash
systemctl list-timers gorilla-deploy.timer
```

Log ostatnich wdrożeń:

```bash
journalctl -u gorilla-deploy.service -n 50
```

Podgląd na żywo (przydatne zaraz po pushu):

```bash
journalctl -u gorilla-deploy.service -f
```

## Ręczne sterowanie

Wdrożenie natychmiast, bez czekania na zegar:

```bash
sudo systemctl start gorilla-deploy.service
```

Przebudowa mimo braku nowych commitów (np. po zmianie `.env`):

```bash
./deploy.sh --force
```

Wyłączenie automatu:

```bash
sudo systemctl disable --now gorilla-deploy.timer
```

## Uwagi

- `deploy.sh` robi `git reset --hard origin/main`, więc **nie edytuj plików repo
  bezpośrednio na serwerze** — zmiany zostaną nadpisane przy najbliższym
  wdrożeniu. `backend/app/.env` jest w `.gitignore` i reset go nie rusza.
- Migracje lecą **po** przebudowaniu obrazu, żeby wykonał je już nowy kod.
- Po każdym wdrożeniu leci `docker image prune -f` — bez tego stare warstwy
  zapychają domyślny dysk 8 GB po kilkunastu wdrożeniach.
