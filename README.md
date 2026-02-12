<!-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n} -->

# uvspeed — Quantum beyondBINARY Notepad

> A new code architecture paradigm that replaces binary `{0, 1}` with a 9-symbol directional prefix system `{+1, 1, -1, +0, 0, -0, +n, n, -n}`, enabling any codebase — in any language — to be structurally re-addressed in 3D space.

[![Phase](https://img.shields.io/badge/Phase_2-Complete-brightgreen)](#phase-tracking)
[![Languages](https://img.shields.io/badge/Languages-20_supported-blue)](#language-support)
[![Endpoints](https://img.shields.io/badge/API-25_endpoints-purple)](#api-surface)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Phase Tracking

| Phase | Status | Milestone | Date |
|-------|--------|-----------|------|
| **Phase 1** | ✅ Complete | Structural Bootstrap — prefix system, notepad UI, navigation, mermaid | Feb 10 |
| **Phase 2** | ✅ Complete | Execution Bridge — 25 API endpoints, security scanner, git hooks, IDE rules | Feb 11 |
| **Phase 3** | ⬜ Next | Agent Orchestration — multi-agent protocol, role-based prefix access | — |
| **Phase 4** | ⬜ Future | Production & Scale — CUDA-Q offload, real-time collab, SaaS deploy | — |

### Agent-Ready Capabilities (5/6 shipped)

| Capability | Status | Details |
|------------|--------|---------|
| Real-time execution | ✅ LIVE | WebSocket bridge (`ws://8086`) + HTTP API (`:8085`) + Python exec + shell + uv run |
| Agent API surface | ✅ LIVE | 25 endpoints: execute, prefix, diff, AI, agents, sessions, security, git |
| AI code review | ✅ LIVE | Prefix-aware diff engine + multi-model AI (tinygrad/Ollama/OpenAI/Anthropic) |
| Security scanning | ✅ LIVE | Prefix-aware static analysis (Python/JS/Shell), severity scoring, `/api/security/scan` |
| PR / diff automation | ✅ LIVE | Git pre-commit hook + PR-ready quantum diff reports, `/api/git/hook/install` |
| Multi-agent orchestration | ⬜ Phase 3 | 5 agents registered — inter-agent protocol pending |

---

## Benchmark Metrics

### Language Prefix Coverage (20 supported, 14 planned)

Sorted by quantum/AI/LLM relevance:

**Tier 1 — Quantum / AI / LLM / tinygrad**
| Language | Coverage | Prefixes | AI/ML Relevance |
|----------|----------|----------|-----------------|
| Python | 98% | 9/9 | tinygrad, torch, jax, micrograd |
| C / C++ | 91% | 9/9 | llama.cpp, ggml, CUDA, onnxruntime |
| Rust | 94% | 9/9 | candle, burn, nushell |
| Zig | 90% | 9/9 | ghostty, bun, tinygrad backend |
| Go | 93% | 9/9 | ollama, k8s, charm |
| JavaScript | 96% | 9/9 | transformers.js, onnx web |
| TypeScript | 95% | 9/9 | langchain, vercel ai sdk |

**Tier 2 — Systems / Enterprise**
| Language | Coverage | Prefixes | Domain |
|----------|----------|----------|--------|
| Java | 92% | 9/9 | deeplearning4j, spark ML |
| Swift | 91% | 9/9 | CoreML, MLX, Vision |
| Kotlin | 90% | 9/9 | Android, KMP |
| Ruby | 89% | 9/9 | Rails ecosystem |
| Shell | 90% | 9/9 | bash, zsh, CI/CD |
| Nushell | 87% | 8/9 | Structured data shell |
| HTML/CSS | 88% | 8/9 | Web, DOM, WASM host |

**Tier 3 — Config / Data**
| Language | Coverage | Prefixes | Domain |
|----------|----------|----------|--------|
| SQL | 82% | 8/9 | DuckDB, SQLite, Postgres |
| YAML/TOML | 78% | 7/9 | k8s, pyproject, Cargo |
| Dockerfile | 76% | 7/9 | Containers, CI |
| Assembly | 68% | 6/9 | x86, ARM, RISC-V |

**Planned** (14): Elixir, Julia, Scala, Clojure, Nim, C#, PHP, Erlang, Crystal, PowerShell, Haskell, WASM, CoffeeScript, MicroPython

### Quantum Weight Formula

```
Q_w(line) = P_prefix × D_depth × C_context × S_semantic
```

| Variable | Description | Range |
|----------|-------------|-------|
| P_prefix | Quantum prefix symbol → weight | -1.0 … +1.0 |
| D_depth | Indentation / nesting level | 0 … 1 |
| C_context | Relevance to 3D position [X=deps, Y=lines, Z=complexity] | 0 … 1 |
| S_semantic | Semantic role weight | 0.3 … 1.0 |

---

## The 9-Symbol Prefix System

```
  n:  shebang     Entry points, shebangs               (+0.7)
 +1:  comment     Comments, documentation, decorators   (+0.3)
 -n:  import      Imports, includes, requires           (+0.85)
 +0:  class       Class, struct, type, enum defs        (+1.0)
  0:  function    Function, method definitions          (+0.9)
 -1:  error       Error handling, try/catch/raise       (-0.8)
 +n:  condition   If/else/switch/match conditionals     (+0.6)
 +2:  loop        For/while/repeat loops                (+0.7)
 -0:  return      Return/yield statements               (+0.4)
 +3:  output      Print/echo/log/render output          (+0.5)
  1:  variable    Variable declarations/assignments     (+0.5)
```

### Example: Python with Prefixes

```python
# n:   1  #!/usr/bin/env python3
# +1:  2  # Quantum computation module
# -n:  3  import numpy as np
# -n:  4  from tinygrad.tensor import Tensor
#      5
# +0:  6  class QuantumState:
# +1:  7      """Represents a quantum state vector."""
#      8
# 0:   9      def __init__(self, qubits=3):
# 1:  10          self.n = qubits
# 1:  11          self.state = Tensor.randn(2 ** qubits)
#     12
# 0:  13      def normalize(self):
# -0: 14          return self.state / self.state.norm()
#     15
# 0:  16      def measure(self):
# -1: 17          try:
# 1:  18              probs = (self.state ** 2).numpy()
# -0: 19              return probs
# -1: 20          except Exception as e:
# +3: 21              print(f"Measurement error: {e}")
```

---

## Quick Start

### Web Notepad (zero install)
```bash
open web/quantum-notepad.html
```

### Bridge Server (25 API endpoints)
```bash
uv run python quantum_bridge_server.py
# HTTP on :8085 · WebSocket on :8086
```

### Electron Desktop App
```bash
npm install && npm start
```

### Progressive Terminal
```bash
./launch-progressive.sh          # Interactive version select
./launch-progressive.sh v1       # Basic quantum numbering
./launch-progressive.sh v2       # AI terminal + 3D navigation
./launch-progressive.sh v3       # Full environment
```

---

## API Surface (25 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Server status |
| POST | `/api/execute` | Execute code (Python/shell/uv) |
| POST | `/api/prefix` | Convert code to quantum-prefixed |
| POST | `/api/prefix/file` | Prefix a file |
| GET | `/api/cells` | List notebook cells |
| POST | `/api/cells` | Create cell |
| POST | `/api/navigate` | Move through 3D code space |
| POST | `/api/diff` | Prefix-aware structural diff |
| POST | `/api/ai` | AI inference (tinygrad/Ollama/OpenAI/Anthropic) |
| GET | `/api/ai/models` | List AI models |
| GET | `/api/agents` | List registered agents |
| POST | `/api/agents` | Register agent |
| POST | `/api/agents/send` | Send message to agent |
| GET | `/api/agents/log` | Agent message log |
| GET | `/api/sessions` | List saved sessions |
| POST | `/api/sessions` | Save session |
| GET | `/api/sessions/{id}` | Load session |
| POST | `/api/roadmap/scan` | Scan codebase for conversion |
| POST | `/api/roadmap/convert` | Batch prefix-convert directory |
| GET | `/api/languages` | List supported languages |
| POST | `/api/security/scan` | Security scan (code/file/directory) |
| GET | `/api/security/rules` | List security rules |
| GET | `/api/git/hook` | View pre-commit hook |
| POST | `/api/git/hook/install` | Install quantum pre-commit hook |
| POST | `/api/git/diff-report` | PR-ready quantum diff report |

---

## IDE Support

| IDE | Config File | Status |
|-----|-------------|--------|
| **Cursor** | `.cursor/rules/quantum-prefix-gutter.mdc` | ✅ Always-on rule |
| **Cursor** | `.cursor/rules/quantum-commands.mdc` | ✅ API commands |
| **Cursor** | `.cursor/skills/quantum-prefix-skill.md` | ✅ Conversion skill |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Training instructions |
| **VS Code** | `.vscode/settings.json` | ✅ Project settings |
| **Windsurf** | `.windsurf/rules/quantum-prefix.md` | ✅ AI rule |

---

## Project Structure

```
uvspeed/
├── web/quantum-notepad.html      # +0: Main UI (344 KB) — notepad, gutter, timeline, inspect
├── quantum_bridge_server.py      #  0: Backend (68 KB) — 25 API endpoints
├── .cursor/rules/                # +1: IDE rules (prefix gutter, commands)
├── .cursor/skills/               # +1: IDE skills (prefix conversion)
├── .github/copilot-instructions.md  # +1: Copilot training
├── .windsurf/rules/              # +1: Windsurf AI rule
├── tools/prefix_all_files.py     #  0: Batch prefix stamper (91+ files)
├── electron-app/                 # +0: Desktop app (Electron)
├── src/                          #     Quantum-organized by prefix:
│   ├── n-entry/                  #  n: Launchers, entry scripts
│   ├── p1-docs/                  # +1: Documentation, config
│   ├── mn-deps/                  # -n: Dependency manifests
│   ├── p0-core/                  # +0: Core application files
│   ├── z-functions/              #  0: Tools, utilities
│   ├── m1-tests/                 # -1: Test scripts
│   ├── pn-platforms/             # +n: Platform-specific builds
│   ├── p2-versions/              # +2: Version snapshots
│   ├── m0-output/                # -0: Build output
│   └── MANIFEST.md               #     AI navigation index
├── versions/                     # +2: Progressive v1/v2/v3
├── quantum/                      #  0: Core quantum handlers
└── shared/                       # +1: Shared configs
```

---

## Architecture

```
Zig (Ghostty) → Rust (Nushell/uv) → Semantic (GrepAI) → Visual (Charm + Mermaid)
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | uv + Python 3.13 | Ultra-fast package management |
| Backend | quantum_bridge_server.py | 25-endpoint HTTP + WebSocket server |
| Frontend | quantum-notepad.html | Single-file 344KB web app |
| Desktop | Electron | Native app with quantum navigation |
| AI | tinygrad / Ollama / OpenAI / Anthropic | Multi-model inference |
| Security | SecurityScanner | Prefix-aware static analysis |
| Git | GitHookEngine | Pre-commit hooks + PR diff reports |

---

## Shipped Features (Phase 1 + 2)

- **Quantum Prefix Gutter** — live visual column in every cell, 9-symbol classification, color-coded, debounced 100ms, scroll-synced
- **Convert Timeline Bar** — auto-calibrates on paste/edit, shows coverage %, segment distribution, per-language stats
- **Quantum Navigation** — 3D code space [X=deps, Y=lines, Z=complexity] with layer up/down, versioned grid labels
- **Mermaid Diagrams** — render, expand overlay, pan/zoom/drag, fit-to-view, SVG export
- **Visual Benchmarks** — 5-chart machine profiler (Math, DOM, Canvas, JSON, CDN trace)
- **Security Scanner** — prefix-aware static analysis across Python/JS/Shell with severity scoring
- **Git Pre-Commit Hook** — auto-generated, blocks high-risk commits, checks beyondBINARY headers
- **PR Diff Reports** — markdown reports with prefix-category breakdown for GitHub PRs
- **Undo/Redo** — 50-state history with keyboard shortcuts
- **Stream History** — quantum trace log with pipe in/out capability
- **Execution Progress Bar** — percentage fill with elapsed time for Run All and commands
- **6 IDE Configs** — Cursor (rules + skills), Copilot, VS Code, Windsurf
- **91+ files prefixed** — every source file carries the beyondBINARY header

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
<code>{+1, 1, -1, +0, 0, -0, +n, n, -n}</code><br>
<strong>beyondBINARY</strong> — quantum-prefixed code architecture
</p>
