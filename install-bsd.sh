#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UV-Speed BSD Installation Script
# Compatible with FreeBSD, OpenBSD, NetBSD

set -e

echo "🌌 UV-Speed Quantum Terminal - BSD Installation"
echo "================================================"

# Detect BSD variant
if [ -f "/etc/freebsd-update.conf" ]; then
    BSD_TYPE="freebsd"
elif [ -f "/etc/openbsd-version" ]; then
    BSD_TYPE="openbsd"  
elif [ -f "/etc/netbsd-version" ]; then
    BSD_TYPE="netbsd"
else
    BSD_TYPE="unknown"
fi

echo "Detected: $BSD_TYPE"

# Install dependencies using pkg/pkg_add
install_bsd_deps() {
    case "$BSD_TYPE" in
        "freebsd")
            echo "Installing FreeBSD packages..."
            if command -v pkg >/dev/null 2>&1; then
                sudo pkg install -y curl python3 node npm
            fi
            ;;
        "openbsd")
            echo "Installing OpenBSD packages..."
            if command -v pkg_add >/dev/null 2>&1; then
                sudo pkg_add curl python3 node npm
            fi
            ;;
        "netbsd")  
            echo "Installing NetBSD packages..."
            if command -v pkgin >/dev/null 2>&1; then
                sudo pkgin -y install curl python3 nodejs npm
            fi
            ;;
    esac
}

# Install UV (works on all BSD)
install_uv_bsd() {
    echo "Installing UV package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
}

# Main BSD installation
main() {
    install_bsd_deps
    install_uv_bsd
    
    echo ""
    echo "✅ BSD installation complete!"
    echo ""
    echo "Next steps:"
    echo "  ./launch.sh install"
    echo "  ./launch.sh"
}

main "$@"