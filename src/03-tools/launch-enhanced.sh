#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Quantum - Enhanced Launcher with Browser Extension Support
# Launches Desktop App + Browser Extension + VR/XR PWA

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

echo -e "${PURPLE}🚀 UV-Speed Quantum - Enhanced Launch${NC}"
echo -e "${CYAN}Desktop + Browser + VR/XR Support${NC}"
echo "===================================="
echo ""

# Function to check and start services
launch_service() {
    local service_name=$1
    local check_cmd=$2
    local start_cmd=$3
    local description=$4
    
    echo -e "${BLUE}Checking $service_name...${NC}"
    
    if eval "$check_cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name ready${NC}"
        if [ -n "$start_cmd" ]; then
            eval "$start_cmd"
        fi
        return 0
    else
        echo -e "${YELLOW}⚠️  $service_name not available: $description${NC}"
        return 1
    fi
}

# 1. DESKTOP APPLICATION (Primary)
echo -e "${PURPLE}🖥️  Desktop Application${NC}"
if launch_service "Electron" "[ -f 'electron-app/main.js' ] && command -v npm" "npm start &" "Missing electron-app/ or npm"; then
    sleep 2
    echo -e "${GREEN}🎯 Desktop app launching...${NC}"
    DESKTOP_RUNNING=1
else
    DESKTOP_RUNNING=0
fi
echo ""

# 2. FIREFOX EXTENSION (Companion)
echo -e "${PURPLE}🦊 Firefox Extension${NC}"
if launch_service "Firefox Build" "[ -d 'build/firefox' ]" "" "Run ./build-firefox.sh first"; then
    if command -v firefox >/dev/null 2>&1; then
        echo -e "${CYAN}Opening Firefox extension manager...${NC}"
        firefox --new-tab "about:debugging#/runtime/this-firefox" >/dev/null 2>&1 &
        sleep 1
        echo -e "${YELLOW}📋 Load this file: $(pwd)/build/firefox/manifest.json${NC}"
    else
        echo -e "${YELLOW}⚠️  Firefox not installed${NC}"
    fi
else
    echo -e "${YELLOW}💡 Build Firefox extension: ./build-firefox.sh${NC}"
fi
echo ""

# 3. VR/XR PWA SERVER (Meta Quest Ready)
echo -e "${PURPLE}🥽 VR/XR PWA Server${NC}"
if launch_service "PWA Build" "[ -d 'build/pwa' ]" "" "Run ./build-multi-platform.sh first"; then
    if command -v python3 >/dev/null 2>&1; then
        echo -e "${CYAN}Starting PWA server for Meta Quest...${NC}"
        cd build/pwa
        python3 -m http.server 8080 --bind 0.0.0.0 >/dev/null 2>&1 &
        PWA_PID=$!
        cd - >/dev/null
        sleep 1
        echo -e "${GREEN}🌐 PWA running: http://localhost:8080${NC}"
        echo -e "${CYAN}📱 Meta Quest: Use Firefox browser on Android${NC}"
        VR_RUNNING=1
    else
        echo -e "${YELLOW}⚠️  Python3 not available for PWA server${NC}"
        VR_RUNNING=0
    fi
else
    echo -e "${YELLOW}💡 Build PWA: ./build-multi-platform.sh${NC}"
    VR_RUNNING=0
fi
echo ""

# 4. QUANTUM TOOLS (Always Available)
echo -e "${PURPLE}🌌 Quantum Tools${NC}"
if [ -f "quantum_prototype.py" ]; then
    echo -e "${GREEN}✅ Quantum prototype ready${NC}"
    echo -e "${CYAN}🔧 Standalone quantum terminal: ./quantum_prototype.py${NC}"
else
    echo -e "${RED}❌ Quantum prototype missing${NC}"
fi
echo ""

# 5. PROGRESSIVE TERMINALS (Fallback)
echo -e "${PURPLE}📊 Progressive Terminals${NC}"
if [ -f "launch-progressive.sh" ]; then
    echo -e "${GREEN}✅ Progressive terminals available${NC}"
    echo -e "${CYAN}🔧 Quick access: ./launch-progressive.sh v2 quantum${NC}"
else
    echo -e "${YELLOW}⚠️  Progressive terminals not found${NC}"
fi
echo ""

# LAUNCH SUMMARY
echo -e "${PURPLE}📋 Launch Summary${NC}"
echo "=================="

ACTIVE_PLATFORMS=0

if [ "$DESKTOP_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}🖥️  Desktop App: Running (Primary interface)${NC}"
    ACTIVE_PLATFORMS=$((ACTIVE_PLATFORMS + 1))
fi

if [ -d "build/firefox" ]; then
    echo -e "${BLUE}🦊 Firefox Extension: Ready (Load manifest.json)${NC}" 
    ACTIVE_PLATFORMS=$((ACTIVE_PLATFORMS + 1))
fi

if [ "$VR_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}🥽 VR/XR PWA: Running on port 8080${NC}"
    ACTIVE_PLATFORMS=$((ACTIVE_PLATFORMS + 1))
fi

echo -e "${CYAN}🌌 Quantum Tools: Always available${NC}"
ACTIVE_PLATFORMS=$((ACTIVE_PLATFORMS + 1))

echo ""
echo -e "${GREEN}🎯 Active Platforms: $ACTIVE_PLATFORMS${NC}"
echo ""

# QUICK ACCESS COMMANDS
echo -e "${PURPLE}⚡ Quick Commands${NC}"
echo "=================="
echo -e "${YELLOW}Desktop:${NC}    npm start"
echo -e "${YELLOW}Firefox:${NC}    ./build-firefox.sh && open Firefox" 
echo -e "${YELLOW}VR/XR:${NC}      ./build-multi-platform.sh"
echo -e "${YELLOW}Quantum:${NC}    ./quantum_prototype.py"
echo -e "${YELLOW}Progressive:${NC} ./launch-progressive.sh v2"
echo -e "${YELLOW}All-in-One:${NC}  ./launch-any-platform.sh"
echo ""

# ENHANCED FEATURES NOTICE
echo -e "${CYAN}🌟 Enhanced Capabilities${NC}"
echo "========================"
echo -e "✅ Electron desktop app with native menus"
echo -e "✅ Firefox extension for web-based development"  
echo -e "✅ PWA ready for Meta Quest VR/XR/AR"
echo -e "✅ Real-time WebSocket sync between platforms"
echo -e "✅ Quantum navigation with 3D coordinates"
echo -e "✅ AI integration across all interfaces"
echo -e "✅ Progressive complexity (v1-v3)"
echo -e "✅ UV package manager ultra-fast execution"
echo ""

# KEEP SERVICES RUNNING
if [ "$DESKTOP_RUNNING" -eq 1 ] || [ "$VR_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}🔄 Services running in background...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Trap Ctrl+C to cleanup
    trap 'echo -e "\n${RED}🛑 Stopping services...${NC}"; if [ -n "$PWA_PID" ]; then kill $PWA_PID 2>/dev/null; fi; exit 0' INT
    
    # Wait for services
    wait
else
    echo -e "${YELLOW}💡 Launch individual platforms as needed${NC}"
fi