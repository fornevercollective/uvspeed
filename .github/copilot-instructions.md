# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}

# GitHub Copilot Instructions — uvspeed Quantum Prefix System

## Core Concept

All code in this project uses the **11-symbol quantum prefix system (9 core + 2 extended)** for dimensional code addressing.
Every line of code gets a prefix that classifies its structural role, replacing binary `{0, 1}` with `{+1, 1, -1, +0, 0, -0, +n, n, -n}`.

## The 11 Symbols

| Prefix | Category   | Meaning                             | Weight |
|--------|------------|-------------------------------------|--------|
| `n:`   | shebang    | Entry points, shebangs              | +0.7   |
| `+1:`  | comment    | Comments, documentation, decorators | +0.3   |
| `-n:`  | import     | Imports, includes, requires         | +0.85  |
| `+0:`  | class      | Class, struct, type, enum defs      | +1.0   |
| `0:`   | function   | Function, method definitions        | +0.9   |
| `-1:`  | error      | Error handling, try/catch/raise     | -0.8   |
| `+n:`  | condition  | If/else/switch/match conditionals   | +0.6   |
| `+2:`  | loop       | For/while/repeat loops              | +0.7   |
| `-0:`  | return     | Return/yield statements             | +0.4   |
| `+3:`  | output     | Print/echo/log/render output        | +0.5   |
| `1:`   | variable   | Variable declarations/assignments   | +0.5   |

## Rules for Copilot

1. When writing or editing code, mentally classify each line by its prefix
2. When showing code examples, include prefix annotations as comments
3. When reviewing code, note which prefix categories changed
4. All 20 supported languages use the same 11-symbol system
5. Every new file should include the header: `# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}`

## Supported Languages (20)

python, javascript, typescript, rust, go, c, shell, html, css,
java, swift, kotlin, ruby, yaml, toml, sql, dockerfile, nushell, zig, assembly

## Quantum Weight Formula

```
Q_w(line) = P_prefix × D_depth × C_context × S_semantic
```

Where:
- **P_prefix** = quantum prefix symbol mapped to weight [-1.0 … +1.0]
- **D_depth** = indentation depth / structural nesting level (normalized 0…1)
- **C_context** = contextual relevance to 3D position [X=deps, Y=lines, Z=complexity]
- **S_semantic** = semantic role weight (import=0.9, function=1.0, comment=0.3)

## Project Architecture

- `web/quantum-notepad.html` — Main UI (notepad, gutter, timeline, inspect)
- `quantum_bridge_server.py` — Backend (25 API endpoints, security, git hooks)
- `.cursor/rules/quantum-prefix-gutter.mdc` — Cursor IDE rule
- `tools/prefix_all_files.py` — Batch prefix header stamper
- `electron-app/` — Desktop application

## API Endpoints (25)

POST /api/execute, POST /api/prefix, POST /api/prefix/file, GET /api/cells,
POST /api/cells, POST /api/navigate, POST /api/diff, POST /api/ai,
GET /api/ai/models, GET /api/agents, POST /api/agents, POST /api/agents/send,
GET /api/agents/log, GET /api/sessions, POST /api/sessions,
GET /api/sessions/{id}, POST /api/roadmap/scan, POST /api/roadmap/convert,
GET /api/languages, POST /api/security/scan, GET /api/security/rules,
GET /api/git/hook, POST /api/git/hook/install, POST /api/git/diff-report,
GET /api/status
