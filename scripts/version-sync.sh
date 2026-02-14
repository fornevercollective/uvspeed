#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Version sync — ensure all version strings match across the project
set -euo pipefail

info() { printf "\033[36m→ %s\033[0m\n" "$*"; }
ok()   { printf "\033[32m✓ %s\033[0m\n" "$*"; }
warn() { printf "\033[33m⚠ %s\033[0m\n" "$*"; }
err()  { printf "\033[31m✗ %s\033[0m\n" "$*"; }

# ── Read current versions ──
PY_VER=$(grep 'version = ' pyproject.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
TAURI_VER=$(grep 'version = ' src-tauri/Cargo.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
ENGINE_VER=$(grep 'version = ' crates/prefix-engine/Cargo.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
CLI_VER=$(grep "^VERSION = " uvspeed_cli.py | sed "s/.*'\(.*\)'.*/\1/")
README_VER=$(grep -o 'v[0-9]\+\.[0-9]\+' README.md | head -1 | sed 's/v//')

echo "⚛ Version Sync Check"
echo ""
echo "  pyproject.toml:              $PY_VER"
echo "  src-tauri/Cargo.toml:        $TAURI_VER"
echo "  crates/prefix-engine:        $ENGINE_VER"
echo "  uvspeed_cli.py:              $CLI_VER"
echo "  README.md badge:             $README_VER"
echo ""

# ── Check or set ──
if [ "${1:-}" = "set" ] && [ -n "${2:-}" ]; then
    NEW_VER="$2"
    info "Setting all versions to $NEW_VER..."

    # pyproject.toml
    sed -i '' "s/^version = \".*\"/version = \"$NEW_VER\"/" pyproject.toml
    ok "pyproject.toml"

    # src-tauri/Cargo.toml
    sed -i '' "s/^version = \".*\"/version = \"$NEW_VER\"/" src-tauri/Cargo.toml
    ok "src-tauri/Cargo.toml"

    # crates/prefix-engine/Cargo.toml
    sed -i '' "s/^version = \".*\"/version = \"$NEW_VER\"/" crates/prefix-engine/Cargo.toml
    ok "crates/prefix-engine/Cargo.toml"

    # uvspeed_cli.py
    sed -i '' "s/^VERSION = '.*'/VERSION = '$NEW_VER'/" uvspeed_cli.py
    ok "uvspeed_cli.py"

    # README.md badge
    MAJOR_MINOR=$(echo "$NEW_VER" | sed 's/\.[0-9]*$//')
    sed -i '' "s/v[0-9]*\.[0-9]*-uvspeed/v${MAJOR_MINOR}-uvspeed/" README.md
    ok "README.md"

    echo ""
    ok "All versions set to $NEW_VER"
else
    # Just check consistency
    VERSIONS=("$PY_VER" "$TAURI_VER" "$ENGINE_VER" "$CLI_VER")
    UNIQUE=$(printf '%s\n' "${VERSIONS[@]}" | sort -u | wc -l | tr -d ' ')

    if [ "$UNIQUE" -eq 1 ]; then
        ok "All code versions match: $PY_VER"
    else
        warn "Versions are NOT consistent"
        echo "  Run: bash scripts/version-sync.sh set <version>"
    fi
fi
