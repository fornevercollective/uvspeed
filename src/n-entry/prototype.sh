#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Quantum Prototype Launcher
# Standalone development environment for modification

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${PURPLE}🌌 UV-Speed Quantum Prototype${NC}"
echo -e "${CYAN}Standalone Development Environment${NC}"
echo "===================================="
echo ""

# Check Python
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Python3 not found - please install Python${NC}"
    exit 1
fi

# Check UV (optional but recommended)
if ! command -v uv >/dev/null 2>&1; then
    echo -e "${YELLOW}💡 UV not installed - installing for faster execution...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    echo -e "${GREEN}✅ UV installed${NC}"
fi

# Set up environment
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"

echo -e "${GREEN}🚀 Launching Quantum Prototype Terminal...${NC}"
echo ""

# Launch prototype
if command -v uv >/dev/null 2>&1; then
    uv run python3 quantum_prototype.py "$@"
else
    python3 quantum_prototype.py "$@"
fi

echo ""
echo -e "${CYAN}🌌 Quantum prototype session ended${NC}"