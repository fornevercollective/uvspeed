#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Universal installer — zerobrew > brew > curl fallback
# v4.0 · Dev terminal app install chain
#
# Usage:
#   ./install.sh              # default: uv + bridge + open notepad
#   ./install.sh --hexcast    # install + launch hexcast live camera in terminal
#   ./install.sh --full       # everything: uv + tauri + ollama + nushell
#   ./install.sh --app        # build Tauri v2 desktop app
#   curl -fsSL https://raw.githubusercontent.com/ForNeverCollective/uvspeed/main/install.sh | sh
#
# One-liner hexcast on any machine:
#   curl -LsSf https://astral.sh/uv/install.sh | sh && uv run https://raw.githubusercontent.com/ForNeverCollective/uvspeed/main/tools/hexcast

set -euo pipefail

# ─── Colors ───
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
PURPLE='\033[0;35m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'
DIM='\033[2m'

info()  { echo -e "${BLUE}[uvspeed]${NC} $1"; }
ok()    { echo -e "${GREEN}[  ✓  ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[ warn]${NC} $1"; }
fail()  { echo -e "${RED}[error]${NC} $1"; exit 1; }
step()  { echo -e "\n${PURPLE}${BOLD}── $1 ──${NC}"; }

# ─── Parse Args ───
INSTALL_APP=0; INSTALL_AI=0; INSTALL_QUANTUM=0; INSTALL_WORKSTATION=0; NO_OPEN=0; LAUNCH_HEXCAST=0

for arg in "$@"; do
    case "$arg" in
        --app)      INSTALL_APP=1 ;;
        --ai)       INSTALL_AI=1 ;;
        --quantum)  INSTALL_QUANTUM=1 ;;
        --full)     INSTALL_APP=1; INSTALL_AI=1; INSTALL_QUANTUM=1 ;;
        --workstation) INSTALL_WORKSTATION=1 ;;
        --no-open)  NO_OPEN=1 ;;
        --hexcast)  LAUNCH_HEXCAST=1 ;;
        --help|-h)
            echo "uvspeed installer — https://github.com/ForNeverCollective/uvspeed"
            echo ""
            echo "  ./install.sh              default: uv + bridge + notepad"
            echo "  ./install.sh --hexcast    install + launch hexcast camera terminal"
            echo "  ./install.sh --app        + Tauri v2 desktop app build"
            echo "  ./install.sh --ai         + Ollama local AI + tinygrad + MLX"
            echo "  ./install.sh --quantum    + Qiskit quantum sim"
            echo "  ./install.sh --workstation  full dev tool stack (ripgrep, fd, bat, fzf, etc)"
            echo "  ./install.sh --full       all of the above"
            echo "  ./install.sh --no-open    don't open browser"
            echo ""
            echo "One-liner hexcast (any machine with curl):"
            echo "  curl -LsSf https://astral.sh/uv/install.sh | sh && uv run tools/hexcast"
            exit 0 ;;
    esac
done

# ─── Detect Platform ───
OS="$(uname -s)"; ARCH="$(uname -m)"
case "$OS" in
    Darwin*)  PLATFORM="macos" ;;
    Linux*)   PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *)        fail "Unsupported OS: $OS" ;;
esac
case "$ARCH" in
    x86_64|amd64)  ARCH_TAG="x86_64" ;;
    arm64|aarch64) ARCH_TAG="aarch64" ;;
    armv7*)        ARCH_TAG="armv7" ;;
    *)             fail "Unsupported arch: $ARCH" ;;
esac

echo ""
echo -e "${PURPLE}${BOLD}  ⚛  uvspeed dev installer${NC}"
echo -e "${CYAN}  beyondBINARY quantum-prefixed code architecture${NC}"
echo -e "  {+1, 1, -1, +0, 0, -0, +n, n, -n}"
echo ""
info "Platform: $PLATFORM ($ARCH_TAG)"

# ─── Package manager detection ───
# Prefer zerobrew (5-20x faster), fall back to brew, then curl
PKG=""
if command -v zb &>/dev/null; then
    PKG="zb"
    ok "Package manager: zerobrew (fast mode)"
elif command -v brew &>/dev/null; then
    PKG="brew"
    ok "Package manager: Homebrew"
    info "Tip: install zerobrew for 5-20x faster installs: curl -fsSL https://zerobrew.rs/install | bash"
else
    PKG="curl"
    ok "Package manager: direct curl (no brew/zb found)"
fi

pkg_install() {
    # Usage: pkg_install <package_name>
    local pkg="$1"
    if [ "$PKG" = "zb" ]; then
        zb install "$pkg" 2>/dev/null && return 0
    elif [ "$PKG" = "brew" ]; then
        brew install "$pkg" 2>/dev/null && return 0
    fi
    return 1
}

# ═══════════════════════════════════════════════════════
step "Step 1: uv (Rust Python package manager)"
# ═══════════════════════════════════════════════════════
if command -v uv &>/dev/null; then
    ok "uv $(uv --version 2>/dev/null)"
else
    info "Installing uv..."
    if [ "$PLATFORM" = "windows" ]; then
        powershell -c "irm https://astral.sh/uv/install.ps1 | iex" || fail "uv install failed"
    else
        curl -LsSf https://astral.sh/uv/install.sh | sh || fail "uv install failed"
        export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    fi
    ok "uv installed: $(uv --version 2>/dev/null)"
fi

# ═══════════════════════════════════════════════════════
step "Step 2: Rust toolchain"
# ═══════════════════════════════════════════════════════
if command -v rustup &>/dev/null; then
    ok "rustup $(rustup --version 2>/dev/null | head -1)"
    ok "cargo $(cargo --version 2>/dev/null)"
else
    info "Installing Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || fail "Rust install failed"
    source "$HOME/.cargo/env" 2>/dev/null || export PATH="$HOME/.cargo/bin:$PATH"
    ok "Rust installed: $(rustup --version 2>/dev/null | head -1)"
fi

# Ensure wasm target is available for prefix engine
if [ "$INSTALL_APP" -eq 1 ]; then
    info "Adding wasm32 target for prefix engine..."
    rustup target add wasm32-unknown-unknown 2>/dev/null || true
    ok "wasm32-unknown-unknown target ready"
fi

# ═══════════════════════════════════════════════════════
step "Step 3: uvspeed repo"
# ═══════════════════════════════════════════════════════
# Detect if we're already in the uvspeed repo
if [ -f "./pyproject.toml" ] && grep -q "uvspeed" ./pyproject.toml 2>/dev/null; then
    UVSPEED_DIR="$(pwd)"
    ok "Already in uvspeed repo: $UVSPEED_DIR"
elif [ -f "./web/quantum-notepad.html" ]; then
    UVSPEED_DIR="$(pwd)"
    ok "Already in uvspeed repo: $UVSPEED_DIR"
else
    UVSPEED_DIR="$HOME/uvspeed"
    if [ -d "$UVSPEED_DIR/.git" ]; then
        info "Updating uvspeed..."
        cd "$UVSPEED_DIR"
        git pull --ff-only origin main 2>/dev/null || warn "Git pull failed — using existing"
        ok "uvspeed updated"
    else
        info "Cloning uvspeed..."
        if command -v git &>/dev/null; then
            git clone https://github.com/ForNeverCollective/uvspeed.git "$UVSPEED_DIR" 2>/dev/null || {
                mkdir -p "$UVSPEED_DIR"
                curl -fsSL https://github.com/ForNeverCollective/uvspeed/archive/main.tar.gz | \
                    tar xz --strip-components=1 -C "$UVSPEED_DIR" || fail "Download failed"
            }
        else
            mkdir -p "$UVSPEED_DIR"
            curl -fsSL https://github.com/ForNeverCollective/uvspeed/archive/main.tar.gz | \
                tar xz --strip-components=1 -C "$UVSPEED_DIR" || fail "Download failed"
        fi
        ok "uvspeed cloned to $UVSPEED_DIR"
    fi
    cd "$UVSPEED_DIR"
fi

# ═══════════════════════════════════════════════════════
step "Step 4: Python environment"
# ═══════════════════════════════════════════════════════
if [ -f "pyproject.toml" ]; then
    uv sync 2>/dev/null || uv pip install -e "." 2>/dev/null || warn "Python deps had warnings"
    ok "Python environment synced"
elif [ -f "requirements.txt" ]; then
    uv pip install -r requirements.txt 2>/dev/null || warn "Some pip packages failed"
    ok "Python packages installed"
else
    warn "No pyproject.toml — skipping Python setup"
fi

# ═══════════════════════════════════════════════════════
step "Step 5: Bridge server"
# ═══════════════════════════════════════════════════════
BRIDGE=""
for f in "src/01-core/quantum_bridge_server.py" "quantum_bridge_server.py"; do
    [ -f "$f" ] && BRIDGE="$f" && break
done

if [ -n "$BRIDGE" ]; then
    if curl -sf http://localhost:8085/api/health &>/dev/null; then
        ok "Bridge already running on :8085"
    else
        info "Starting bridge server..."
        nohup uv run "$BRIDGE" > /tmp/uvspeed-bridge.log 2>&1 &
        BPID=$!
        sleep 2
        if curl -sf http://localhost:8085/api/health &>/dev/null; then
            ok "Bridge started (PID $BPID) → :8085 / ws :8086"
        else
            warn "Bridge starting — check /tmp/uvspeed-bridge.log"
        fi
    fi
else
    warn "Bridge script not found — skipping"
fi

# ═══════════════════════════════════════════════════════
step "Step 6: Node.js + Electron (current app)"
# ═══════════════════════════════════════════════════════
if command -v node &>/dev/null; then
    ok "Node.js $(node --version 2>/dev/null)"
else
    info "Installing Node.js..."
    pkg_install node || {
        curl -fsSL https://fnm.vercel.app/install | bash 2>/dev/null
        eval "$(fnm env)" 2>/dev/null
        fnm install --lts 2>/dev/null || warn "Node install failed — install manually"
    }
    command -v node &>/dev/null && ok "Node.js $(node --version)"
fi

if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
        info "Installing npm dependencies..."
        npm install 2>/dev/null || warn "npm install had warnings"
    fi
    ok "npm dependencies ready"
fi

# ═══════════════════════════════════════════════════════
if [ "$INSTALL_APP" -eq 1 ]; then
    step "Step 7: Tauri v2 CLI + build"
    
    if command -v cargo-tauri &>/dev/null || cargo tauri --version &>/dev/null 2>&1; then
        ok "Tauri CLI $(cargo tauri --version 2>/dev/null)"
    else
        info "Installing Tauri CLI..."
        cargo install tauri-cli --version "^2" 2>/dev/null || warn "Tauri CLI install failed"
        ok "Tauri CLI installed"
    fi
    
    # macOS build deps
    if [ "$PLATFORM" = "macos" ]; then
        info "Checking macOS build requirements..."
        if ! xcode-select -p &>/dev/null; then
            warn "Xcode CLT needed: xcode-select --install"
        else
            ok "Xcode Command Line Tools"
        fi
    fi
    
    # Build Tauri app
    if [ -f "src-tauri/Cargo.toml" ]; then
        info "Building Tauri v2 app (this may take a few minutes on first run)..."
        cd "$UVSPEED_DIR"
        cargo tauri build 2>&1 | tail -5 || {
            warn "Tauri build failed — check src-tauri/Cargo.toml"
            info "Try: cd $UVSPEED_DIR && cargo tauri build"
        }
        
        # Find the built binary
        DMG=$(find src-tauri/target/release/bundle -name "*.dmg" 2>/dev/null | head -1)
        APP=$(find src-tauri/target/release/bundle -name "*.app" 2>/dev/null | head -1)
        if [ -n "$DMG" ]; then
            ok "Built: $DMG"
        elif [ -n "$APP" ]; then
            ok "Built: $APP"
        fi
    else
        warn "src-tauri/Cargo.toml not found — skipping build"
    fi
fi

# ═══════════════════════════════════════════════════════
if [ "$INSTALL_AI" -eq 1 ]; then
    step "Step 8: Ollama (local AI)"
    
    if command -v ollama &>/dev/null; then
        ok "Ollama already installed"
    else
        info "Installing Ollama..."
        if [ "$PLATFORM" = "macos" ]; then
            pkg_install ollama || curl -fsSL https://ollama.ai/install.sh | sh || warn "Ollama failed"
        elif [ "$PLATFORM" = "linux" ]; then
            curl -fsSL https://ollama.ai/install.sh | sh || warn "Ollama failed"
        fi
        if command -v ollama &>/dev/null; then
            ok "Ollama installed"
            info "Pulling llama3.2:1b..."
            ollama pull llama3.2:1b 2>/dev/null || warn "Model pull failed"
        fi
    fi
fi

# ═══════════════════════════════════════════════════════
if [ "$INSTALL_QUANTUM" -eq 1 ]; then
    step "Step 9: Qiskit (quantum sim)"
    uv pip install qiskit qiskit-aer 2>/dev/null || warn "Qiskit had warnings"
    ok "Qiskit installed"
fi

# ═══════════════════════════════════════════════════════
if [ "${INSTALL_WORKSTATION:-0}" -eq 1 ]; then
    step "Step 10: Workstation dev tools"
    
    WS_TOOLS=(ripgrep fd bat fzf jq tree htop tmux eza starship cmake ninja wget)
    for tool in "${WS_TOOLS[@]}"; do
        if brew list --formula "$tool" &>/dev/null 2>&1 || command -v "$tool" &>/dev/null; then
            ok "$tool (installed)"
        else
            info "Installing $tool..."
            pkg_install "$tool" || warn "$tool install failed"
        fi
    done
    
    # Python AI packages (MLX + tinygrad deps)
    PY="/opt/homebrew/opt/python@3.13/libexec/bin/python"
    if [ -x "$PY" ]; then
        info "Checking Python 3.13 AI packages..."
        for pypkg in numpy scipy pillow mlx; do
            if "$PY" -c "import $pypkg" 2>/dev/null; then
                ok "$pypkg (python3.13)"
            else
                info "Installing $pypkg..."
                "$PY" -m pip install --break-system-packages --no-cache-dir "$pypkg" 2>/dev/null || warn "$pypkg failed"
            fi
        done
    fi
    
    ok "Workstation tools ready"
    info "Full workstation setup: bash tools/setup-workstation.sh"
    info "Tool manifest: tools/workstation-manifest.json"
fi

# ═══════════════════════════════════════════════════════
step "Step 11: Nushell (optional modern shell)"
# ═══════════════════════════════════════════════════════
if command -v nu &>/dev/null; then
    ok "Nushell $(nu --version 2>/dev/null)"
else
    info "Installing Nushell..."
    pkg_install nushell 2>/dev/null || cargo install nu 2>/dev/null || warn "Nushell install failed"
    command -v nu &>/dev/null && ok "Nushell installed"
fi

# ═══════════════════════════════════════════════════════
step "Done"
# ═══════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}${BOLD}  ✅  uvspeed ready${NC}"
echo ""
echo -e "  ${DIM}pkg manager${NC}   $([ "$PKG" = "zb" ] && echo -e "${GREEN}zerobrew${NC}" || echo "$PKG")"
echo -e "  ${DIM}uv${NC}            $(uv --version 2>/dev/null || echo 'not found')"
echo -e "  ${DIM}rust${NC}          $(rustc --version 2>/dev/null || echo 'not found')"
echo -e "  ${DIM}node${NC}          $(node --version 2>/dev/null || echo 'not found')"
echo -e "  ${DIM}nushell${NC}       $(nu --version 2>/dev/null || echo 'not installed')"
echo -e "  ${DIM}ollama${NC}        $(command -v ollama &>/dev/null && echo 'installed' || echo 'not installed')"
echo -e "  ${DIM}bridge${NC}        $(curl -sf http://localhost:8085/api/health &>/dev/null && echo -e '${GREEN}running :8085${NC}' || echo 'offline')"
echo ""
echo -e "  ${CYAN}Launch:${NC}"
echo -e "    ${BOLD}uv run tools/hexcast${NC}                         # 📷 Live camera → terminal (truecolor)"
echo -e "    ${BOLD}uv run tools/hexcast --test${NC}                  # 🎨 Test pattern (no camera needed)"
echo -e "    ${BOLD}uv run tools/hexcast --thermal${NC}               # 🌡  Camera in thermal palette"
echo -e "    ${BOLD}npm start${NC}                                    # Electron app (loads v3.5 notepad)"
echo -e "    ${BOLD}open web/quantum-notepad.html${NC}                # Browser"
echo -e "    ${BOLD}uv run src/01-core/quantum_bridge_server.py${NC}  # Bridge server"
[ "$INSTALL_APP" -eq 1 ] && echo -e "    ${BOLD}cargo tauri dev${NC}                               # Tauri v2 dev mode"
echo ""

# ─── Open ───
if [ "$NO_OPEN" -eq 0 ]; then
    case "$PLATFORM" in
        macos)   open "file://$UVSPEED_DIR/web/quantum-notepad.html" 2>/dev/null ;;
        linux)   xdg-open "file://$UVSPEED_DIR/web/quantum-notepad.html" 2>/dev/null ;;
        windows) start "file://$UVSPEED_DIR/web/quantum-notepad.html" 2>/dev/null ;;
    esac
fi

# ─── Launch hexcast if requested ───
if [ "$LAUNCH_HEXCAST" -eq 1 ]; then
    step "hexcast — live camera → terminal"
    info "Launching hexcast (q to quit)..."
    exec uv run "$UVSPEED_DIR/tools/hexcast"
fi

echo -e "${PURPLE}⚛ beyondBINARY${NC} | {+1, 1, -1, +0, 0, -0, +n, n, -n}"
