# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}

# Cursor Skill: Quantum Prefix Conversion

## When to Use

Use this skill when:
- Converting raw code to quantum-prefixed format
- Adding prefix gutters to new files
- Reviewing code changes with prefix-aware diffs
- Running security scans on prefixed code
- Installing git hooks for prefix validation

## Quick Reference

### Prefix Table
| Prefix | Category   | Color     |
|--------|------------|-----------|
| `n:`   | shebang    | red       |
| `+1:`  | comment    | green     |
| `-n:`  | import     | purple    |
| `+0:`  | class      | blue      |
| `0:`   | function   | blue      |
| `-1:`  | error      | red       |
| `+n:`  | condition  | yellow    |
| `+2:`  | loop       | orange    |
| `-0:`  | return     | yellow    |
| `+3:`  | output     | green     |
| `1:`   | variable   | white     |

### API Commands (via bridge at localhost:8085)

```bash
# Prefix code
curl -s -X POST http://localhost:8085/api/prefix \
  -H "Content-Type: application/json" \
  -d '{"code": "import os\nprint(\"hello\")", "language": "python"}'

# Security scan
curl -s -X POST http://localhost:8085/api/security/scan \
  -H "Content-Type: application/json" \
  -d '{"code": "eval(input())", "language": "python"}'

# Security scan directory
curl -s -X POST http://localhost:8085/api/security/scan \
  -H "Content-Type: application/json" \
  -d '{"directory": "."}'

# Install git pre-commit hook
curl -s -X POST http://localhost:8085/api/git/hook/install \
  -H "Content-Type: application/json" \
  -d '{"repo": "."}'

# Generate PR diff report
curl -s -X POST http://localhost:8085/api/git/diff-report \
  -H "Content-Type: application/json" \
  -d '{"old": "x = 1", "new": "x = 2\ny = 3", "language": "python"}'

# Prefix entire file
curl -s -X POST http://localhost:8085/api/prefix/file \
  -H "Content-Type: application/json" \
  -d '{"path": "quantum_bridge_server.py"}'

# Scan roadmap
curl -s -X POST http://localhost:8085/api/roadmap/scan \
  -H "Content-Type: application/json" \
  -d '{"directory": "."}'
```

### Start the Bridge Server
```bash
cd /Users/tref/uvspeed
uv run python quantum_bridge_server.py
# HTTP on :8085, WebSocket on :8086
```

### Stamp All Files with Header
```bash
python3 tools/prefix_all_files.py
```

## 20 Supported Languages

python, javascript, typescript, rust, go, c, shell, html, css,
java, swift, kotlin, ruby, yaml, toml, sql, dockerfile, nushell, zig, assembly
