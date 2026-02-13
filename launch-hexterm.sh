#!/bin/bash
# uvspeed — quick dev build + launch
# Usage: ./launch-hexterm.sh [--release]

set -e
cd "$(dirname "$0")"

echo "⚛ uvspeed v4.0 — building..."

# Sync web → tauri-dist
echo "  Syncing web assets..."
mkdir -p tauri-dist
cp -r web/* tauri-dist/

if [[ "$1" == "--release" ]]; then
    echo "  Building release..."
    env -u CI cargo tauri build --bundles app 2>&1 | tail -5
    open src-tauri/target/release/bundle/macos/uvspeed.app
else
    echo "  Building debug..."
    cd src-tauri
    cargo build 2>&1 | tail -5
    cd ..

    # Run the binary directly (faster than cargo tauri dev for iteration)
    echo "  Launching uvspeed..."
    src-tauri/target/debug/uvspeed &
    echo "  PID: $!"
    echo "  uvspeed running. Press Ctrl+C to stop."
    wait
fi
