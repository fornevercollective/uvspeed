# Disk Audit — /Users/tref/ → /Volumes/NO NAME/
# Generated 2026-02-13 | 228 GB internal, 4.3 GB free | 233 GB external, 19 GB free

## Summary
| Location | Used | Free |
|----------|------|------|
| Internal (Macintosh HD) | 224 GB | 4.3 GB |
| External (NO NAME) | 214 GB | 19 GB |

## Home Directory Breakdown (~100 GB in /Users/tref/)

### CANNOT MOVE (active, needed on SSD)
| Dir | Size | Why |
|-----|------|-----|
| `Library/` | 57 GB | macOS system + app data (details below) |
| `uvspeed/` | 2.6 GB | Active project — this repo |
| `tinygrad/` | 2.6 GB | Active AI dev — local Metal backend |
| `.local/` | 2.6 GB | uv, cargo bins, cursor-agent |
| `.cargo/` | 11 MB | Rust binaries (need fast access) |
| `.cursor/` | 268 MB | Cursor IDE state |

### CAN MOVE (symlink back if needed)
| Dir | Size | What | Risk |
|-----|------|------|------|
| `AppData/` | **12 GB** | Unknown app data | Low — check contents first |
| `day/train/` | **2.1 GB** | Training data | None — data files |
| `day/My project/` | **2.0 GB** | Unity/project build | None — can rebuild |
| `MetaQuestDev/` | **3.9 GB** | Quest SDK, datasets, docs | Low — reference material |
| `ios/` | **3.3 GB** | iOS project | Low — not actively building |
| `torch-env/` | **1.3 GB** | Python venv (torch on 3.9) | None — recreatable |
| `torch-env-311/` | **1.0 GB** | Python venv (torch on 3.11) | None — recreatable |
| `ai-workspace/` | **2.1 GB** | Old AI workspace | Low — has pyproject.toml |
| `lark2/` | **1.2 GB** | Lark project | Low |
| `fornevercollective/bu/` | **648 MB** | Backup/old repo | None |
| `avi/` | **646 MB** | AVI project | Low |
| `.gradle/` | **1.0 GB** | Gradle cache (Android builds) | None — cache, auto-rebuilds |
| `.npm/` | **535 MB** | npm cache remnants | None — just cache |
| `.julia/` | **791 MB** | Julia packages | Low — re-downloadable |
| `.copilot/` | **765 MB** | GitHub Copilot cache | None — auto-rebuilds |
| `.antigravity/` | **510 MB** | Antigravity tool | Low |
| `.gemini/` | **343 MB** | Gemini cache | None — cache |
| `model/` | **240 MB** | ML model files | None — data |
| `nltk_data/` | **68 MB** | NLP data | None — re-downloadable |
| `kimi-cli/` | **308 MB** | Kimi CLI tool | Low |
| `freya-precision-converter/` | **335 MB** | FreyaUnits project | Low |
| `freyaunits/` | **289 MB** | FreyaUnits (another copy?) | Low |

### Library/ Breakdown (57 GB — mostly unmovable)
| Dir | Size | Moveable? |
|-----|------|-----------|
| `Application Support/Cursor/` | 14 GB | NO — active IDE |
| `Application Support/Autodesk/` | 10 GB | **YES** — Fusion 360 cache, can offload |
| `Application Support/Claude/` | 8.1 GB | Partial — can clear conversation cache |
| `Caches/` | 6.5 GB | **YES** — safe to clear entirely |
| `Android/` | 6.0 GB | **YES** — Android SDK, can symlink |
| `pnpm/` | 2.2 GB | **YES** — pnpm global store, recreatable |
| `Application Support/Figma/` | 1.1 GB | **YES** — Figma cache |
| `Application Support/UnityHub/` | 1.0 GB | **YES** — Unity cache |
| `Application Support/discord/` | 734 MB | Partial |
| `Application Support/Electron Fiddle/` | 553 MB | **YES** — cache |
| `Application Support/TikTok LIVE Studio/` | 551 MB | **YES** — cache |
| `Python/` | 1.2 GB | Partial — old pip installs |

### .local/share/ (2.2 GB)
| Dir | Size | Moveable? |
|-----|------|-----------|
| `griptape_nodes/` | 1.0 GB | **YES** — node framework data |
| `uv/` | 951 MB | Partial — Python installations (needed for uv) |
| `cursor-agent/` | 303 MB | NO — active Cursor state |

## Recommended Moves (Quick Wins)

### Tier 1: Delete (safe, just caches) — **~10 GB**
```bash
# Caches (auto-rebuild)
rm -rf ~/Library/Caches/*                    # 6.5 GB
rm -rf ~/.npm                                # 535 MB
rm -rf ~/.gradle/caches                      # ~800 MB
rm -rf ~/.copilot                            # 765 MB
rm -rf ~/.gemini                             # 343 MB
rm -rf ~/Library/Application\ Support/Electron\ Fiddle  # 553 MB
rm -rf ~/nltk_data                           # 68 MB
```

### Tier 2: Move to external (symlink back) — **~25 GB**
```bash
VOL="/Volumes/NO NAME"

# Training/model data (12 GB + 4 GB + 3.3 GB)
mv ~/AppData "$VOL/" && ln -s "$VOL/AppData" ~/AppData
mv ~/day/train "$VOL/day-train" && ln -s "$VOL/day-train" ~/day/train
mv ~/MetaQuestDev "$VOL/" && ln -s "$VOL/MetaQuestDev" ~/MetaQuestDev
mv ~/ios "$VOL/" && ln -s "$VOL/ios" ~/ios

# Old venvs (2.3 GB — recreatable, no symlink needed)
rm -rf ~/torch-env ~/torch-env-311

# Old projects (5 GB)
mv ~/ai-workspace "$VOL/" && ln -s "$VOL/ai-workspace" ~/ai-workspace
mv ~/lark2 "$VOL/" && ln -s "$VOL/lark2" ~/lark2
mv ~/fornevercollective/bu "$VOL/fornevercollective-bu"

# Android SDK (6 GB)
mv ~/Library/Android "$VOL/Library-Android" && ln -s "$VOL/Library-Android" ~/Library/Android
```

### Tier 3: Clear app caches (manual, verify first) — **~20 GB**
```bash
# Autodesk Fusion 360 (10 GB) — safe if not actively using
rm -rf ~/Library/Application\ Support/Autodesk

# Claude app cache (8.1 GB) — conversations cached locally
# Check if you need conversation history first

# Figma cache (1.1 GB)
rm -rf ~/Library/Application\ Support/Figma/Desktop*

# TikTok LIVE Studio (551 MB)
rm -rf ~/Library/Application\ Support/TikTok\ LIVE\ Studio
```

## After cleanup: potential ~35-55 GB freed
