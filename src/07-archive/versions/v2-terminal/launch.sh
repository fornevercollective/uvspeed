#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed v2-terminal - OpenCode AI + 3D Navigation
# Full quantum terminal with AI integration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UVSPEED_ROOT="$(dirname "$SCRIPT_DIR")"
export UVSPEED_VERSION="v2-terminal"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}🌌 UV-Speed v2-terminal${NC}"
echo -e "${BLUE}OpenCode AI + 3D Navigation${NC}"
echo "================================="

# Check dependencies
if ! command -v uv >/dev/null 2>&1; then
    echo "Installing UV package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Check Node.js for OpenCode
if ! command -v npm >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Node.js not found - AI will use fallback mode${NC}"
else
    # Install OpenCode if missing
    if ! command -v opencode >/dev/null 2>&1; then
        echo "Installing OpenCode AI..."
        npm install -g opencode-ai 2>/dev/null || echo "OpenCode install skipped"
    fi
fi

# Load quantum environment
if [ -f "$UVSPEED_ROOT/shared/config/quantum.env" ]; then
    source "$UVSPEED_ROOT/shared/config/quantum.env"
fi

# v2-terminal specific aliases
alias v='uv run'
alias va='uv add'
alias vs='uv sync'
alias quantum='python3 opencode_quantum_terminal_clean.py'
alias qconvert='python3 quantum_handler_clean.py'

# Navigation helpers
alias +1='echo "📍 Moving +Y (lines up)"'
alias +0='echo "📍 Moving +X (dependencies right)"'
alias +n='echo "📍 Moving +Z (complexity forward)"'

echo -e "${GREEN}✅ v2-terminal ready${NC}"
echo ""
echo "🌌 Quantum Commands:"
echo "  quantum         - Launch AI terminal with 3D navigation"
echo "  qconvert <file> - Convert code to quantum numbering"
echo "  +1/-1/+0/-0     - 3D navigation helpers"
echo ""
echo "🚀 Core Commands:"
echo "  v <cmd>         - uv run (fast execution)"
echo ""
echo "Try: quantum"
echo ""

cd "$SCRIPT_DIR"

# Start shell or launch quantum terminal directly
case "${1:-shell}" in
    "quantum"|"terminal")
        python3 opencode_quantum_terminal_clean.py
        ;;
    *)
        exec "${SHELL:-bash}"
        ;;
esac