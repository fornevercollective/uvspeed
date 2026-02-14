# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Nushell build script — structured data pipeline for uvspeed builds

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build targets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let targets = [
  { name: "web",    cmd: "cp -r web/* tauri-dist/",                  desc: "Copy web assets to tauri-dist" }
  { name: "tauri",  cmd: "cargo tauri build --bundles app",          desc: "Build Tauri desktop app" }
  { name: "wasm",   cmd: "bash scripts/build-wasm.sh",              desc: "Compile prefix-engine to WASM" }
  { name: "python", cmd: "uv build",                                 desc: "Build Python wheel" }
  { name: "rust",   cmd: "cargo build --release",                    desc: "Build Rust crates (native)" }
]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main build command
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main [
  target?: string  # Build target (web, tauri, wasm, python, rust, all)
] {
  let t = if ($target == null) { "all" } else { $target }

  print $"⚛ uvspeed build — target: ($t)"
  print ""

  let to_build = if $t == "all" {
    $targets
  } else {
    $targets | where name == $t
  }

  if ($to_build | length) == 0 {
    print $"Unknown target: ($t)"
    print $"Available: ($targets | get name | str join ', '), all"
    return
  }

  # Ensure tauri-dist exists
  mkdir tauri-dist

  for build in $to_build {
    print $"  ▸ ($build.name) — ($build.desc)"
    let start = (date now)
    try {
      nu -c $build.cmd
      let elapsed = ((date now) - $start)
      print $"    ✓ done (($elapsed))"
    } catch {|e|
      print $"    ✗ failed: ($e.msg)"
    }
  }

  print ""
  print "⚛ Build complete"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Version info
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main version" [] {
  let versions = {
    pyproject: (open pyproject.toml | get project.version)
    cargo_tauri: (open src-tauri/Cargo.toml | get package.version)
    cargo_engine: (open crates/prefix-engine/Cargo.toml | get package.version)
    sw_cache: (open web/sw.js | lines | where ($it | str contains "CACHE_NAME") | first | str replace -r ".*'(.*)'.*" "$1")
  }

  $versions | table
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# List all web apps
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main apps" [] {
  ls web/*.html
    | select name size modified
    | sort-by name
    | rename file size updated
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Clean build artifacts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main clean" [] {
  let dirs = ["tauri-dist" "target" "dist" "__pycache__"]
  for d in $dirs {
    if ($d | path exists) {
      rm -rf $d
      print $"  ✓ removed ($d)/"
    }
  }
  print "Clean complete"
}
