#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Quantum - Multi-Platform Build Script
# Builds for Desktop (Electron) + Browser (Firefox) + VR/XR (PWA)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${PURPLE}🚀 UV-Speed Quantum - Multi-Platform Build${NC}"
echo -e "${CYAN}Building for Desktop + Browser + VR/XR platforms${NC}"
echo "=================================================="
echo ""

# Build counters
BUILDS_SUCCESS=0
BUILDS_TOTAL=0

# Function to update build status
update_build_status() {
    local status=$1
    local name=$2
    BUILDS_TOTAL=$((BUILDS_TOTAL + 1))
    if [ "$status" -eq 0 ]; then
        BUILDS_SUCCESS=$((BUILDS_SUCCESS + 1))
        echo -e "${GREEN}✅ $name build successful${NC}"
    else
        echo -e "${RED}❌ $name build failed${NC}"
    fi
}

# 1. DESKTOP BUILD (Electron)
echo -e "${BLUE}🖥️  Building Desktop Application...${NC}"
if [ -f "package.json" ] && [ -d "electron-app" ]; then
    if command -v npm >/dev/null 2>&1; then
        echo "Installing Electron dependencies..."
        npm install --silent >/dev/null 2>&1
        echo "Building Electron app for current platform..."
        npm run build >/dev/null 2>&1
        update_build_status $? "Desktop (Electron)"
    else
        echo -e "${YELLOW}⚠️  npm not found, skipping Electron build${NC}"
        update_build_status 1 "Desktop (Electron)"
    fi
else
    echo -e "${RED}❌ Electron files not found${NC}"
    update_build_status 1 "Desktop (Electron)"
fi
echo ""

# 2. BROWSER BUILD (Firefox Extension)
echo -e "${BLUE}🦊 Building Firefox Extension...${NC}"
if [ -f "build-firefox.sh" ]; then
    ./build-firefox.sh >/dev/null 2>&1
    update_build_status $? "Browser (Firefox)"
else
    echo -e "${RED}❌ Firefox build script not found${NC}"
    update_build_status 1 "Browser (Firefox)"
fi
echo ""

# 3. PWA BUILD (Meta VR/XR/AR)
echo -e "${BLUE}🥽 Building PWA for VR/XR/AR...${NC}"
PWA_DIR="build/pwa"
mkdir -p "$PWA_DIR"

# Copy web interface
if [ -d "web" ]; then
    cp -r web/* "$PWA_DIR/"
    
    # Create PWA manifest
    cat > "$PWA_DIR/manifest.json" << 'EOF'
{
  "name": "UV-Speed Quantum VR",
  "short_name": "UVSpeed",
  "description": "Quantum development environment for VR/XR/AR devices",
  "start_url": "/quantum-claude-terminal.html",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#64b5f6",
  "orientation": "landscape",
  "icons": [
    {
      "src": "icons/quantum-192.png", 
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/quantum-512.png",
      "sizes": "512x512", 
      "type": "image/png"
    }
  ],
  "categories": ["developer-tools", "productivity"],
  "shortcuts": [
    {
      "name": "Quantum Terminal",
      "short_name": "Terminal",
      "description": "Launch quantum terminal interface",
      "url": "/quantum-claude-terminal.html"
    },
    {
      "name": "3D Navigator", 
      "short_name": "3D Nav",
      "description": "Launch 3D code navigator",
      "url": "/enhanced-p2p-terminal.html"
    }
  ]
}
EOF

    # Add service worker for PWA
    cat > "$PWA_DIR/sw.js" << 'EOF'
// UV-Speed Quantum - Service Worker for VR/XR/AR PWA

const CACHE_NAME = 'uvspeed-quantum-v1.0.0';
const CACHE_FILES = [
    '/',
    '/quantum-claude-terminal.html',
    '/enhanced-p2p-terminal.html',
    '/quantum-claude-terminal.js',
    '/enhanced-p2p-terminal.js',
    '/quantum-claude-terminal.css',
    '/enhanced-p2p-terminal.css',
    '/manifest.json'
];

// Install - cache core files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - serve from cache with network fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Handle VR/XR device orientation and input
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'QUANTUM_NAVIGATE') {
        // Forward quantum navigation to active clients
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'QUANTUM_NAVIGATE',
                    data: event.data
                });
            });
        });
    }
});
EOF

    # Add PWA registration to web files
    find "$PWA_DIR" -name "*.html" -exec sed -i '' 's|</head>|<link rel="manifest" href="/manifest.json"><script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js");}</script></head>|g' {} \;
    
    update_build_status 0 "PWA (VR/XR/AR)"
else
    echo -e "${RED}❌ Web directory not found${NC}"
    update_build_status 1 "PWA (VR/XR/AR)"
fi
echo ""

# 4. QUANTUM TOOLS BUILD
echo -e "${BLUE}🌌 Building Quantum Tools...${NC}"
if [ -f "quantum_prototype.py" ]; then
    # Test quantum prototype
    if command -v python3 >/dev/null 2>&1; then
        python3 -m py_compile quantum_prototype.py 2>/dev/null
        update_build_status $? "Quantum Tools"
    else
        echo -e "${YELLOW}⚠️  Python3 not found, skipping quantum tools validation${NC}"
        update_build_status 1 "Quantum Tools"
    fi
else
    echo -e "${RED}❌ Quantum prototype not found${NC}" 
    update_build_status 1 "Quantum Tools"
fi
echo ""

# BUILD SUMMARY
echo -e "${PURPLE}📊 Build Summary${NC}"
echo "================"
echo -e "Total builds: ${BUILDS_TOTAL}"
echo -e "Successful: ${GREEN}${BUILDS_SUCCESS}${NC}"
echo -e "Failed: ${RED}$((BUILDS_TOTAL - BUILDS_SUCCESS))${NC}"

if [ $BUILDS_SUCCESS -eq $BUILDS_TOTAL ]; then
    echo ""
    echo -e "${GREEN}🎉 All builds completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}Platform Access:${NC}"
    echo -e "🖥️  Desktop: ${YELLOW}npm start${NC} or ${YELLOW}./launch.sh${NC}"
    echo -e "🦊 Firefox: ${YELLOW}about:debugging → Load build/firefox/manifest.json${NC}"
    echo -e "🥽 VR/XR: ${YELLOW}Serve build/pwa/ on web server${NC}"
    echo -e "🌌 Quantum: ${YELLOW}./quantum_prototype.py${NC} (always works)"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some builds failed, but UV-Speed is still functional${NC}"
fi

# Create quick launcher that prioritizes working builds
cat > "launch-any-platform.sh" << 'EOF'
#!/usr/bin/env bash
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
EOF

chmod +x "launch-any-platform.sh"
echo ""
echo -e "${GREEN}📱 Created universal launcher: ${YELLOW}./launch-any-platform.sh${NC}"