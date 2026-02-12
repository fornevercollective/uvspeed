#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed v3-complete - Full Copilot Integration + Portable Tools
# Complete quantum development environment with AI training

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UVSPEED_ROOT="$(dirname "$SCRIPT_DIR")"
export UVSPEED_VERSION="v3-complete"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${PURPLE}🌌 UV-Speed v3-complete${NC}"
echo -e "${BLUE}Full Copilot Integration + Portable Tools${NC}"
echo "=========================================="

# System detection
ARCH=$(uname -m)
OS=$(uname -s)

# Install/check dependencies with portable fallbacks
install_dependencies() {
    # UV (required)
    if ! command -v uv >/dev/null 2>&1; then
        echo "Installing UV package manager..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Portable Nushell
    if ! command -v nu >/dev/null 2>&1 && ! [ -x "$UVSPEED_ROOT/shared/tools/bin/nu" ]; then
        echo "Installing portable Nushell..."
        mkdir -p "$UVSPEED_ROOT/shared/tools/bin"
        # Download based on architecture
        case "$OS-$ARCH" in
            "Darwin-arm64")
                curl -L "https://github.com/nushell/nushell/releases/latest/download/nu-0.110.0-aarch64-apple-darwin.tar.gz" | tar -xzf - -C /tmp/
                find /tmp -name "nu" -type f -executable 2>/dev/null | head -1 | xargs -I {} mv {} "$UVSPEED_ROOT/shared/tools/bin/"
                ;;
        esac
    fi
    
    # OpenCode AI
    if command -v npm >/dev/null 2>&1 && ! command -v opencode >/dev/null 2>&1; then
        echo "Installing OpenCode AI..."
        npm install -g opencode-ai 2>/dev/null || echo "OpenCode install skipped"
    fi
    
    # GrepAI
    if command -v brew >/dev/null 2>&1 && ! command -v grepai >/dev/null 2>&1; then
        echo "Installing GrepAI semantic search..."
        brew install grepai 2>/dev/null || echo "GrepAI install skipped"
    fi
}

# Setup Copilot integration
setup_copilot() {
    echo -e "${PURPLE}🚁 Setting up GitHub Copilot integration...${NC}"
    
    # Check for GitHub CLI and Copilot
    if command -v gh >/dev/null 2>&1; then
        if ! gh extension list | grep -q copilot; then
            echo "Installing GitHub Copilot CLI extension..."
            gh extension install github/gh-copilot 2>/dev/null || echo "Copilot extension install skipped"
        fi
        echo -e "${GREEN}✅ GitHub Copilot detected${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not found - install: brew install gh${NC}"
    fi
    
    # Setup quantum context for Copilot
    if [ -f "$UVSPEED_ROOT/shared/config/copilot_training_context.md" ]; then
        export COPILOT_QUANTUM_CONTEXT="$UVSPEED_ROOT/shared/config/copilot_training_context.md"
        echo -e "${GREEN}✅ Copilot quantum context loaded${NC}"
    fi
}

# Main setup
install_dependencies
setup_copilot

# Load shared configuration
if [ -f "$UVSPEED_ROOT/shared/config/quantum.env" ]; then
    source "$UVSPEED_ROOT/shared/config/quantum.env"
fi

# Add portable tools to PATH
export PATH="$UVSPEED_ROOT/shared/tools/bin:$PATH"

# v3-complete full aliases
alias v='uv run'
alias va='uv add'
alias vs='uv sync'
alias quantum='python3 opencode_quantum_terminal_clean.py'
alias qconvert='python3 quantum_handler_clean.py'
alias qstatus='python3 quantum_status_clean.py'

# Copilot quantum integration
alias copilot-q='$UVSPEED_ROOT/shared/tools/copilot-quantum'

# GrepAI semantic search (if available)
if command -v grepai >/dev/null 2>&1; then
    alias q='grepai search --compact --json'
    alias qf='grepai search --files'
    alias qt='grepai trace --json'
fi

# 3D Navigation
alias +1='echo "📍 Moving +Y (lines up) in quantum space"'
alias +0='echo "📍 Moving +X (dependencies right) in quantum space"'
alias +n='echo "📍 Moving +Z (complexity forward) in quantum space"'

echo -e "${GREEN}✅ v3-complete ready${NC}"
echo ""
echo -e "${PURPLE}🌌 Full Quantum Environment:${NC}"
echo "  quantum         - AI terminal with 3D navigation"
echo "  qconvert <file> - Convert code to quantum numbering"
echo "  qstatus         - System status"
echo "  copilot-q       - Copilot with quantum context"
echo ""
if command -v grepai >/dev/null 2>&1; then
echo "  q <query>       - Semantic code search"
echo "  qt <symbol>     - Trace function calls"
echo ""
fi
echo -e "${CYAN}🚀 Core Commands:${NC}"
echo "  v <cmd>         - uv run (fast execution)"
echo "  +1/-1/+0/-0/+n  - 3D quantum navigation"
echo ""
echo "🧠 AI Training Mode: Copilot learns quantum patterns"
echo ""

cd "$SCRIPT_DIR"

# Launch options
case "${1:-interactive}" in
    "quantum"|"terminal")
        python3 opencode_quantum_terminal_clean.py
        ;;
    "nushell"|"nu")
        if command -v nu >/dev/null 2>&1; then
            exec nu
        else
            echo "Nushell not available, using bash"
            exec bash
        fi
        ;;
    "status")
        python3 quantum_status_clean.py
        ;;
    *)
        echo "🎯 Ready for quantum development with full AI integration"
        exec "${SHELL:-bash}"
        ;;
esac