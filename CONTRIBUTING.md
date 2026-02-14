# Contributing to uvspeed

Thank you for your interest in contributing to **uvspeed** — the beyondBINARY quantum-prefixed code architecture.

## Quick Start

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/uvspeed.git
cd uvspeed

# 2. Install dependencies
uv sync                    # Python (bridge server)
npm install                # Node (Electron desktop app)

# 3. Run locally
uv run python src/01-core/quantum_bridge_server.py   # Bridge: HTTP :8085 + WS :8086
npm start                                             # Electron multi-instance app
open web/quantum-notepad.html                         # Web (zero install)
```

## Project Structure

```
src/01-core/        Python backend — bridge server (55+ endpoints), MCP server
src/02-electron/    Electron multi-instance desktop app
src/03-tools/       Launch/build scripts
src/04-tests/       Test files
src/05-examples/    Example projects
src/06-extensions/  Browser extensions (Chrome, Firefox, PWA)
src/07-archive/     Historical versions
web/                9 self-contained HTML web apps
icons/              Screenshots + assets
```

## The beyondBINARY Prefix System

Every line of code in every language is classified with the 11-symbol system (9 core + 2 extended):

| Symbol | Category | What it marks |
|--------|----------|---------------|
| `n:` | Entry points | Shebangs, main functions |
| `+1:` | Comments | Documentation, decorators |
| `-n:` | Imports | Dependencies, includes |
| `+0:` | Classes | Structs, types, interfaces |
| `0:` | Functions | Method definitions |
| `-1:` | Errors | Try/catch/except/raise |
| `+n:` | Conditions | If/else/switch/match |
| `+2:` | Loops | For/while/repeat |
| `-0:` | Returns | Return/yield statements |
| `+3:` | Output | Print/log/echo |
| `1:` | Variables | Declarations, assignments |

When contributing code, ensure the prefix system header is at the top of every file:

```
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
```

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/fornevercollective/uvspeed/issues) first
2. Open a new issue using the **Bug Report** template
3. Include: steps to reproduce, expected vs actual behavior, browser/OS info

### Suggesting Features

1. Open an issue using the **Feature Request** template
2. Describe the use case and how it fits with the prefix architecture
3. Reference which phase it belongs to (see README Phase Tracking)

### Code Contributions

1. **Fork** the repo and create a branch from `main`
2. **Follow the style**: single-file HTML apps, inline CSS with design system variables, quantum prefix headers
3. **Test**: run `uv run pytest src/04-tests/` for Python, open HTML files in browser for web
4. **Lint**: `ruff check src/` for Python, `node -c` for JS
5. **Commit** with descriptive messages following the existing pattern:
   ```
   v3.x.0 — Short description of changes
   ```
6. **Push** and open a Pull Request

### Adding a New Web Page

All web apps follow the same pattern:

1. Create `web/your-page.html` as a single self-contained file
2. Use the shared CSS design system (see any existing page for variables)
3. Include the nyan-banner logo and cross-page navigation in the header
4. Add a `window.yourPage` API object for scriptability
5. Add navigation links in all other pages (header nav + notepad footer)
6. Update `README.md` with a dedicated section
7. Update `.github/workflows/release.yml` release notes

### Adding a Bridge Server Endpoint

1. Add the route handler in `src/01-core/quantum_bridge_server.py`
2. Add the endpoint to the 404 handler's endpoint list
3. Add the corresponding MCP tool in `src/01-core/mcp_server.py` if appropriate
4. Update `README.md` API Surface table

## Development Standards

- **Python**: Python 3.9+, `ruff` for linting, type hints encouraged
- **JavaScript**: ES2020+, no build step for web apps, `node -c` syntax check
- **HTML/CSS**: Single-file, inline styles with CSS variables, no frameworks
- **Testing**: `pytest` for Python, manual browser testing for web
- **Dependencies**: Minimal — web apps have zero dependencies, bridge server uses `websockets` + optional `aiohttp`/`numpy`/`psutil`

## MCP Development

The MCP server (`src/01-core/mcp_server.py`) wraps bridge endpoints as tools:

- Add new tools to the `TOOLS` list with proper JSON Schema
- Add handler in `handle_tool()` to proxy to bridge
- Test with: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python src/01-core/mcp_server.py`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
