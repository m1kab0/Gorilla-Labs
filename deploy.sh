#!/usr/bin/env bash
#
# deploy.sh - wdraża najnowszy stan origin/main, jeśli się zmienił.
#
# Uruchamiany cyklicznie przez gorilla-deploy.timer (patrz deploy/README.md).
# Gdy nic się nie zmieniło, kończy się natychmiast i nic nie dotyka - dzięki
# temu można go wołać co minutę bez obciążania maszyny.
#
# Ręczne wdrożenie:  ./deploy.sh
# Wymuszenie:        ./deploy.sh --force

set -euo pipefail

cd "$(dirname "$0")"

BRANCH="main"
FORCE="${1:-}"

git fetch --quiet origin "$BRANCH"

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ] && [ "$FORCE" != "--force" ]; then
    exit 0
fi

echo "Nowy kod: ${LOCAL:0:7} -> ${REMOTE:0:7}"

# reset --hard, a nie pull: maszyna jest celem wdrożenia, nie miejscem pracy,
# więc lokalne rozjechanie się z origin/main jest błędem, a nie zmianą do
# zachowania. backend/app/.env jest w .gitignore, więc reset go nie rusza.
git reset --hard "origin/$BRANCH"

# Kolejność ma znaczenie: najpierw build, żeby migracje poleciały już NOWYM
# obrazem. Odwrotnie migracja z nowego commita nie byłaby jeszcze w obrazie.
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d

# Stare warstwy obrazów potrafią zapchać 8 GB dysku po kilkunastu wdrożeniach.
docker image prune -f >/dev/null

echo "Wdrożono ${REMOTE:0:7}"
