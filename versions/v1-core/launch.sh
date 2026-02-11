#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed v1-core - Basic UV + Quantum Numbering
# Minimal quantum development environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UVSPEED_ROOT="$(dirname "$SCRIPT_DIR")"
export UVSPEED_VERSION="v1-core"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🌌 UV-Speed v1-core${NC}"
echo -e "${BLUE}Basic UV + Quantum Numbering${NC}"
echo "=============================="

# Check for UV
if ! command -v uv >/dev/null 2>&1; then
    echo "Installing UV package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Load shared tools
if [ -f "$UVSPEED_ROOT/shared/config/quantum.env" ]; then
    source "$UVSPEED_ROOT/shared/config/quantum.env"
fi

# Core quantum aliases
alias v='uv run'
alias va='uv add'
alias vs='uv sync'
alias qconvert='python3 quantum_handler_core.py'

echo -e "${GREEN}✅ v1-core ready${NC}"
echo ""
echo "Core commands:"
echo "  v <cmd>     - uv run (fast execution)"
echo "  qconvert    - Convert code to quantum numbering"
echo ""
echo "Example: qconvert my_script.py"
echo ""

# Start shell
exec "${SHELL:-bash}"