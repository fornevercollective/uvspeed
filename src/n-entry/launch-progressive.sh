#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Universal Launcher - Progressive Quantum Development
# Choose your complexity level: v1-core, v2-terminal, v3-complete

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

echo -e "${PURPLE}🌌 UV-Speed Universal Launcher${NC}"
echo -e "${CYAN}Progressive Quantum Development${NC}"
echo "================================="
echo ""

# Check if version specified
if [ "$1" = "v1" ] || [ "$1" = "v1-core" ]; then
    echo -e "${GREEN}🟢 Launching v1-core (Basic UV + Quantum numbering)${NC}"
    exec ./versions/v1-core/launch.sh "${@:2}"
elif [ "$1" = "v2" ] || [ "$1" = "v2-terminal" ]; then
    echo -e "${BLUE}🔵 Launching v2-terminal (OpenCode AI + 3D navigation)${NC}"
    exec ./versions/v2-terminal/launch.sh "${@:2}"
elif [ "$1" = "v3" ] || [ "$1" = "v3-complete" ]; then
    echo -e "${PURPLE}🟣 Launching v3-complete (Full Copilot + portable tools)${NC}"
    exec ./versions/v3-complete/launch.sh "${@:2}"
elif [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo -e "${CYAN}Available versions:${NC}"
    echo ""
    echo -e "${GREEN}  v1-core${NC}     - Basic UV package manager + quantum numbering"
    echo -e "${BLUE}  v2-terminal${NC} - Add OpenCode AI integration + 3D navigation"
    echo -e "${PURPLE}  v3-complete${NC} - Full GitHub Copilot + portable tools"
    echo ""
    echo -e "${CYAN}Usage:${NC}"
    echo "  ./launch.sh v1           # Launch v1-core"
    echo "  ./launch.sh v2 quantum   # Launch v2-terminal directly to quantum"
    echo "  ./launch.sh v3 status    # Launch v3-complete and show status"
    echo "  ./launch.sh              # Interactive version selection"
    echo ""
    exit 0
elif [ -n "$1" ]; then
    echo -e "${RED}❌ Unknown version: $1${NC}"
    echo "Use './launch.sh help' for available versions"
    exit 1
fi

# Interactive version selection
echo -e "${CYAN}Choose your quantum development level:${NC}"
echo ""
echo -e "${GREEN}1)${NC} v1-core     - Basic (UV + quantum numbering)"
echo -e "${BLUE}2)${NC} v2-terminal - Standard (+ OpenCode AI)"  
echo -e "${PURPLE}3)${NC} v3-complete - Full (+ Copilot integration)"
echo ""
printf "Select version [1-3]: "
read -r choice

case "$choice" in
    "1"|"v1"|"core")
        echo -e "${GREEN}🟢 Launching v1-core...${NC}"
        exec ./versions/v1-core/launch.sh
        ;;
    "2"|"v2"|"terminal")
        echo -e "${BLUE}🔵 Launching v2-terminal...${NC}"
        exec ./versions/v2-terminal/launch.sh
        ;;
    "3"|"v3"|"complete")
        echo -e "${PURPLE}🟣 Launching v3-complete...${NC}"
        exec ./versions/v3-complete/launch.sh
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Defaulting to v2-terminal${NC}"
        exec ./versions/v2-terminal/launch.sh
        ;;
esac