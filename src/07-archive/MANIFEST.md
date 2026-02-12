# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}

# uvspeed — Quantum Prefix Folder Manifest

Organized numerically by the 9-symbol prefix system.
AI/quantum updater navigates by prefix directory → only updates what needs updating.

## Folder Index

| Prefix | Dir             | Category    | Contents                                          |
|--------|-----------------|-------------|---------------------------------------------------|
| `n:`   | `src/n-entry/`  | shebang     | Launchers, entry points, shell scripts             |
| `+1:`  | `src/p1-docs/`  | docs/config | README, docs, config, themes, demo data            |
| `-n:`  | `src/mn-deps/`  | imports     | pyproject.toml, package.json, manifest.json        |
| `+0:`  | `src/p0-core/`  | core class  | Main app files: bridge server, notepad, prototype  |
| `0:`   | `src/z-functions/` | functions | Tools, utilities, helper scripts                  |
| `-1:`  | `src/m1-tests/` | tests       | Test scripts, verification, QA                     |
| `+n:`  | `src/pn-platforms/` | platform | Platform-specific builds (Firefox, multi-platform) |
| `+2:`  | `src/p2-versions/` | versions  | Progressive version snapshots (v1, v2, v3)        |
| `-0:`  | `src/m0-output/` | output     | Build output, dist, compiled assets                |

## Root Files (kept at root for tooling compatibility)

| File                       | Prefix | Purpose                              |
|----------------------------|--------|--------------------------------------|
| `quantum_bridge_server.py` | `+0:`  | Backend server (also in src/p0-core) |
| `launch.sh`                | `n:`   | Primary launcher (also in src/n-entry) |
| `pyproject.toml`           | `-n:`  | Python deps (also in src/mn-deps)    |
| `package.json`             | `-n:`  | Node deps (also in src/mn-deps)      |
| `README.md`                | `+1:`  | Project docs (also in src/p1-docs)   |

## Subdirectories (original, preserved)

| Dir             | Prefix | Purpose                                 |
|-----------------|--------|-----------------------------------------|
| `.cursor/`      | `+1:`  | IDE rules and skills                    |
| `.github/`      | `+1:`  | Copilot instructions                    |
| `.vscode/`      | `+1:`  | VS Code settings                        |
| `.windsurf/`    | `+1:`  | Windsurf AI rules                       |
| `web/`          | `+0:`  | Web UI (quantum-notepad.html)           |
| `electron-app/` | `+0:`  | Desktop application                     |
| `quantum/`      | `0:`   | Core quantum handlers                   |
| `tools/`        | `0:`   | Utility tools (prefix_all_files.py)     |
| `shared/`       | `+1:`  | Shared configs and docs                 |
| `background/`   | `0:`   | Service workers                         |
| `content/`      | `0:`   | Content scripts                         |
| `popup/`        | `+3:`  | Popup UI                                |
| `versions/`     | `+2:`  | Progressive version snapshots           |
| `examples/`     | `+1:`  | Example projects                        |

## AI Navigation Rules

1. **To update core logic** → `src/p0-core/` or `web/` or `electron-app/`
2. **To update tests** → `src/m1-tests/`
3. **To update docs** → `src/p1-docs/` or `.cursor/` or `.github/`
4. **To update deps** → `src/mn-deps/` (then sync root copies)
5. **To add launchers** → `src/n-entry/`
6. **To add platform builds** → `src/pn-platforms/`
7. **To update versions** → `src/p2-versions/` or `versions/`

## Quantum Updater Protocol

When the quantum updater runs:
1. Read this MANIFEST.md to understand the folder map
2. Check which prefix categories have changes (via git diff)
3. Navigate only to the relevant `src/<prefix>/` directory
4. Apply updates scoped to that prefix category
5. Avoid touching unrelated prefix directories
