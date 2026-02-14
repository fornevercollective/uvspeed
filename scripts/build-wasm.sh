#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Build prefix-engine to WebAssembly for browser use
set -euo pipefail

CRATE_DIR="crates/prefix-engine"
OUT_DIR="web/wasm"
PKG_NAME="prefix_engine"

info()  { printf "\033[36m→ %s\033[0m\n" "$*"; }
ok()    { printf "\033[32m✓ %s\033[0m\n" "$*"; }
err()   { printf "\033[31m✗ %s\033[0m\n" "$*"; exit 1; }

# ── Check prerequisites ──
command -v wasm-pack >/dev/null 2>&1 || {
  info "Installing wasm-pack..."
  cargo install wasm-pack
}

command -v wasm-opt >/dev/null 2>&1 || {
  info "wasm-opt not found — WASM will not be size-optimized"
  info "Install with: brew install binaryen"
}

# ── Build ──
info "Building $PKG_NAME → WASM (release, web target)..."
cd "$CRATE_DIR"

wasm-pack build \
  --target web \
  --release \
  --out-dir "../../$OUT_DIR" \
  --out-name "$PKG_NAME" \
  -- --features wasm

# ── Clean generated files we don't need ──
cd "../../$OUT_DIR"
rm -f .gitignore package.json README.md

# ── Size report ──
if [ -f "${PKG_NAME}_bg.wasm" ]; then
  WASM_SIZE=$(wc -c < "${PKG_NAME}_bg.wasm" | tr -d ' ')
  ok "WASM built: ${PKG_NAME}_bg.wasm ($WASM_SIZE bytes)"

  # Optimize if wasm-opt is available
  if command -v wasm-opt >/dev/null 2>&1; then
    info "Optimizing with wasm-opt..."
    wasm-opt -Oz "${PKG_NAME}_bg.wasm" -o "${PKG_NAME}_bg.wasm"
    OPT_SIZE=$(wc -c < "${PKG_NAME}_bg.wasm" | tr -d ' ')
    ok "Optimized: $WASM_SIZE → $OPT_SIZE bytes"
  fi
else
  err "WASM output not found!"
fi

ok "Output in $OUT_DIR/"
ls -lh "$OUT_DIR/"
