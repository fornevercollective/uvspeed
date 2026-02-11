#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed Launch Script - All-in-One Quantum Development

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

echo -e "${PURPLE}🌌 UV-Speed Quantum Development Environment${NC}"
echo -e "${CYAN}Progressive quantum development with AI integration${NC}"
echo "=================================================="
echo ""

# Check Node.js for Electron
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js detected${NC}"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Electron dependencies...${NC}"
        npm install
    fi
    
    echo -e "${BLUE}🖥️  Launching Electron Desktop App...${NC}"
    echo ""
    echo -e "${CYAN}Desktop Features:${NC}"
    echo "  • 🌌 Native quantum terminal interface"
    echo "  • ⌨️  Keyboard shortcuts (Cmd+Arrow keys)"
    echo "  • 📊 Real-time system status"
    echo "  • 🤖 Integrated AI services"
    echo ""
    
    npm start
    
else
    echo -e "${YELLOW}⚠️  Node.js not found - launching progressive terminal${NC}"
    echo ""
    echo -e "${CYAN}Alternative launch options:${NC}"
    echo "  ./launch-progressive.sh     # Progressive terminal"
    echo "  python3 quantum_prototype.py # Standalone prototype"
    echo "  ./launch-web-gui.sh         # Web interfaces"
    echo ""
    
    # Fallback to progressive terminal
    ./launch-progressive.sh
fi
echo "======================================"
echo ""

# Auto-detect system architecture
detect_system() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    case "$os" in
        "Darwin") OS_TYPE="macos" ;;
        "Linux") OS_TYPE="linux" ;;
        "FreeBSD"|"OpenBSD"|"NetBSD") OS_TYPE="bsd" ;;
        *) OS_TYPE="unknown" ;;
    esac
    
    case "$arch" in
        "arm64"|"aarch64") ARCH_TYPE="arm64" ;;
        "x86_64"|"amd64") ARCH_TYPE="x64" ;;
        *) ARCH_TYPE="unknown" ;;
    esac
    
    echo -e "${BLUE}🖥️  System: ${GREEN}$OS_TYPE-$ARCH_TYPE${NC}"
}

# Install core dependencies
install_dependencies() {
    echo -e "${YELLOW}🔧 Checking dependencies...${NC}"
    
    # Create tools directory
    mkdir -p "$UVSPEED_HOME/tools/bin"
    export PATH="$UVSPEED_HOME/tools/bin:$PATH"
    
    # Install UV (Python package manager)
    if ! command -v uv >/dev/null 2>&1 && ! [ -x "$UVSPEED_HOME/tools/bin/uv" ]; then
        echo -e "${CYAN}⚡ Installing UV package manager...${NC}"
        curl -LsSf https://astral.sh/uv/install.sh | sh
        # Copy to portable location
        if [ -f "$HOME/.local/bin/uv" ]; then
            cp "$HOME/.local/bin/uv" "$UVSPEED_HOME/tools/bin/"
        fi
    fi
    
    # Install Nushell (portable)
    if ! command -v nu >/dev/null 2>&1 && ! [ -x "$UVSPEED_HOME/tools/bin/nu" ]; then
        echo -e "${CYAN}🐚 Installing Nushell...${NC}"
        install_nushell_portable
    fi
    
    # Check for Node.js/npm (for OpenCode)
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Node.js not found - OpenCode AI will use fallback mode${NC}"
        echo -e "${BLUE}💡 Install Node.js for full AI capabilities${NC}"
    else
        echo -e "${GREEN}✅ Node.js detected${NC}"
        install_opencode
    fi
    
    # Install GrepAI if available
    if command -v brew >/dev/null 2>&1 && ! command -v grepai >/dev/null 2>&1; then
        echo -e "${CYAN}🔍 Installing GrepAI semantic search...${NC}"
        brew install grepai 2>/dev/null || echo -e "${YELLOW}⚠️  GrepAI install skipped${NC}"
    fi
}

# Install portable Nushell
install_nushell_portable() {
    local nu_version="0.110.0"
    local download_url
    
    case "$OS_TYPE-$ARCH_TYPE" in
        "macos-arm64") download_url="https://github.com/nushell/nushell/releases/download/$nu_version/nu-$nu_version-aarch64-apple-darwin.tar.gz" ;;
        "macos-x64") download_url="https://github.com/nushell/nushell/releases/download/$nu_version/nu-$nu_version-x86_64-apple-darwin.tar.gz" ;;
        "linux-arm64") download_url="https://github.com/nushell/nushell/releases/download/$nu_version/nu-$nu_version-aarch64-unknown-linux-gnu.tar.gz" ;;
        "linux-x64") download_url="https://github.com/nushell/nushell/releases/download/$nu_version/nu-$nu_version-x86_64-unknown-linux-gnu.tar.gz" ;;
        *)
            echo -e "${YELLOW}⚠️  No portable Nushell for $OS_TYPE-$ARCH_TYPE, using system shell${NC}"
            return
            ;;
    esac
    
    echo -e "${BLUE}📦 Downloading Nushell for $OS_TYPE-$ARCH_TYPE...${NC}"
    curl -L "$download_url" | tar -xzf - -C /tmp/ 2>/dev/null
    find /tmp -name "nu" -type f -executable 2>/dev/null | head -1 | xargs -I {} mv {} "$UVSPEED_HOME/tools/bin/"
    chmod +x "$UVSPEED_HOME/tools/bin/nu" 2>/dev/null
    
    if [ -x "$UVSPEED_HOME/tools/bin/nu" ]; then
        echo -e "${GREEN}✅ Nushell installed${NC}"
    fi
}

# Install OpenCode AI
install_opencode() {
    if ! command -v opencode >/dev/null 2>&1; then
        echo -e "${CYAN}🤖 Installing OpenCode AI...${NC}"
        npm install -g opencode-ai 2>/dev/null || {
            echo -e "${YELLOW}⚠️  OpenCode install failed - using intelligent fallback${NC}"
            return 1
        }
        echo -e "${GREEN}✅ OpenCode AI installed${NC}"
    else
        echo -e "${GREEN}✅ OpenCode AI detected${NC}"
    fi
}

# Setup quantum environment
setup_quantum_environment() {
    echo -e "${PURPLE}🌌 Initializing Quantum Environment...${NC}"
    
    # Create quantum configuration
    cat > "$UVSPEED_HOME/config/quantum.env" << 'EOF'
# UV-Speed Quantum Environment Configuration
export UVSPEED_QUANTUM_MODE=true
export UVSPEED_ARCHITECTURE="Zig→Rust→Semantic→Visual"

# Quantum Navigation Aliases  
alias +1='echo "Moving +Y (lines up)"'
alias +0='echo "Moving +X (dependencies)"'
alias +n='echo "Moving +Z (complexity)"'

# Core UV-Speed Aliases
alias v='uv run'
alias va='uv add' 
alias vs='uv sync'
alias vq='python3 quantum/opencode_quantum_terminal_clean.py'

# Development Aliases
alias quantum='python3 quantum/opencode_quantum_terminal_clean.py'
alias qconvert='python3 quantum/quantum_handler_clean.py'
alias qstatus='python3 quantum/quantum_status_clean.py'

# GrepAI Integration (if available)
if command -v grepai >/dev/null 2>&1; then
    alias q='grepai search --compact --json'
    alias qf='grepai search --files'
    alias qt='grepai trace --json'
fi

echo "🌌 Quantum environment loaded"
echo "Commands: v, va, vs, quantum, qconvert, qstatus"
EOF

    # Setup Copilot integration context
    setup_copilot_integration
}

# Setup Copilot CLI integration for training/development
setup_copilot_integration() {
    echo -e "${BLUE}🚁 Setting up GitHub Copilot integration...${NC}"
    
    # Create Copilot context file for quantum terminal
    cat > "$UVSPEED_HOME/config/copilot_context.md" << 'EOF'
# UV-Speed Quantum Terminal - Copilot Development Context

## System Overview
UV-Speed is a quantum-numbered development environment where all code uses spatial navigation prefixes:
- n: = Entry points (#!/usr/bin/env)
- +1: = Comments/documentation  
- -n: = Imports/dependencies
- +0: = Classes
- 0: = Functions
- -1: = Error handling
- +n: = Conditionals
- +2: = Loops
- -0: = Returns
- +3: = Output statements

## Architecture
Zig (Ghostty) → Rust (Nushell/uv) → Semantic (GrepAI) → Visual

## Core Components
1. **Quantum Handler**: Converts any code to quantum numbering
2. **OpenCode Terminal**: AI coding with 3D spatial context
3. **Navigation System**: +1/-1/+0/-0/+n/-n movement
4. **Portable Tools**: UV, Nushell, GrepAI integration

## Development Workflow
- All execution through `uv run`
- Code generation includes quantum prefixes
- Position tracking in 3D code space
- Semantic search with GrepAI
- Universal code conversion for OS rebuild

## Copilot Integration
This context helps GitHub Copilot understand the quantum development environment and generate appropriate quantum-numbered code.
EOF

    # Create wrapper script for Copilot in quantum mode
    cat > "$UVSPEED_HOME/tools/copilot-quantum" << 'EOF'
#!/usr/bin/env bash
# GitHub Copilot wrapper with quantum context

# Load quantum environment
source "$UVSPEED_HOME/config/quantum.env" 2>/dev/null

# Add quantum context to copilot commands
if command -v copilot >/dev/null 2>&1; then
    echo "🚁 GitHub Copilot in Quantum Mode"
    echo "Context: UV-Speed quantum development environment"
    echo ""
    
    # Add context flag if available
    copilot "$@" --context "$UVSPEED_HOME/config/copilot_context.md" 2>/dev/null || copilot "$@"
else
    echo "⚠️  GitHub Copilot CLI not found"
    echo "Install: brew install gh && gh auth login && gh extension install github/gh-copilot"
fi
EOF

    chmod +x "$UVSPEED_HOME/tools/copilot-quantum"
}

# Create example project
create_examples() {
    echo -e "${BLUE}📁 Creating example projects...${NC}"
    
    # Quantum Hello World example
    mkdir -p "$UVSPEED_HOME/examples/hello-quantum"
    cat > "$UVSPEED_HOME/examples/hello-quantum/main.py" << 'EOF'
  n:  1  #!/usr/bin/env python3
 +1:  2  # Quantum Hello World Example
 +1:  3  # Demonstrates UV-Speed quantum numbering
 -n:  4  
 -n:  5  import sys
 -n:  6  
+0:  7  class QuantumGreeter:
 +1:  8      """Quantum-aware greeting system"""
    9      
  0: 10      def __init__(self, position=[0, 0, 0]):
   11          self.position = position
   12      
  0: 13      def greet(self, name="World"):
 +1: 14          """Generate quantum-positioned greeting"""
 -0: 15          return f"Hello {name} from position {self.position}!"
   16      
  0: 17      def move(self, delta):
 +1: 18          """Move in quantum space"""
+2: 19          for i in range(len(self.position)):
   20              self.position[i] += delta[i] if i < len(delta) else 0
   21  
  0: 22  def main():
 +1: 23      """Main quantum demo"""
   24      greeter = QuantumGreeter()
   25      
+3: 26      print("🌌 UV-Speed Quantum Demo")
+3: 27      print(greeter.greet("Quantum Developer"))
   28      
   29      greeter.move([1, 2, 3])
+3: 30      print(f"New position: {greeter.position}")
+3: 31      print(greeter.greet("Advanced User"))

+n: 32  if __name__ == "__main__":
   33      main()
EOF

    # Create project config
    cat > "$UVSPEED_HOME/examples/hello-quantum/pyproject.toml" << 'EOF'
[project]
name = "hello-quantum"
version = "1.0.0"
description = "UV-Speed quantum hello world example"
dependencies = []

[tool.uv]
dev-dependencies = []

[tool.uvspeed]
quantum_mode = true
navigation_enabled = true
EOF

    echo -e "${GREEN}✅ Example project created: examples/hello-quantum${NC}"
}

# Launch quantum terminal
launch_quantum_terminal() {
    echo -e "${PURPLE}🚀 Launching UV-Speed Quantum Terminal...${NC}"
    echo ""
    
    # Load quantum environment
    source "$UVSPEED_HOME/config/quantum.env"
    
    # Start in quantum directory
    cd "$UVSPEED_HOME"
    
    # Show quick help
    echo -e "${CYAN}🌌 UV-Speed Quantum Terminal Ready${NC}"
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  ${GREEN}quantum${NC}     - Launch quantum AI terminal"
    echo -e "  ${GREEN}qconvert${NC}    - Convert files to quantum numbering"
    echo -e "  ${GREEN}qstatus${NC}     - Show system status"
    echo -e "  ${GREEN}v${NC}           - uv run (fast execution)"
    echo ""
    echo -e "${YELLOW}💡 Try: quantum${NC}"
    echo ""
    
    # Launch appropriate shell
    if [ -x "$UVSPEED_HOME/tools/bin/nu" ]; then
        exec "$UVSPEED_HOME/tools/bin/nu"
    elif command -v nu >/dev/null 2>&1; then
        exec nu
    else
        echo -e "${YELLOW}⚠️  Starting bash with quantum aliases${NC}"
        exec bash --rcfile <(echo "source '$UVSPEED_HOME/config/quantum.env'")
    fi
}

# Show help
show_help() {
    echo "UV-Speed Quantum Terminal"
    echo ""
    echo "Usage:"
    echo "  ./launch.sh                - Launch quantum terminal"
    echo "  ./launch.sh install        - Install dependencies only" 
    echo "  ./launch.sh status         - Show system status"
    echo "  ./launch.sh quantum        - Launch quantum AI terminal directly"
    echo "  ./launch.sh examples       - Show example projects"
    echo "  ./launch.sh help           - Show this help"
    echo ""
    echo "Quantum Commands:"
    echo "  quantum                    - AI coding with 3D navigation"
    echo "  qconvert <file>            - Convert code to quantum format"
    echo "  qstatus                    - System status"
    echo ""
    echo "Architecture: Zig→Rust→Semantic→Visual"
}

# Main execution
main() {
    detect_system
    
    case "${1:-launch}" in
        "install")
            install_dependencies
            setup_quantum_environment
            create_examples
            echo -e "${GREEN}✅ UV-Speed installation complete${NC}"
            ;;
        "status")
            cd "$UVSPEED_HOME/quantum" 2>/dev/null && python3 quantum_status_clean.py || echo "Run ./launch.sh install first"
            ;;
        "quantum")
            cd "$UVSPEED_HOME/quantum" && python3 opencode_quantum_terminal_clean.py
            ;;
        "examples")
            echo -e "${CYAN}📁 Example Projects:${NC}"
            echo -e "  ${GREEN}hello-quantum${NC} - Quantum numbered Python demo"
            echo ""
            echo -e "${BLUE}Try:${NC}"
            echo "  cd examples/hello-quantum"
            echo "  uv run main.py"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        "launch"|*)
            install_dependencies
            setup_quantum_environment
            create_examples
            launch_quantum_terminal
            ;;
    esac
}

main "$@"