#!/bin/sh
# ═══════════════════════════════════════════════════════
# OSINT Auto-Patch: Renames all visible "OSIRIS" → "OSINT"
# in source files, preserving OSIRIS_ env variable names.
# Safe to run multiple times (idempotent).
# ═══════════════════════════════════════════════════════
REPO="${1:-/repo}"

echo "[OSINT-PATCH] Patching source files in $REPO/src ..."

find "$REPO/src" \( -name '*.tsx' -o -name '*.ts' \) -exec \
  sed -i \
    -e 's/OSIRIS\([^_]\)/OSINT\1/g' \
    -e 's/OSIRIS$/OSINT/g' \
  {} +

# Also patch layout metadata (title, description)
if [ -f "$REPO/src/app/layout.tsx" ]; then
  sed -i 's/OSIRIS\([^_]\)/OSINT\1/g; s/OSIRIS$/OSINT/g' "$REPO/src/app/layout.tsx"
fi

# Patch middleware analytics tag
if [ -f "$REPO/src/middleware.ts" ]; then
  sed -i 's/OSIRIS\([^_]\)/OSINT\1/g; s/OSIRIS$/OSINT/g' "$REPO/src/middleware.ts"
fi

COUNT=$(grep -rl 'OSIRIS' "$REPO/src" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'OSIRIS_' | wc -l)
echo "[OSINT-PATCH] Done. Remaining files with OSIRIS (excl env vars): $COUNT"
