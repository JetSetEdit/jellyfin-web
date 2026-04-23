#!/usr/bin/env bash
# Deploy jellyfin-web to the Pi Jellyfin server.
# Usage:
#   npm run deploy:pi            — build production then deploy
#   npm run deploy:pi:fast       — deploy existing dist/ without rebuilding
#   bash scripts/deploy-pi.sh [--no-build]

set -euo pipefail

PI_SSH="jetsetedit@raspberrypi.tail5c03c3.ts.net"
PI_WEB="/usr/share/jellyfin/web"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=20)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
DIST="$(cd "$SCRIPT_DIR/.." && pwd)/dist"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
err()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; }

# Build unless skipped
if [[ "${1:-}" != "--no-build" ]]; then
    bold "→ Building jellyfin-web (production)…"
    cd "$SCRIPT_DIR/.."
    npm run build:production
    ok "Build complete → dist/"
fi

if [[ ! -d "$DIST" ]]; then
    err "dist/ not found — run without --no-build or check the build output."
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M)
BACKUP="${PI_WEB}.backup-$TIMESTAMP"

bold "→ Backing up current web dir on Pi…"
ssh "${SSH_OPTS[@]}" "$PI_SSH" "sudo cp -a '$PI_WEB' '$BACKUP'"
ok "Backed up → $BACKUP"

# Keep only the 2 most recent backups to avoid filling the Pi
ssh "${SSH_OPTS[@]}" "$PI_SSH" \
    "sudo bash -c \"ls -dt /usr/share/jellyfin/web.backup-* 2>/dev/null | tail -n +3 | xargs -r rm -rf\""

bold "→ Syncing dist/ to Pi…"
rsync -azP --delete \
    --rsync-path="sudo rsync" \
    -e "ssh ${SSH_OPTS[*]}" \
    "$DIST/" \
    "$PI_SSH:$PI_WEB/"

ok "Deployed to $PI_SSH:$PI_WEB"
bold "  All browser clients update on next page load."
