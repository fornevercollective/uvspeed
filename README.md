<!-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n} -->

<p align="center">
<img src="icons/nyan-banner.png" alt="uvspeed — beyondBINARY quantum-prefixed development platform" width="100%">
</p>

> A development platform built on the beyondBINARY prefix system `{+1, 1, -1, +0, 0, -0, +n, n, -n}` — structurally addressing code in 9 dimensions across 20+ languages.

[![Version](https://img.shields.io/badge/v4.0-uvspeed-brightgreen)](#install)
[![Languages](https://img.shields.io/badge/Languages-20_supported-blue)](#quantum-prefix-system)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ff69b4)](https://github.com/sponsors/fornevercollective)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-GitHub_Pages-00c853)](https://fornevercollective.github.io/uvspeed/web/quantum-notepad.html)

**[Notepad](https://fornevercollective.github.io/uvspeed/web/quantum-notepad.html)** · **[Terminal](https://fornevercollective.github.io/uvspeed/web/terminal.html)** · **[brotherNumsy](https://fornevercollective.github.io/uvspeed/web/brothernumsy.html)** · **[kbatch](https://fornevercollective.github.io/uvspeed/web/kbatch.html)** · **[hexcast](https://fornevercollective.github.io/uvspeed/web/hexcast.html)** · **[Dashboard](https://fornevercollective.github.io/uvspeed/web/github-dashboard.html)** · **[Sponsor](https://fornevercollective.github.io/uvspeed/web/sponsor.html)**

---

## What's Inside

uvspeed is a collection of developer tools unified by the quantum prefix system. Everything runs in the browser (zero install) or as a native Tauri desktop app.

### Desktop App (Tauri)

The launcher opens three modes:

| Mode | Description |
|------|-------------|
| **Instance** | Full terminal (`hexterm`) with individual feed windows per stream |
| **Grid View** | Single-canvas multi-stream grid — click any cell to open as individual instance |
| **Web** | Opens browser PWA — works on phone, tablet, desktop |

Plus a `{dev}` launch mode that opens the terminal with the dev console active.

### Web Tools

| Tool | What it does |
|------|-------------|
| **[quantum-notepad](web/quantum-notepad.html)** | Code notepad with prefix gutter, 20-language support, mermaid diagrams, convert timeline |
| **[terminal (hexterm)](web/terminal.html)** | Full terminal emulator — virtual FS, hexcast, kbatch, device presets, sync, gutter |
| **[feed](web/feed.html)** | Lightweight video/audio feed window with speech-to-text transcript |
| **[grid](web/grid.html)** | Multi-stream canvas with 2x2/3x3/4x4 layout, device management, dev console |
| **[launcher](web/launcher.html)** | Mode picker + command console for controlling all connected devices |
| **[brotherNumsy](web/brothernumsy.html)** | Endless runner game with AI training API and FreyaUnits converter |
| **[kbatch](web/kbatch.html)** | Keyboard heatmap analyzer — thermal contrails, geometric patterns, WebSocket sync |
| **[hexcast](web/hexcast.html)** | Camera → hex video broadcast — 4 encode modes, latency benchmarks |
| **[hexcast-send](web/hexcast-send.html)** | Mobile PWA for streaming phone camera to a remote hexcast receiver |
| **[blackwell](web/blackwell.html)** | NVIDIA Blackwell data visualization + deploy targets (DGX Spark, Lambda) |
| **[questcast](web/questcast.html)** | Meta Quest broadcast + research tools |
| **[archflow](web/archflow.html)** | n8n-style architecture node visualizer |
| **[jawta-audio](web/jawta-audio.html)** | Spatial audio + Strudel live coding |
| **[research-lab](web/research-lab.html)** | Research lab interface |
| **[numsy](web/numsy.html)** | Numsy character viewer |
| **[github-dashboard](web/github-dashboard.html)** | Project health dashboard |

### CLI Tools

| Tool | Install | Description |
|------|---------|-------------|
| **hexcast** | `pip install uvspeed-quantum` | Camera → terminal video streaming (truecolor ANSI) |
| **hexcast --receive** | same | WebSocket server that renders incoming frames |
| **hexcast --serve** | same | Start camera WebSocket server for remote viewers |
| **uvspeed-bridge** | same | Quantum bridge server (55+ API endpoints) |

---

## Install

### Zero install (browser)

Just open any HTML file in `web/` — they're all standalone PWAs:

```bash
open web/quantum-notepad.html
# or visit: https://fornevercollective.github.io/uvspeed/web/quantum-notepad.html
```

### Python CLI (hexcast + bridge)

```bash
# With uv (recommended)
uv pip install -e .

# With pip
pip install -e .

# Lightweight (no OpenCV/numpy — uses Pillow)
pip install -e ".[lite]"

# Run hexcast
hexcast                    # local camera → terminal
hexcast --serve            # start camera server
hexcast --receive          # receive remote stream
hexcast --connect <IP>     # view remote stream
hexcast --discover         # scan LAN for peers
```

### Tauri Desktop App (macOS)

```bash
# Prerequisites: Rust + cargo
cargo install tauri-cli

# Build
mkdir -p tauri-dist && cp -r web/* tauri-dist/
cargo tauri build --bundles app

# Launch
open src-tauri/target/release/bundle/macos/uvspeed.app
```

### From GitHub Releases

Download from [Releases](https://github.com/fornevercollective/uvspeed/releases):

| Package | Contents |
|---------|----------|
| `uvspeed-*.tar.gz` | Full platform (web + CLI + Tauri source) |
| `uvspeed-web-*.tar.gz` | Web apps only (PWA-ready, deploy anywhere) |
| `hexcast-*.tar.gz` | Hexcast CLI standalone |
| `*.whl` | Python package (`pip install *.whl`) |

---

## Quantum Prefix System

The 9-symbol system replaces binary `{0, 1}` with directional prefixes:

```
+1:  declaration / structure     (class, struct, interface)
 1:  logic / computation         (if, match, loop body)
-1:  I/O / side effects          (print, write, network)
+0:  assignment / binding        (let, const, var =)
 0:  neutral / pass-through      (else, default, no-op)
-0:  annotation / comment        (// #  /** */)
+n:  entry / import              (import, use, require)
 n:  flow / iteration            (for, while, map)
-n:  exit / return               (return, yield, throw)
```

Supported in 20+ languages: Python, JavaScript, TypeScript, Rust, Go, Swift, Kotlin, C/C++, Java, C#, Ruby, PHP, Dart, Lua, Shell, R, Haskell, Elixir, Zig, WGSL.

---

## Architecture

```
uvspeed/
├── web/                    # 16 standalone HTML apps (PWA-ready)
│   ├── launcher.html       # Mode picker + command console
│   ├── terminal.html       # Full terminal emulator (hexterm)
│   ├── feed.html           # Lightweight video/audio feed window
│   ├── grid.html           # Multi-stream canvas grid
│   ├── quantum-notepad.html # Main notepad with prefix gutter
│   ├── kbatch.html         # Keyboard heatmap analyzer
│   ├── hexcast.html        # Video hex broadcast
│   └── ...                 # brothernumsy, blackwell, archflow, etc.
├── src-tauri/              # Tauri v2 desktop app (Rust)
│   ├── src/main.rs         # Window management, menus, device presets
│   └── tauri.conf.json     # App config (launcher as default window)
├── src/                    # Python/JS source
│   ├── 01-core/            # Bridge server, MCP server, classifier
│   ├── 02-electron/        # Legacy Electron app (deprecated → Tauri)
│   └── 03-tools/           # Launch scripts, build tools
├── uvspeed_hexcast.py      # Hexcast CLI (camera streaming)
├── uvspeed_cli.py          # Bridge CLI
├── pyproject.toml          # Python package config (v4.0)
├── package.json            # Node package config (legacy Electron)
└── install.sh              # Full install script
```

### Multi-Stream Architecture

```
┌─────────────────────────────┐
│  Launcher (mode picker)     │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │inst│ │grid│ │ web│     │
│  └─┬──┘ └─┬──┘ └─┬──┘     │
│    │       │       │ {dev}  │
│  command console             │
└────┬───────┬───────┬────────┘
     │       │       │
     ▼       ▼       ▼
  Terminal  Grid   Browser
  (hexterm) (canvas) (PWA)
     │       │
     ▼       ▼
  Feed windows (lightweight)
  ┌─────┐ ┌─────┐ ┌─────┐
  │video│ │video│ │video│
  │audio│ │audio│ │audio│
  │chat │ │chat │ │chat │
  └─────┘ └─────┘ └─────┘
```

All windows communicate via `BroadcastChannel('hexterm')`:
- Feed windows send keystrokes → master terminal's single kbatch
- Feed windows send transcripts → master for centralized logging
- Launcher console sends commands → all windows

---

## Development

```bash
# Clone
git clone https://github.com/fornevercollective/uvspeed.git
cd uvspeed

# Python tools
uv pip install -e ".[dev]"

# Tauri dev mode
mkdir -p tauri-dist && cp -r web/* tauri-dist/
cargo tauri build --bundles app

# Run tests
pytest

# Lint
ruff check .
```

---

## Sponsor

uvspeed is solo-built and open source. Sponsorships fund full-time development, test hardware, and infrastructure.

<a href="https://github.com/sponsors/fornevercollective">
<img src="https://img.shields.io/badge/Sponsor_on_GitHub-%E2%9D%A4-ff69b4?style=for-the-badge" alt="Sponsor">
</a>

| Tier | Amount | Perks |
|------|--------|-------|
| Contributor | $5/mo | Name in README, sponsor badge |
| Builder | $15/mo | Priority issues, early access |
| Studio | $50/mo | Roadmap input, custom configs |
| Agency | $200/mo | Logo in README, support channel |

Also accepted: [Ko-fi](https://ko-fi.com/fornevercollective) · [PayPal](https://paypal.me/fornevercollective) · [Open Collective](https://opencollective.com/uvspeed)

See [SPONSORS.md](.github/SPONSORS.md) for full details and goals.

### Sponsors

*Your name or logo here — [become a sponsor](https://github.com/sponsors/fornevercollective)*

---

## License

MIT — see [LICENSE](LICENSE)

<p align="center">
<sub>beyondBINARY · {+1, 1, -1, +0, 0, -0, +n, n, -n} · fornevercollective</sub>
</p>
