#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Dev file watcher — auto-copy web/ → tauri-dist/ during development
set -euo pipefail

info() { printf "\033[36m→ %s\033[0m\n" "$*"; }
ok()   { printf "\033[32m✓ %s\033[0m\n" "$*"; }

WATCH_DIR="web"
DEST_DIR="tauri-dist"

mkdir -p "$DEST_DIR"

# Initial sync
info "Initial sync: $WATCH_DIR → $DEST_DIR"
cp -r "$WATCH_DIR"/* "$DEST_DIR/"
ok "Synced $(ls "$WATCH_DIR"/*.html | wc -l | tr -d ' ') apps + assets"

# Check for fswatch (macOS) or inotifywait (Linux)
if command -v fswatch >/dev/null 2>&1; then
    info "Watching $WATCH_DIR/ with fswatch..."
    info "Press Ctrl+C to stop"
    echo ""

    fswatch -o "$WATCH_DIR" | while read -r _; do
        cp -r "$WATCH_DIR"/* "$DEST_DIR/" 2>/dev/null
        ok "$(date +%H:%M:%S) synced"
    done

elif command -v inotifywait >/dev/null 2>&1; then
    info "Watching $WATCH_DIR/ with inotifywait..."
    info "Press Ctrl+C to stop"
    echo ""

    while inotifywait -r -e modify,create,delete "$WATCH_DIR" 2>/dev/null; do
        cp -r "$WATCH_DIR"/* "$DEST_DIR/"
        ok "$(date +%H:%M:%S) synced"
    done

else
    info "No file watcher found. Polling every 2 seconds..."
    info "Install fswatch: brew install fswatch"
    info "Press Ctrl+C to stop"
    echo ""

    while true; do
        # Simple poll — copy if any file is newer than dest
        CHANGED=false
        for f in "$WATCH_DIR"/*; do
            dest="$DEST_DIR/$(basename "$f")"
            if [ "$f" -nt "$dest" ] 2>/dev/null; then
                CHANGED=true
                break
            fi
        done

        if [ "$CHANGED" = true ]; then
            cp -r "$WATCH_DIR"/* "$DEST_DIR/"
            ok "$(date +%H:%M:%S) synced"
        fi

        sleep 2
    done
fi
