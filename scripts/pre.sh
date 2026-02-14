#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# uvspeed pre-push checklist
# Usage:
#   bash scripts/pre.sh              # full pre-push audit
#   bash scripts/pre.sh folder       # git status + stale file check
#   bash scripts/pre.sh inspect      # health check all 19 apps
#   bash scripts/pre.sh inspect notepad  # just notepad
#   bash scripts/pre.sh gold         # verify gold standard files
#   bash scripts/pre.sh push         # stage + commit + push
#   bash scripts/pre.sh push "msg"   # commit with message + push
#   bash scripts/pre.sh pre push     # full audit then push
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# ── Colors ──
R='\033[0;31m' G='\033[0;32m' Y='\033[0;33m' B='\033[0;34m'
P='\033[0;35m' C='\033[0;36m' W='\033[0m' BOLD='\033[1m'

ok()   { echo -e "  ${G}✓${W} $*"; }
fail() { echo -e "  ${R}✗${W} $*"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "  ${Y}⚠${W} $*"; }
info() { echo -e "  ${C}·${W} $*"; }
hdr()  { echo -e "\n${BOLD}${P}⚛${W}${BOLD} $*${W}"; }

ERRORS=0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FOLDER — git status + stale file check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd_folder() {
    hdr "Folder Check"

    local modified untracked
    modified=$(git diff --name-only HEAD 2>/dev/null | wc -l | tr -d ' ')
    untracked=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

    info "Modified: ${modified} files"
    info "Untracked: ${untracked} files"

    # Check for stale duplicate files
    if [ -f "web/quantum-prefix.js" ]; then
        fail "Stale file: web/quantum-prefix.js (should be quantum-prefixes.js)"
    fi
    if ls web/quantum-prefix*.js 2>/dev/null | grep -qv "quantum-prefixes.js"; then
        fail "Unexpected quantum-prefix*.js variants found"
    else
        ok "No stale prefix files"
    fi

    # Check branch
    local branch
    branch=$(git branch --show-current)
    info "Branch: ${branch}"

    # Check if ahead of remote
    local ahead
    ahead=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "?")
    if [ "$ahead" != "?" ] && [ "$ahead" -gt 0 ]; then
        warn "Ahead of remote by ${ahead} commits (unpushed)"
    elif [ "$ahead" = "0" ]; then
        ok "Up to date with remote"
    fi

    ok "Folder check done"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INSPECT — structural health check for web apps
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

inspect_app() {
    local file="$1"
    local name
    name=$(basename "$file" .html)
    local issues=0

    # DOCTYPE
    if ! head -5 "$file" | grep -qi "<!DOCTYPE html>"; then
        fail "${name}: missing <!DOCTYPE html>"
        issues=$((issues + 1))
    fi

    # Closing tags
    if ! grep -q "</html>" "$file"; then
        fail "${name}: missing </html>"
        issues=$((issues + 1))
    fi
    if ! grep -q "</head>" "$file"; then
        fail "${name}: missing </head>"
        issues=$((issues + 1))
    fi
    if ! grep -q "</body>" "$file"; then
        fail "${name}: missing </body>"
        issues=$((issues + 1))
    fi

    # quantum-prefixes.js
    if ! grep -q 'quantum-prefixes.js' "$file"; then
        fail "${name}: missing quantum-prefixes.js include"
        issues=$((issues + 1))
    fi

    # Service worker
    if ! grep -q 'sw.js' "$file"; then
        fail "${name}: missing sw.js registration"
        issues=$((issues + 1))
    fi

    # Quantum prefix header
    if ! head -1 "$file" | grep -q 'beyondBINARY\|quantum-prefixed'; then
        warn "${name}: missing quantum prefix header comment"
    fi

    # QUANTUM PREFIX LIVE SYNC
    if ! grep -q 'QUANTUM PREFIX LIVE SYNC\|QP\.broadcastState\|QuantumPrefixes' "$file"; then
        warn "${name}: no quantum prefix sync block detected"
    fi

    if [ $issues -eq 0 ]; then
        ok "${name}"
    fi
}

cmd_inspect() {
    local target="${1:-all}"
    hdr "Inspect Apps"

    case "$target" in
        notepad)
            inspect_app web/quantum-notepad.html ;;
        dash|dashboard)
            inspect_app web/github-dashboard.html ;;
        sponsor)
            inspect_app web/sponsor.html
            inspect_app web/quantum-gutter.html ;;
        gutter)
            inspect_app web/quantum-gutter.html ;;
        research|lab)
            inspect_app web/research-lab.html ;;
        blackwell|gpu)
            inspect_app web/blackwell.html ;;
        hexcast)
            inspect_app web/hexcast.html ;;
        hexbench|bench)
            inspect_app web/hexbench.html ;;
        archflow|arch)
            inspect_app web/archflow.html ;;
        all)
            local count=0
            for f in web/*.html; do
                inspect_app "$f"
                count=$((count + 1))
            done
            info "Inspected ${count} apps"
            ;;
        *)
            if [ -f "web/${target}.html" ]; then
                inspect_app "web/${target}.html"
            elif [ -f "web/${target}" ]; then
                inspect_app "web/${target}"
            else
                fail "Unknown app: ${target}"
            fi
            ;;
    esac

    ok "Inspect done"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GOLD — verify gold standard files exist
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd_gold() {
    hdr "Gold Standard Check"

    local gold_files=(
        # TypeScript
        "web/quantum-prefixes.d.ts"
        "web/wasm-loader.ts"
        "tsconfig.json"
        # Shared CSS
        "web/quantum-theme.css"
        # Rust/Tauri IPC
        "src-tauri/src/prefix_engine.rs"
        # Go bridge
        "src/bridge/main.go"
        "src/bridge/go.mod"
        # WGSL shader
        "src/shaders/prefix-classify.wgsl"
        # Nushell scripts
        "scripts/build.nu"
        "scripts/test.nu"
        "scripts/audit.nu"
        "scripts/pre.nu"
        # Shell automation
        "scripts/build-wasm.sh"
        "scripts/version-sync.sh"
        "scripts/pre.sh"
        # CI/CD
        ".github/workflows/ci.yml"
        ".github/workflows/health.yml"
        # Hooks + config
        ".pre-commit-config.yaml"
        ".github/cliff.toml"
        # Cursor rules
        ".cursor/rules/auto-tasks.mdc"
    )

    local found=0
    local missing=0
    for f in "${gold_files[@]}"; do
        if [ -f "$f" ]; then
            ok "$f"
            found=$((found + 1))
        else
            fail "MISSING: $f"
            missing=$((missing + 1))
        fi
    done

    info "${found} found, ${missing} missing out of ${#gold_files[@]} gold standard files"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# README — quick audit
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd_readme() {
    hdr "README Check"

    if [ ! -f "README.md" ]; then
        fail "README.md not found"
        return
    fi

    # Version badge
    if grep -q 'v4\.' README.md; then
        ok "Version badge present"
    else
        warn "Version badge may be outdated"
    fi

    # Tech stack badges
    local badges=0
    for lang in Rust Tauri Python JavaScript WASM HTML5 CSS3 Shell; do
        if grep -qi "$lang" README.md; then
            badges=$((badges + 1))
        fi
    done
    if [ $badges -ge 6 ]; then
        ok "Tech stack badges: ${badges}/8"
    else
        warn "Tech stack badges: ${badges}/8 (some missing)"
    fi

    # Architecture section
    if grep -q "crates/prefix-engine" README.md; then
        ok "Architecture section includes gold standard structure"
    else
        warn "Architecture section may need updating"
    fi

    # Gold standard workflow section
    if grep -q "Gold Standard" README.md; then
        ok "Gold Standard Workflow section present"
    else
        warn "No Gold Standard Workflow section in README"
    fi

    local lines
    lines=$(wc -l < README.md | tr -d ' ')
    info "README: ${lines} lines"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PUSH — stage, commit, push
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd_push() {
    local msg="${1:-}"
    hdr "Push"

    if [ -z "$msg" ]; then
        # Auto-generate message from changes
        local modified untracked
        modified=$(git diff --name-only HEAD 2>/dev/null | wc -l | tr -d ' ')
        untracked=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
        msg="update: ${modified} modified, ${untracked} new files"
    fi

    info "Staging all changes..."
    git add -A

    info "Committing: ${msg}"
    git commit -m "$msg"

    local branch
    branch=$(git branch --show-current)
    info "Pushing to origin/${branch}..."
    git push -u origin "$branch"

    ok "Pushed to origin/${branch}"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PRE — full pre-push audit (folder + readme + inspect + gold)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cmd_pre() {
    hdr "uvspeed pre-push audit (v4.2)"
    cmd_folder
    cmd_readme
    cmd_inspect all
    cmd_gold

    echo ""
    if [ $ERRORS -gt 0 ]; then
        echo -e "${R}${BOLD}  ${ERRORS} errors found — fix before pushing${W}"
        exit 1
    else
        echo -e "${G}${BOLD}  All checks passed — ready to push${W}"
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Dispatch
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

run_commands() {
    local did_something=false
    local do_push=false
    local push_msg=""

    while [ $# -gt 0 ]; do
        case "$1" in
            pre)       cmd_pre; did_something=true; shift ;;
            folder)    cmd_folder; did_something=true; shift ;;
            readme)    cmd_readme; did_something=true; shift ;;
            inspect)
                shift
                # Check if next arg is an app name (not another command)
                if [ $# -gt 0 ] && [[ ! "$1" =~ ^(pre|folder|readme|inspect|gold|push|help)$ ]]; then
                    cmd_inspect "$1"; shift
                else
                    cmd_inspect all
                fi
                did_something=true
                ;;
            gold)      cmd_gold; did_something=true; shift ;;
            push)
                do_push=true
                shift
                # Check if next arg is a commit message (quoted string)
                if [ $# -gt 0 ] && [[ ! "$1" =~ ^(pre|folder|readme|inspect|gold|push|help)$ ]]; then
                    push_msg="$1"; shift
                fi
                did_something=true
                ;;
            help|-h|--help)
                echo "⚛ uvspeed pre-push checklist"
                echo ""
                echo "Usage: bash scripts/pre.sh [commands...]"
                echo ""
                echo "Commands:"
                echo "  pre                  Full audit (folder + readme + inspect + gold)"
                echo "  folder               Git status + stale file check"
                echo "  readme               README health check"
                echo "  inspect [app]        Health check apps (all, notepad, dash, sponsor, etc.)"
                echo "  gold                 Verify gold standard files exist"
                echo "  push [msg]           Stage + commit + push"
                echo ""
                echo "Combos:"
                echo "  pre push             Full audit then push"
                echo '  folder inspect push "v4.2 gold standard"'
                echo '  inspect notepad      Just check notepad'
                echo ""
                echo "App shortcuts: notepad, dash, sponsor, gutter, research, blackwell,"
                echo "  hexcast, hexbench, arch, all"
                exit 0
                ;;
            *)
                echo "Unknown command: $1 — try: bash scripts/pre.sh help"
                exit 1
                ;;
        esac
    done

    # Push at the end if requested
    if $do_push; then
        if [ $ERRORS -gt 0 ]; then
            echo -e "\n${R}${BOLD}  ${ERRORS} errors found — aborting push${W}"
            exit 1
        fi
        cmd_push "$push_msg"
    fi

    if ! $did_something; then
        cmd_pre
    fi
}

run_commands "$@"
