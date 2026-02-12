#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Quantum - Force Refresh Electron Cache
# Clears Electron cache and restarts with fresh CSS

cd "$(dirname "$0")"

echo "🔧 Clearing Electron cache and restarting..."

# Kill any running electron processes
echo "Stopping existing Electron processes..."
ps aux | grep "electron.*uvspeed" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true

# Clear Electron cache directories
echo "Clearing Electron caches..."
rm -rf ~/.config/uvspeed-quantum-terminal 2>/dev/null || true
rm -rf ~/Library/Application\ Support/uvspeed-quantum-terminal 2>/dev/null || true

# Wait a moment
sleep 2

# Start fresh
echo "🚀 Starting fresh Electron instance..."
npm start

echo "✅ Electron restarted with cleared cache"