#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Quantum Fox - Firefox Build & Package Script
# Builds the extension for Firefox compatibility

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

echo -e "${PURPLE}🚀 UV-Speed Quantum - Firefox Build${NC}"
echo -e "${CYAN}Building Mozilla Firefox compatible extension with VR/XR/AR support${NC}"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found${NC}"
    echo "Please run this script from the quantum-fox directory"
    exit 1
fi

# Create build directory
BUILD_DIR="build/firefox"
mkdir -p "$BUILD_DIR"

echo -e "${BLUE}📦 Preparing Firefox extension build...${NC}"

# Copy core files
echo "Copying manifest and core files..."
cp manifest.json "$BUILD_DIR/"
cp -r popup "$BUILD_DIR/"
cp -r background "$BUILD_DIR/"
cp -r content "$BUILD_DIR/"
cp -r web "$BUILD_DIR/"

# Create icons directory with placeholder icons
mkdir -p "$BUILD_DIR/icons"
echo "Creating placeholder icons..."

# Create simple SVG icons for different sizes
create_icon() {
    local size=$1
    local file="$BUILD_DIR/icons/quantum-${size}.png"
    
    # Create simple PNG using ImageMagick if available, otherwise create placeholder
    if command -v convert >/dev/null 2>&1; then
        convert -size ${size}x${size} xc:none \
               -fill '#64b5f6' \
               -draw "circle $((size/2)),$((size/2)) $((size/2-2)),$((size/2-2))" \
               -fill '#ffffff' \
               -pointsize $((size/3)) \
               -gravity center \
               -annotate +0+0 "🌌" \
               "$file" 2>/dev/null || {
            # Fallback: copy a simple file or create placeholder
            echo "Icon placeholder ${size}x${size}" > "${file}.txt"
        }
    else
        echo "Icon placeholder ${size}x${size}" > "${file}.txt"
    fi
}

create_icon 16
create_icon 32  
create_icon 48
create_icon 128

# Create options page
mkdir -p "$BUILD_DIR/options"
echo "Creating options page..."
cat > "$BUILD_DIR/options/quantum-options.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantum Fox Options</title>
    <style>
        body {
            font-family: -moz-dialog, sans-serif;
            margin: 20px;
            background: #f9f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(12, 12, 13, 0.1);
        }
        h1 {
            color: #0c0c0d;
            border-bottom: 1px solid #d7d7db;
            padding-bottom: 10px;
        }
        .option-group {
            margin: 20px 0;
        }
        label {
            display: block;
            margin: 10px 0 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #d7d7db;
            border-radius: 4px;
            font-size: 14px;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .checkbox-group input {
            width: auto;
            margin-right: 10px;
        }
        .save-btn {
            background: #0060df;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .save-btn:hover {
            background: #003eaa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌌 Quantum Fox Options</h1>
        
        <div class="option-group">
            <label for="default-version">Default Quantum Version:</label>
            <select id="default-version">
                <option value="v1">v1-core (Basic)</option>
                <option value="v2" selected>v2-terminal (AI)</option>
                <option value="v3">v3-complete (Full)</option>
            </select>
        </div>
        
        <div class="option-group">
            <label for="quantum-path">Quantum Fox Installation Path:</label>
            <input type="text" id="quantum-path" value="/Users/tref/quantum-fox" placeholder="Path to quantum-fox directory">
        </div>
        
        <div class="option-group">
            <div class="checkbox-group">
                <input type="checkbox" id="auto-overlay" checked>
                <label for="auto-overlay">Automatically show quantum overlay on pages</label>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="keyboard-shortcuts" checked>
                <label for="keyboard-shortcuts">Enable keyboard shortcuts (Ctrl+Shift+Arrow Keys)</label>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="code-analysis" checked>
                <label for="code-analysis">Auto-analyze selected code</label>
            </div>
        </div>
        
        <div class="option-group">
            <label for="ai-service">Preferred AI Service:</label>
            <select id="ai-service">
                <option value="opencode">OpenCode (Default)</option>
                <option value="copilot">GitHub Copilot</option>
                <option value="fallback">Quantum Fallback Only</option>
            </select>
        </div>
        
        <button class="save-btn" id="save-options">Save Options</button>
    </div>
    
    <script>
        // Load saved options
        document.addEventListener('DOMContentLoaded', async () => {
            const options = await browser.storage.local.get({
                defaultVersion: 'v2',
                quantumPath: '/Users/tref/quantum-fox',
                autoOverlay: true,
                keyboardShortcuts: true,
                codeAnalysis: true,
                aiService: 'opencode'
            });
            
            document.getElementById('default-version').value = options.defaultVersion;
            document.getElementById('quantum-path').value = options.quantumPath;
            document.getElementById('auto-overlay').checked = options.autoOverlay;
            document.getElementById('keyboard-shortcuts').checked = options.keyboardShortcuts;
            document.getElementById('code-analysis').checked = options.codeAnalysis;
            document.getElementById('ai-service').value = options.aiService;
        });
        
        // Save options
        document.getElementById('save-options').addEventListener('click', async () => {
            const options = {
                defaultVersion: document.getElementById('default-version').value,
                quantumPath: document.getElementById('quantum-path').value,
                autoOverlay: document.getElementById('auto-overlay').checked,
                keyboardShortcuts: document.getElementById('keyboard-shortcuts').checked,
                codeAnalysis: document.getElementById('code-analysis').checked,
                aiService: document.getElementById('ai-service').value
            };
            
            await browser.storage.local.set(options);
            
            // Show save confirmation
            const btn = document.getElementById('save-options');
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.background = '#00aa00';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#0060df';
            }, 2000);
        });
    </script>
</body>
</html>
EOF

# Create devtools page
mkdir -p "$BUILD_DIR/devtools"
echo "Creating devtools page..."
cat > "$BUILD_DIR/devtools/quantum-devtools.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quantum Fox DevTools</title>
</head>
<body>
    <script>
        // Register quantum development panel
        browser.devtools.panels.create(
            "Quantum Fox",
            "../icons/quantum-48.png",
            "quantum-panel.html"
        );
    </script>
</body>
</html>
EOF

# Update manifest for Firefox compatibility
echo "Updating manifest for Firefox compatibility..."
cat > "$BUILD_DIR/manifest.json" << 'EOF'
{
  "manifest_version": 2,
  "name": "Quantum Fox - AI Development Environment",
  "version": "1.0.0",
  "description": "Progressive quantum development environment with AI integration and 3D code navigation",
  
  "icons": {
    "16": "icons/quantum-16.png",
    "32": "icons/quantum-32.png",
    "48": "icons/quantum-48.png",
    "128": "icons/quantum-128.png"
  },
  
  "browser_action": {
    "default_popup": "popup/quantum-popup.html",
    "default_title": "Quantum Fox Development",
    "default_icon": {
      "16": "icons/quantum-16.png",
      "32": "icons/quantum-32.png",
      "48": "icons/quantum-48.png",
      "128": "icons/quantum-128.png"
    }
  },
  
  "background": {
    "scripts": ["background/quantum-service-worker.js"],
    "persistent": false
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/quantum-inject.js"],
      "css": ["content/quantum-overlay.css"],
      "run_at": "document_idle"
    }
  ],
  
  "web_accessible_resources": [
    "web/*",
    "quantum/*", 
    "shared/*"
  ],
  
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "contextMenus",
    "notifications",
    "http://localhost/*",
    "https://api.openai.com/*",
    "https://api.anthropic.com/*"
  ],
  
  "options_ui": {
    "page": "options/quantum-options.html",
    "open_in_tab": true
  },
  
  "devtools_page": "devtools/quantum-devtools.html",
  
  "applications": {
    "gecko": {
      "id": "quantum-fox@quantumdev.org",
      "strict_min_version": "57.0"
    }
  }
}
EOF

# Update background script for Firefox compatibility
echo "Updating background script for Firefox..."
sed -i.bak 's/chrome\./browser\./g' "$BUILD_DIR/background/quantum-service-worker.js" 2>/dev/null || true

# Update content script for Firefox compatibility  
echo "Updating content script for Firefox..."
sed -i.bak 's/chrome\.runtime/browser\.runtime/g' "$BUILD_DIR/content/quantum-inject.js" 2>/dev/null || true

# Update popup script for Firefox
echo "Updating popup script for Firefox..."
sed -i.bak 's/chrome\./browser\./g' "$BUILD_DIR/popup/quantum-popup.js" 2>/dev/null || true

# Create package
echo -e "${CYAN}📦 Creating Firefox extension package...${NC}"
cd "$BUILD_DIR"
zip -r "../quantum-fox-firefox.zip" . -x "*.bak" "*.txt"
cd - >/dev/null

echo ""
echo -e "${GREEN}✅ Firefox extension built successfully!${NC}"
echo ""
echo -e "${CYAN}📁 Files created:${NC}"
echo "  build/firefox/           - Extension directory"  
echo "  build/quantum-fox-firefox.zip - Installable package"
echo ""
echo -e "${BLUE}🦊 To install in Firefox:${NC}"
echo "  1. Open Firefox and go to about:debugging"
echo "  2. Click 'This Firefox'"
echo "  3. Click 'Load Temporary Add-on'"
echo "  4. Select build/firefox/manifest.json"
echo ""
echo -e "${PURPLE}🌌 Or install the packaged extension:${NC}"
echo "  1. Go to about:addons"
echo "  2. Click the gear icon"
echo "  3. Choose 'Install Add-on From File'"
echo "  4. Select build/quantum-fox-firefox.zip"
echo ""
echo -e "${YELLOW}📝 Extension Features:${NC}"
echo "  • 🌌 Quantum overlay on any webpage"
echo "  • 🔍 Code analysis and quantum navigation" 
echo "  • 💬 Direct access to quantum terminals"
echo "  • ⚙️ Configurable options page"
echo "  • 🚀 One-click quantum environment launch"