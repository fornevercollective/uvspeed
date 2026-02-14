# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Nushell pre-push checklist
# Usage:
#   nu scripts/pre.nu              # full audit (folder + inspect + gold)
#   nu scripts/pre.nu folder       # git status + stale files
#   nu scripts/pre.nu inspect      # health check all 19 apps
#   nu scripts/pre.nu gold         # verify gold standard files
#   nu scripts/pre.nu readme       # README check

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Full pre-push audit
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main [] {
  print "⚛ uvspeed pre-push audit"
  main folder
  main inspect
  main gold
  main readme
  print ""
  print "✓ Pre-push audit complete"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FOLDER — git status + stale file check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main folder" [] {
  print ""
  print "⚛ Folder Check"

  let modified = (git diff --name-only HEAD | lines | length)
  let untracked = (git ls-files --others --exclude-standard | lines | length)
  let branch = (git branch --show-current | str trim)

  print $"  · Modified:  ($modified) files"
  print $"  · Untracked: ($untracked) files"
  print $"  · Branch:    ($branch)"

  # Stale file check
  if ("web/quantum-prefix.js" | path exists) {
    print "  ✗ Stale: web/quantum-prefix.js (should be quantum-prefixes.js)"
  } else {
    print "  ✓ No stale files"
  }

  # Ahead of remote
  try {
    let ahead = (git rev-list --count "@{upstream}..HEAD" | str trim | into int)
    if $ahead > 0 {
      print $"  ⚠ Ahead of remote by ($ahead) commits"
    } else {
      print "  ✓ Up to date with remote"
    }
  } catch {
    print "  · No upstream set"
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INSPECT — structural health check for web apps
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main inspect" [
  app?: string  # App name filter (notepad, dash, sponsor, gutter, all)
] {
  print ""
  print "⚛ Inspect Apps"

  let target = if ($app == null) { "all" } else { $app }

  let html_files = if $target == "all" {
    ls web/*.html | get name
  } else {
    let pattern = match $target {
      "notepad" => "quantum-notepad"
      "dash" | "dashboard" => "github-dashboard"
      "sponsor" => "sponsor"
      "gutter" => "quantum-gutter"
      "research" | "lab" => "research-lab"
      "blackwell" | "gpu" => "blackwell"
      "hexcast" => "hexcast"
      "hexbench" | "bench" => "hexbench"
      "arch" | "archflow" => "archflow"
      _ => $target
    }
    ls web/*.html | get name | where { |f| $f | str contains $pattern }
  }

  mut pass = 0
  mut fail = 0

  for file in $html_files {
    let name = ($file | path basename)
    let content = (open $file --raw)
    mut issues = []

    if not ($content | str contains "<!DOCTYPE html>") {
      $issues = ($issues | append "DOCTYPE")
    }
    if not ($content | str contains "</html>") {
      $issues = ($issues | append "</html>")
    }
    if not ($content | str contains "</head>") {
      $issues = ($issues | append "</head>")
    }
    if not ($content | str contains "</body>") {
      $issues = ($issues | append "</body>")
    }
    if not ($content | str contains "quantum-prefixes.js") {
      $issues = ($issues | append "quantum-prefixes.js")
    }
    if not ($content | str contains "sw.js") {
      $issues = ($issues | append "sw.js")
    }

    if ($issues | length) > 0 {
      print $"  ✗ ($name): missing ($issues | str join ', ')"
      $fail = $fail + 1
    } else {
      print $"  ✓ ($name)"
      $pass = $pass + 1
    }
  }

  print $"  · ($pass) passed, ($fail) failed out of ($html_files | length) apps"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GOLD — verify gold standard files exist
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main gold" [] {
  print ""
  print "⚛ Gold Standard Check"

  let gold = [
    "web/quantum-prefixes.d.ts"
    "web/wasm-loader.ts"
    "tsconfig.json"
    "web/quantum-theme.css"
    "src-tauri/src/prefix_engine.rs"
    "src/bridge/main.go"
    "src/bridge/go.mod"
    "src/shaders/prefix-classify.wgsl"
    "scripts/build.nu"
    "scripts/test.nu"
    "scripts/audit.nu"
    "scripts/pre.nu"
    "scripts/build-wasm.sh"
    "scripts/version-sync.sh"
    "scripts/pre.sh"
    ".github/workflows/ci.yml"
    ".github/workflows/health.yml"
    ".pre-commit-config.yaml"
    ".github/cliff.toml"
    ".cursor/rules/auto-tasks.mdc"
  ]

  mut found = 0
  mut missing = 0

  for f in $gold {
    if ($f | path exists) {
      $found = $found + 1
    } else {
      print $"  ✗ MISSING: ($f)"
      $missing = $missing + 1
    }
  }

  print $"  ✓ ($found)/($gold | length) gold standard files present"
  if $missing > 0 {
    print $"  ✗ ($missing) files missing"
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# README — check README health
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main readme" [] {
  print ""
  print "⚛ README Check"

  if not ("README.md" | path exists) {
    print "  ✗ README.md not found"
    return
  }

  let content = (open README.md --raw)
  let lines = ($content | lines | length)

  let checks = [
    { label: "Version badge",    pass: ($content | str contains "v4.") }
    { label: "Gold Standard",    pass: ($content | str contains "Gold Standard") }
    { label: "Architecture",     pass: ($content | str contains "crates/prefix-engine") }
    { label: "Tech badges (8)",  pass: ($content | str contains "WASM") }
  ]

  for c in $checks {
    if $c.pass {
      print $"  ✓ ($c.label)"
    } else {
      print $"  ✗ ($c.label)"
    }
  }

  print $"  · ($lines) lines"
}
