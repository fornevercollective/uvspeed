#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed - Platform Detection Launcher

cd "$(dirname "$0")"

# Try platforms in order of preference
if [ -f "electron-app/main.js" ] && command -v npm >/dev/null 2>&1; then
    echo "🖥️  Launching Desktop App..."
    npm start
elif [ -d "build/firefox" ] && command -v firefox >/dev/null 2>&1; then
    echo "🦊 Opening Firefox Extension..."
    firefox --new-tab "about:debugging#/runtime/this-firefox" &
    echo "Load: build/firefox/manifest.json"
elif [ -d "build/pwa" ] && command -v python3 >/dev/null 2>&1; then
    echo "🥽 Starting VR/XR PWA Server..."
    cd build/pwa
    python3 -m http.server 8080 --bind 0.0.0.0 &
    echo "Access: http://localhost:8080"
elif [ -f "quantum_prototype.py" ]; then
    echo "🌌 Launching Quantum Prototype..."
    python3 quantum_prototype.py
else
    echo "❌ No compatible platform found"
    exit 1
fi
