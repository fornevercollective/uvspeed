# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Nushell audit script — project health, dependencies, code stats

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Code statistics
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main [] {
  print "⚛ uvspeed project audit"
  print ""

  # Count files by language
  let stats = [
    { lang: "Rust",       glob: "**/*.rs",   exclude: "target" }
    { lang: "Python",     glob: "**/*.py",   exclude: ".venv" }
    { lang: "JavaScript", glob: "**/*.js",   exclude: "node_modules" }
    { lang: "TypeScript",  glob: "**/*.ts",   exclude: "node_modules" }
    { lang: "HTML",       glob: "web/*.html", exclude: "" }
    { lang: "CSS",        glob: "**/*.css",  exclude: "node_modules" }
    { lang: "Shell",      glob: "**/*.sh",   exclude: "" }
    { lang: "Nushell",    glob: "**/*.nu",   exclude: "" }
    { lang: "Go",         glob: "**/*.go",   exclude: "" }
    { lang: "WGSL",       glob: "**/*.wgsl", exclude: "" }
    { lang: "TOML",       glob: "**/*.toml", exclude: "target" }
    { lang: "YAML",       glob: "**/*.yml",  exclude: "" }
    { lang: "Markdown",   glob: "**/*.md",   exclude: "" }
  ]

  mut rows = []
  for s in $stats {
    let files = (glob $s.glob | where { |f| not ($f | str contains "07-archive") })
    let count = ($files | length)
    if $count > 0 {
      $rows = ($rows | append { language: $s.lang, files: $count })
    }
  }

  $rows | sort-by files -r | table

  print ""

  # Web app count
  let apps = (ls web/*.html | length)
  print $"Web apps: ($apps)"

  # Git info
  let branch = (git branch --show-current | str trim)
  let commits = (git rev-list --count HEAD | str trim)
  print $"Branch: ($branch) (($commits) commits)"

  # Disk
  let disk = (df -h / | lines | last | split column -r '\s+' | first)
  print $"Disk: ($disk.column4) used of ($disk.column2)"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health check — verify key dependencies
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main health" [] {
  print "⚛ Health checks"
  print ""

  let checks = [
    { name: "Rust",        cmd: "rustc --version" }
    { name: "Cargo",       cmd: "cargo --version" }
    { name: "Node",        cmd: "node --version" }
    { name: "Python 3.13", cmd: "python3.13 --version" }
    { name: "uv",          cmd: "uv --version" }
    { name: "rg",          cmd: "rg --version" }
    { name: "fd",          cmd: "fd --version" }
    { name: "bat",         cmd: "bat --version" }
    { name: "jq",          cmd: "jq --version" }
  ]

  for check in $checks {
    try {
      let ver = (nu -c $check.cmd | str trim | lines | first)
      print $"  ✓ ($check.name): ($ver)"
    } catch {
      print $"  ✗ ($check.name): not found"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Version consistency check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main versions" [] {
  print "⚛ Version consistency"
  print ""

  let py_ver = (open pyproject.toml | get project.version)
  let tauri_ver = (open src-tauri/Cargo.toml | get package.version)
  let engine_ver = (open crates/prefix-engine/Cargo.toml | get package.version)

  let versions = [
    { source: "pyproject.toml", version: $py_ver }
    { source: "src-tauri/Cargo.toml", version: $tauri_ver }
    { source: "crates/prefix-engine/Cargo.toml", version: $engine_ver }
  ]

  $versions | table

  # Check if all match
  let unique = ($versions | get version | uniq | length)
  if $unique > 1 {
    print "  ⚠ Versions are NOT consistent!"
  } else {
    print "  ✓ All versions match"
  }
}
