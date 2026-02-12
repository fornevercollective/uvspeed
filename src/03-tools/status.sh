#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Status - Complete Environment Check

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

echo -e "${PURPLE}🌌 UV-Speed Quantum Environment Status${NC}"
echo "========================================"
echo ""

# Check main launch options
echo -e "${CYAN}📋 Launch Options Available:${NC}"
echo ""

if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Electron Desktop App${NC}"
    echo "   Command: ./launch.sh OR npm start"
    echo "   Features: Native terminal, keyboard shortcuts, real-time status"
    echo ""
else
    echo -e "${YELLOW}⚠️  Electron Desktop App${NC}" 
    echo "   Missing: Node.js/npm (install with: brew install node)"
    echo ""
fi

if [ -f "launch-progressive.sh" ]; then
    echo -e "${GREEN}✅ Progressive Terminal${NC}"
    echo "   Command: ./launch-progressive.sh"
    echo "   Versions: v1-core, v2-terminal, v3-complete"
    echo ""
else
    echo -e "${RED}❌ Progressive Terminal Missing${NC}"
    echo ""
fi

if [ -f "quantum_prototype.py" ]; then
    echo -e "${GREEN}✅ Standalone Prototype${NC}"
    echo "   Command: python3 quantum_prototype.py"
    echo "   Features: Always works, no dependencies"
    echo ""
else
    echo -e "${RED}❌ Standalone Prototype Missing${NC}"
    echo ""
fi

if [ -f "launch-web-gui.sh" ]; then
    echo -e "${GREEN}✅ Web Interfaces${NC}"
    echo "   Command: ./launch-web-gui.sh"
    echo "   Includes: Quantum Claude, P2P, USDZ Viewer, Directors Lens"
    echo ""
else
    echo -e "${RED}❌ Web Interfaces Missing${NC}"
    echo ""
fi

# Check core components
echo -e "${CYAN}🔧 Core Components:${NC}"
echo ""

if [ -d "electron-app" ]; then
    echo -e "${GREEN}✅ Electron App Structure${NC}"
else
    echo -e "${RED}❌ Electron App Structure${NC}"
fi

if [ -d "web" ] && [ -f "web/quantum-claude-terminal.html" ]; then
    echo -e "${GREEN}✅ Web Interfaces${NC}"
else
    echo -e "${RED}❌ Web Interfaces${NC}"
fi

if [ -d "quantum" ] && [ -f "quantum/opencode_quantum_terminal_clean.py" ]; then
    echo -e "${GREEN}✅ Quantum Tools${NC}"
else
    echo -e "${RED}❌ Quantum Tools${NC}"
fi

if [ -d "versions" ] && [ -d "versions/v1-core" ] && [ -d "versions/v2-terminal" ] && [ -d "versions/v3-complete" ]; then
    echo -e "${GREEN}✅ Progressive Versions${NC}"
else
    echo -e "${RED}❌ Progressive Versions${NC}"
fi

if [ -d "shared" ]; then
    echo -e "${GREEN}✅ Shared Resources${NC}"
else
    echo -e "${RED}❌ Shared Resources${NC}"
fi

echo ""

# System dependencies
echo -e "${CYAN}⚙️  System Dependencies:${NC}"
echo ""

if command -v python3 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Python3 $(python3 --version | cut -d' ' -f2)${NC}"
else
    echo -e "${RED}❌ Python3 (required)${NC}"
fi

if command -v uv >/dev/null 2>&1; then
    echo -e "${GREEN}✅ UV Package Manager${NC}"
else
    echo -e "${YELLOW}⚠️  UV Package Manager (installing...)${NC}"
fi

if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js (for Electron app)${NC}"
fi

if command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}✅ NPM $(npm --version)${NC}"
else
    echo -e "${YELLOW}⚠️  NPM (for Electron dependencies)${NC}"
fi

echo ""

# Optional tools
echo -e "${CYAN}🔬 Optional Tools:${NC}"
echo ""

if command -v opencode >/dev/null 2>&1; then
    echo -e "${GREEN}✅ OpenCode AI${NC}"
else
    echo -e "${YELLOW}⚠️  OpenCode AI (npm install -g opencode-ai)${NC}"
fi

if command -v gh >/dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub CLI${NC}"
    if gh extension list | grep -q copilot; then
        echo -e "${GREEN}✅ GitHub Copilot CLI${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub Copilot CLI (gh extension install github/gh-copilot)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (brew install gh)${NC}"
fi

if command -v grepai >/dev/null 2>&1; then
    echo -e "${GREEN}✅ GrepAI Semantic Search${NC}"
else
    echo -e "${YELLOW}⚠️  GrepAI (brew install grepai)${NC}"
fi

echo ""

# Quick start recommendation
echo -e "${PURPLE}🚀 Quick Start Recommendation:${NC}"
echo ""

if command -v npm >/dev/null 2>&1 && [ -f "package.json" ]; then
    echo -e "${GREEN}Run: ./launch.sh${NC} (Electron Desktop App)"
elif [ -f "quantum_prototype.py" ]; then
    echo -e "${GREEN}Run: python3 quantum_prototype.py${NC} (Standalone Prototype)"
elif [ -f "launch-progressive.sh" ]; then
    echo -e "${GREEN}Run: ./launch-progressive.sh${NC} (Progressive Terminal)"
else
    echo -e "${RED}⚠️  Setup incomplete - check missing components above${NC}"
fi

echo ""
echo -e "${CYAN}📍 Current directory: $(pwd)${NC}"
echo -e "${CYAN}📁 Total size: $(du -sh . 2>/dev/null | cut -f1 || echo "Unknown")${NC}"