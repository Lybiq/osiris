#!/bin/sh
# ═══════════════════════════════════════════════════════
# OSINT Update Script
# Pulls upstream changes, applies OSINT patch, rebuilds.
# Run from the repo root: ./scripts/update.sh
# ═══════════════════════════════════════════════════════
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

echo "═══════════════════════════════════════"
echo "  OSINT — Update from upstream"
echo "═══════════════════════════════════════"

# Ensure upstream remote exists
if ! git remote | grep -q upstream; then
  echo "[UPDATE] Adding upstream remote..."
  git remote add upstream https://github.com/simplifaisoul/osiris.git
fi

echo "[UPDATE] Fetching upstream..."
git fetch upstream

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse upstream/master)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[UPDATE] Already up to date."
  exit 0
fi

echo "[UPDATE] New commits available. Merging..."
git merge upstream/master --no-edit -X theirs

echo "[UPDATE] Applying OSINT patch..."
sh "$REPO/scripts/patch-osint.sh" "$REPO"

echo "[UPDATE] Committing patch..."
git add -A
git diff --cached --quiet || git commit -m "auto: OSINT rename patch after upstream merge"

echo "[UPDATE] Rebuilding container..."
docker compose build --no-cache osiris

echo "[UPDATE] Restarting..."
docker compose up -d osiris

echo "═══════════════════════════════════════"
echo "  Update complete!"
echo "═══════════════════════════════════════"
