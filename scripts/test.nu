# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Nushell test runner — structured test pipeline for uvspeed

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test suites
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let suites = [
  { name: "rust",   cmd: "cargo test --manifest-path crates/prefix-engine/Cargo.toml",  desc: "Prefix engine unit tests" }
  { name: "python", cmd: "python3.13 -m pytest -x -q",                                  desc: "Python test suite" }
  { name: "prefix", cmd: "nu scripts/validate-prefixes.nu",                              desc: "Quantum prefix header validation" }
  { name: "health", cmd: "nu scripts/audit.nu health",                                   desc: "App health checks" }
]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main test runner
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main [
  suite?: string  # Test suite (rust, python, prefix, health, all)
] {
  let s = if ($suite == null) { "all" } else { $suite }

  print $"⚛ uvspeed test — suite: ($s)"
  print ""

  let to_run = if $s == "all" {
    $suites
  } else {
    $suites | where name == $s
  }

  if ($to_run | length) == 0 {
    print $"Unknown suite: ($s)"
    print $"Available: ($suites | get name | str join ', '), all"
    return
  }

  mut passed = 0
  mut failed = 0
  mut results = []

  for test in $to_run {
    print $"  ▸ ($test.name) — ($test.desc)"
    let start = (date now)
    try {
      nu -c $test.cmd
      let elapsed = ((date now) - $start)
      print $"    ✓ passed (($elapsed))"
      $passed = $passed + 1
      $results = ($results | append { name: $test.name, status: "pass", time: $elapsed })
    } catch {|e|
      let elapsed = ((date now) - $start)
      print $"    ✗ FAILED: ($e.msg)"
      $failed = $failed + 1
      $results = ($results | append { name: $test.name, status: "FAIL", time: $elapsed })
    }
  }

  print ""
  print $"Results: ($passed) passed, ($failed) failed"
  $results | table
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Rust benchmark
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main bench" [] {
  print "⚛ Running prefix-engine benchmarks..."
  cargo bench --manifest-path crates/prefix-engine/Cargo.toml
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Quick smoke test — verify all 20 HTML apps parse
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def "main smoke" [] {
  print "⚛ Smoke test — checking all web apps..."
  let apps = (ls web/*.html | get name)

  mut ok = 0
  mut bad = 0

  for app in $apps {
    let content = (open $app)
    let has_doctype = ($content | str contains "<!DOCTYPE")
    let has_script = ($content | str contains "<script")
    let has_qp = ($content | str contains "quantum-prefixes")

    if $has_doctype and $has_script {
      $ok = $ok + 1
    } else {
      print $"  ✗ ($app) — missing DOCTYPE or script tags"
      $bad = $bad + 1
    }
  }

  print $"  ($ok)/($ok + $bad) apps OK"
}
