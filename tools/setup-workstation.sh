#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# ═══════════════════════════════════════════════════════════════════════
# setup-workstation.sh — M4 AI/tinygrad/Cursor/uvspeed workstation setup
# Re-run anytime to restore or update the full tool stack
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colors ──
R='\033[0;31m' G='\033[0;32m' B='\033[0;34m' Y='\033[1;33m'
C='\033[0;36m' M='\033[0;35m' W='\033[1;37m' N='\033[0m'

info()  { echo -e "${B}[info]${N}  $*"; }
ok()    { echo -e "${G}[  ok]${N}  $*"; }
warn()  { echo -e "${Y}[warn]${N}  $*"; }
err()   { echo -e "${R}[ err]${N}  $*"; }
head()  { echo -e "\n${W}═══ $* ═══${N}"; }

# ── Pre-flight ──
head "Pre-flight checks"
echo -e "  Machine:  $(uname -m) · $(sysctl -n machdep.cpu.brand_string)"
echo -e "  Memory:   $(sysctl -n hw.memsize | awk '{printf "%.0f GB", $1/1073741824}')"
echo -e "  macOS:    $(sw_vers -productVersion)"
echo -e "  Disk:     $(df -h / | tail -1 | awk '{print $4}') free"
echo ""

# ── 1: Homebrew ──────────────────────────────────────────────────────
head "Homebrew"
if ! command -v brew &>/dev/null; then
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    ok "brew $(brew --version | head -1 | awk '{print $2}')"
fi

info "Updating brew..."
brew update --quiet

# ── CLI Essentials ──
head "CLI Essentials"
BREW_CLI=(
    # Search & Files
    ripgrep          # rg — fast regex search (Cursor Grep backend)
    fd               # fd — fast find alternative
    bat              # bat — cat with syntax highlighting
    fzf              # fzf — fuzzy finder (Ctrl+R, Ctrl+T)
    eza              # eza — modern ls with icons + git status
    jq               # jq — JSON processor
    tree             # tree — directory viewer

    # System & Process
    htop             # htop — interactive process monitor
    tmux             # tmux — terminal multiplexer
    wget             # wget — HTTP downloader

    # Prompt
    starship         # starship — cross-shell prompt (Rust)
)

for pkg in "${BREW_CLI[@]}"; do
    if brew list --formula "$pkg" &>/dev/null; then
        ok "$pkg (installed)"
    else
        info "Installing $pkg..."
        brew install "$pkg"
    fi
done

# ── Build Tools ──
head "Build Tools"
BREW_BUILD=(
    cmake            # cmake — build system generator
    ninja            # ninja — fast build system
    mkcert           # mkcert — local TLS certificates
)

for pkg in "${BREW_BUILD[@]}"; do
    if brew list --formula "$pkg" &>/dev/null; then
        ok "$pkg (installed)"
    else
        info "Installing $pkg..."
        brew install "$pkg"
    fi
done

# ── Languages & Runtimes ──
head "Languages & Runtimes"
BREW_LANG=(
    python@3.13      # Python 3.13 (primary)
    node             # Node.js (LTS)
    uv               # uv — fast Python package manager (Rust)
)

for pkg in "${BREW_LANG[@]}"; do
    if brew list --formula "$pkg" &>/dev/null; then
        ok "$pkg (installed)"
    else
        info "Installing $pkg..."
        brew install "$pkg"
    fi
done

# ── Media / Codecs ──
head "Media & Codecs"
BREW_MEDIA=(
    ffmpeg           # ffmpeg — video/audio swiss army knife
    sdl2             # SDL2 — graphics/audio/input library
)

for pkg in "${BREW_MEDIA[@]}"; do
    if brew list --formula "$pkg" &>/dev/null; then
        ok "$pkg (installed)"
    else
        info "Installing $pkg..."
        brew install "$pkg"
    fi
done

# ── AI / ML ──
head "AI & ML Tools"
BREW_AI=(
    ollama           # ollama — local LLM server (Metal-accelerated)
    grepai           # grepai — semantic code search
)

for pkg in "${BREW_AI[@]}"; do
    if brew list --formula "$pkg" &>/dev/null; then
        ok "$pkg (installed)"
    else
        info "Installing $pkg..."
        brew install "$pkg"
    fi
done

# ── Casks ──
head "Desktop Apps (Casks)"
BREW_CASKS=(
    ghostty          # ghostty — GPU-accelerated terminal
    android-platform-tools  # adb — Android/Quest development
)

for cask in "${BREW_CASKS[@]}"; do
    if brew list --cask "$cask" &>/dev/null; then
        ok "$cask (installed)"
    else
        info "Installing $cask..."
        brew install --cask "$cask" || warn "Failed to install $cask (may need manual install)"
    fi
done

# ── 2: Rust Toolchain ───────────────────────────────────────────────
head "Rust Toolchain"
if ! command -v rustup &>/dev/null; then
    info "Installing rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source "$HOME/.cargo/env"
else
    ok "rustup installed"
fi

# Ensure stable is default
if ! rustc --version &>/dev/null; then
    info "Setting stable as default toolchain..."
    rustup default stable
else
    ok "rustc $(rustc --version | awk '{print $2}')"
fi

# ── 3: Nushell ──────────────────────────────────────────────────────
head "Nushell"
if [ -f "$HOME/.local/bin/nu" ]; then
    ok "nushell $($HOME/.local/bin/nu --version)"
else
    info "Install nushell: cargo install nu"
    info "  or: brew install nushell"
fi

# ── 4: Python AI Packages ──────────────────────────────────────────
head "Python AI Packages (3.13)"
PY="/opt/homebrew/opt/python@3.13/libexec/bin/python"
if [ -x "$PY" ]; then
    PY_PKGS=(numpy scipy pillow mlx)
    for pkg in "${PY_PKGS[@]}"; do
        if "$PY" -c "import $pkg" 2>/dev/null; then
            ver=$("$PY" -c "import $pkg; print($pkg.__version__)" 2>/dev/null || echo "ok")
            ok "$pkg ($ver)"
        else
            info "Installing $pkg..."
            "$PY" -m pip install --break-system-packages --no-cache-dir "$pkg"
        fi
    done
else
    warn "Python 3.13 not found at $PY"
fi

# ── 5: tinygrad (local) ────────────────────────────────────────────
head "tinygrad"
TINYGRAD="$HOME/tinygrad"
if [ -d "$TINYGRAD" ]; then
    cd "$TINYGRAD"
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "?")
    VERSION=$(grep 'version' pyproject.toml 2>/dev/null | head -1 | grep -o '"[^"]*"' | tr -d '"')
    ok "tinygrad $VERSION ($BRANCH@$HASH)"
    
    # Test Metal
    if PYTHONPATH="$TINYGRAD" "$PY" -c "from tinygrad import Device; assert Device.DEFAULT == 'METAL'" 2>/dev/null; then
        ok "Metal backend active"
    else
        warn "Metal backend not active — check METAL_DEVICE_WRAPPER_TYPE=1"
    fi
    
    info "To update: cd ~/tinygrad && git pull"
else
    warn "tinygrad not found at $TINYGRAD"
    info "Clone: git clone https://github.com/tinygrad/tinygrad.git ~/tinygrad"
fi

# ── 6: Zerobrew (media codecs) ──────────────────────────────────────
head "Zerobrew"
ZB="$HOME/.zerobrew/bin/zb"
if [ -x "$ZB" ]; then
    ok "zerobrew $($ZB --version | awk '{print $2}')"
    $ZB list 2>/dev/null | while IFS= read -r line; do
        echo "  $line"
    done
else
    warn "zerobrew not installed"
    info "See: https://github.com/nicholasgasior/zerobrew"
fi

# ── 7: Disk Check ──────────────────────────────────────────────────
head "Disk Space"
FREE=$(df -h / | tail -1 | awk '{print $4}')
USED_PCT=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$USED_PCT" -gt 90 ]; then
    warn "Disk ${USED_PCT}% used ($FREE free) — consider cleanup:"
    echo "  npm cache:  npm cache clean --force"
    echo "  uv cache:   uv cache clean"
    echo "  brew cache: brew cleanup --prune=1"
    echo "  pip cache:  pip cache purge"
else
    ok "Disk: $FREE free (${USED_PCT}% used)"
fi

# ── Summary ─────────────────────────────────────────────────────────
head "Setup Complete"
echo ""
echo -e "  ${G}Shells:${N}    zsh $(zsh --version | awk '{print $2}') · nushell · bash"
echo -e "  ${G}Python:${N}    $($PY --version 2>&1 | awk '{print $2}') + tinygrad + MLX + NumPy"
echo -e "  ${G}Rust:${N}      $(rustc --version 2>/dev/null | awk '{print $2}' || echo 'not set')"
echo -e "  ${G}Node:${N}      $(node --version 2>/dev/null)"
echo -e "  ${G}AI:${N}        tinygrad (Metal) · MLX (Metal) · Ollama"
echo -e "  ${G}Search:${N}    ripgrep · fd · fzf · grepai"
echo -e "  ${G}Build:${N}     cmake · ninja · ffmpeg"
echo -e "  ${G}Manager:${N}   brew · uv · zerobrew · cargo · pnpm"
echo ""
echo -e "  ${C}Run 'source ~/.zshrc' to reload shell config${N}"
echo -e "  ${C}Run 'ollama serve' to start local LLM server${N}"
echo -e "  ${C}Run '~/.local/bin/nu' for nushell${N}"
echo ""
echo -e "${M}beyondBINARY quantum-prefixed | M4 AI workstation ready${N}"
