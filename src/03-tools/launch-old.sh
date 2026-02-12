#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Quantum - Primary Launcher (Enhanced with Browser + VR/XR support)
# Auto-detects and launches best available platform

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Quick detection and launch for enhanced uvspeed
if [ -f "launch-enhanced.sh" ]; then
    ./launch-enhanced.sh
else
    # Fallback to original launcher
    echo "🚀 UV-Speed Quantum - Quick Launch"
    echo "=================================="
    
    # Try platforms in priority order
    if [ -f "electron-app/main.js" ] && command -v npm >/dev/null 2>&1; then
        echo "🖥️  Starting Desktop App..."
        npm start
    elif [ -f "quantum_prototype.py" ]; then
        echo "🌌 Starting Quantum Prototype..."
        python3 quantum_prototype.py
    elif [ -f "launch-progressive.sh" ]; then
        echo "📊 Starting Progressive Terminal..."
        ./launch-progressive.sh v2 quantum
    else
        echo "❌ No compatible launcher found"
        exit 1
    fi
fi