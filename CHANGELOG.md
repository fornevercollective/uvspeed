<!-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n} -->

# Changelog

All notable changes to uvspeed are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-11

### Added
- **Cross-project integration** — ChartGPU, Day CLI, Quest Hub, Jawta, Lark, Media Pipeline
- **ChartGPU proxy** — `/api/chartgpu/*` endpoints for WebGPU metrics, AI trend analysis
- **Day CLI tools** — `/api/day/kbatch`, `/api/day/signal`, `/api/day/geokey`, `/api/day/youtube`
- **Quest device management** — `/api/quest/*` proxy to synced-app Hub, ADB device detection
- **Jawta signal intel** — `/api/jawta/signal`, `/api/jawta/audio` with spectrum analysis
- **Media pipeline** — `/api/media/process` orchestrator (transcript, audio, video, spatial)
- **Tools registry** — `src/commands.json` with 23 commands across 5 groups
- **Tools dropdown** — 14-tool command palette in notepad footer
- **Quest status indicator** — header badge with Hub + ADB connectivity
- **Quantum thermal visualization** — sidebar tab with lattice/flow/GPU-vs-qubit modes
- **HF Fax / Hex Stream viewer** — color/gray/fax modes, 1080x1080 overlay
- **GitHub Actions** — Pages deploy workflow, tagged release workflow
- **`.gitattributes`** — Linguist overrides for accurate language stats
- **PyPI packaging** — proper `pyproject.toml` with classifiers, deps, entry points

### Changed
- Bridge server version bumped to 2.1.0 (40+ endpoints, up from 25)
- `package.json` updated with npm metadata (homepage, repo, bugs)
- `.gitignore` now excludes `node_modules/` and `package-lock.json`
- README rewritten with 12 organized screenshots, live demo link, Phase 2.1

### Fixed
- Language stats on GitHub were inflated by tracked `node_modules/` (6,304 files)
- Duplicate files in `src/p0-core/` marked as `linguist-vendored`

## [2.0.0] - 2026-02-11

### Added
- **Security scanner** — prefix-aware static analysis (Python/JS/Shell), severity scoring
- **Git pre-commit hook** — auto-generated, blocks high-risk commits, checks beyondBINARY headers
- **PR diff reports** — markdown reports with prefix-category breakdown
- **Multi-IDE configs** — Cursor (.mdc rules + skills), Copilot, VS Code, Windsurf
- **Quantum-organized folder structure** — `src/` directories mapped to prefix categories
- **91+ files prefixed** — batch header stamper via `tools/prefix_all_files.py`
- 25 API endpoints on bridge server

## [1.0.0] - 2026-02-10

### Added
- **Quantum prefix system** — 9-symbol `{+1, 1, -1, +0, 0, -0, +n, n, -n}` for 20 languages
- **Web notepad** — `quantum-notepad.html` single-file app with infinite scroll cells
- **Quantum prefix gutter** — live visual column, color-coded, debounced, scroll-synced
- **Convert timeline bar** — auto-calibrates on edit, coverage %, segment distribution
- **Quantum navigation** — 3D code space [X=deps, Y=lines, Z=complexity]
- **Mermaid diagrams** — render, expand overlay, pan/zoom/drag, SVG export
- **Visual benchmarks** — 5-chart machine profiler
- **Bridge server** — WebSocket + HTTP with Python exec, AI inference, prefix engine
- **Electron app** — desktop wrapper with quantum navigation
- **Undo/redo** — 50-state history
- **Stream history** — quantum trace log with pipe in/out

[2.1.0]: https://github.com/fornevercollective/uvspeed/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/fornevercollective/uvspeed/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/fornevercollective/uvspeed/releases/tag/v1.0.0
