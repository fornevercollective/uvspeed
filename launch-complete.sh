#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Complete Terminal Suite - All Dev Apps, Chat, and Viewers
# Integrated launcher for all quantum development tools

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

echo -e "${PURPLE}🌌 UV-Speed Complete Terminal Suite${NC}"
echo -e "${CYAN}All Dev Apps, Chat Interface, and Viewers${NC}"
echo "=============================================="
echo ""

show_menu() {
    echo -e "${CYAN}Choose your quantum development environment:${NC}"
    echo ""
    echo -e "${PURPLE}🌌 DEVELOPMENT TERMINALS:${NC}"
    echo -e "${GREEN}1)${NC} Quantum Prototype      - Standalone modifiable terminal"
    echo -e "${BLUE}2)${NC} AI Terminal (v2)       - OpenCode AI + 3D navigation"
    echo -e "${PURPLE}3)${NC} Full Suite (v3)        - Complete Copilot integration"
    echo ""
    echo -e "${CYAN}🎯 3D VISUALIZATION:${NC}"
    echo -e "${GREEN}4)${NC} Code Space Viewer      - 3D orbital code visualization"
    echo -e "${BLUE}5)${NC} Binary Data Flow       - Hex visualization in 3D space"
    echo ""
    echo -e "${YELLOW}🧠 AI CHAT INTERFACES:${NC}"
    echo -e "${GREEN}6)${NC} OpenCode Chat          - AI pair programming chat"
    echo -e "${BLUE}7)${NC} Copilot Integration    - GitHub Copilot with quantum context"
    echo ""
    echo -e "${RED}⚙️ UTILITIES:${NC}"
    echo -e "${GREEN}8)${NC} Quantum Converter      - Batch file conversion"
    echo -e "${BLUE}9)${NC} System Status          - Check all quantum tools"
    echo -e "${YELLOW}0)${NC} Progressive Launcher   - Original version selector"
    echo ""
    printf "Select option [0-9]: "
}

launch_quantum_prototype() {
    echo -e "${GREEN}🚀 Launching Quantum Prototype Terminal...${NC}"
    python3 quantum_prototype.py
}

launch_ai_terminal() {
    echo -e "${BLUE}🤖 Launching AI Terminal (v2-terminal)...${NC}"
    ./versions/v2-terminal/launch.sh quantum
}

launch_full_suite() {
    echo -e "${PURPLE}🌌 Launching Full Suite (v3-complete)...${NC}"
    ./versions/v3-complete/launch.sh
}

launch_code_viewer() {
    echo -e "${GREEN}🌌 Launching 3D Code Space Viewer...${NC}"
    echo "Commands: scan [path], gravity, cam <wasd>, binary <hex>, quit"
    echo ""
    cd quantum && python3 quantum_code_space.py
}

launch_binary_viewer() {
    echo -e "${BLUE}🔍 Launching Binary Data Flow Viewer...${NC}"
    echo "Loading binary quantum visualization..."
    cd quantum && python3 mini_binary_quantum.py
}

launch_opencode_chat() {
    echo -e "${GREEN}💬 Launching OpenCode AI Chat...${NC}"
    echo "Connecting to OpenCode AI services..."
    cd quantum && python3 opencode_quantum_terminal_clean.py
}

launch_copilot_integration() {
    echo -e "${BLUE}🧠 Launching Copilot Quantum Integration...${NC}"
    if command -v gh >/dev/null 2>&1; then
        if [ -f "shared/config/copilot_training_context.md" ]; then
            echo "Loading quantum context for Copilot..."
            export COPILOT_QUANTUM_CONTEXT="$(pwd)/shared/config/copilot_training_context.md"
            echo "Type: gh copilot chat"
            echo "Try: 'explain quantum +1 movement in code space'"
            bash
        else
            echo "⚠️  Copilot context file not found"
        fi
    else
        echo "⚠️  GitHub CLI not found - install with: brew install gh"
    fi
}

launch_converter() {
    echo -e "${GREEN}🔄 Launching Quantum File Converter...${NC}"
    echo "Convert any code file to quantum numbering format"
    echo ""
    printf "Enter file path (or 'quit'): "
    read -r file_path
    if [ "$file_path" != "quit" ] && [ -f "$file_path" ]; then
        cd quantum && python3 quantum_handler_clean.py "$file_path"
    else
        echo "File not found or quit requested"
    fi
}

show_system_status() {
    echo -e "${BLUE}🔧 System Status Check...${NC}"
    echo ""
    cd quantum && python3 quantum_status_clean.py
}

launch_progressive() {
    echo -e "${YELLOW}📋 Launching Progressive Version Selector...${NC}"
    ./launch-progressive.sh
}

# Main menu loop
while true; do
    show_menu
    read -r choice
    echo ""
    
    case "$choice" in
        "1")
            launch_quantum_prototype
            ;;
        "2")
            launch_ai_terminal
            ;;
        "3")
            launch_full_suite
            ;;
        "4")
            launch_code_viewer
            ;;
        "5")
            launch_binary_viewer
            ;;
        "6")
            launch_opencode_chat
            ;;
        "7")
            launch_copilot_integration
            ;;
        "8")
            launch_converter
            ;;
        "9")
            show_system_status
            ;;
        "0")
            launch_progressive
            ;;
        "quit"|"exit"|"q")
            echo -e "${CYAN}👋 Quantum development suite closing...${NC}"
            break
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please select 0-9${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}Press Enter to return to menu...${NC}"
    read -r
    clear
done