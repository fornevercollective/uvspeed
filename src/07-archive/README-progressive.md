<!-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n} -->
# UV-Speed Quantum Development Stack

**Progressive Quantum Development Environment with AI Integration**

Architecture: `Zig (Ghostty) → Rust (Nushell/uv) → Semantic (GrepAI) → Visual`

## Progressive Versions

UV-Speed follows a forward progression approach with three complexity levels:

### 🟢 v1-core - Basic Foundation
- **UV Package Manager** - Ultra-fast Python packaging (`uv run`, `uv add`, `uv sync`)
- **Quantum Numbering System** - Universal code prefixes for spatial programming
- **Core Handler** - Convert any code to quantum format (`+1:`, `-n:`, `+0:`, etc.)
- **Minimal Dependencies** - Just UV and Python for maximum compatibility

**Use when:** Learning quantum concepts, minimal environments, or basic code conversion

### 🔵 v2-terminal - AI Integration  
- **Everything from v1-core** +
- **OpenCode AI Terminal** - Interactive coding with AI assistance
- **3D Navigation** - Move through code space with quantum coordinates
- **Real-time Conversion** - Live quantum numbering as you code
- **Error Recovery** - Smart fallbacks when AI services unavailable

**Use when:** Active development, AI-assisted coding, or 3D code exploration

### 🟣 v3-complete - Full Quantum Environment
- **Everything from v1-core + v2-terminal** +
- **GitHub Copilot Integration** - AI training on quantum patterns
- **Portable Tools** - Bundled Nushell, GrepAI, and dependencies
- **Semantic Search** - Advanced code discovery with intent understanding
- **Cross-platform** - BSD/Linux/macOS compatible portable environment

**Use when:** Production development, team collaboration, or full AI integration

## Quick Start

```bash
# Interactive version selection
./launch-progressive.sh

# Launch specific version directly
./launch-progressive.sh v1          # Basic quantum numbering
./launch-progressive.sh v2 quantum  # AI terminal with 3D navigation  
./launch-progressive.sh v3 status   # Full environment with status

# See all options
./launch-progressive.sh help
```

## Quantum Numbering System

All code is converted to quantum format for spatial navigation and OS rebuild:

```python
n:  1  #!/usr/bin/env python3
+1: 2  # Quantum comment
-n: 3  import numpy as np
+0: 4  class QuantumClass:
 0: 5      def quantum_method(self):
-1: 6          try:
+n: 7              if condition:
+2: 8                  for item in data:
-0: 9                      return result
+3:10                      print("output")
```

**Prefixes:**
- `n:` - Entry points, shebangs
- `+1:` - Comments, documentation  
- `-n:` - Imports, includes
- `+0:` - Classes, structures
- `0:` - Functions, methods
- `-1:` - Error handling, try/except
- `+n:` - Conditionals, if/else
- `+2:` - Loops, iterations
- `-0:` - Returns, exits
- `+3:` - Output, print statements

## Architecture

```
uvspeed/
├── launch-progressive.sh     # Universal launcher
├── versions/
│   ├── v1-core/             # Basic UV + quantum numbering
│   ├── v2-terminal/         # + OpenCode AI + 3D navigation
│   └── v3-complete/         # + Copilot + portable tools
├── shared/                  # Common resources
│   ├── config/             # Environment and Copilot contexts
│   └── tools/              # Portable utilities
└── examples/               # Demo projects

Legacy compatibility:
├── launch.sh               # Original full launcher
└── quantum/               # Original quantum tools
```

## Commands by Version

### v1-core Commands
```bash
v <cmd>              # uv run (ultra-fast execution)
va <package>         # uv add (install package)
vs                   # uv sync (sync dependencies)
qconvert <file>      # Convert code to quantum numbering
```

### v2-terminal Commands  
```bash
# v1-core commands +
quantum              # Launch AI terminal with 3D navigation
+1/-1/+0/-0/+n       # 3D navigation in quantum space
```

### v3-complete Commands
```bash
# v1-core + v2-terminal commands +
copilot-q            # Copilot with quantum context
q <query>            # Semantic code search (GrepAI)
qt <symbol>          # Trace function calls
qstatus              # Full system status
```

## Development Integration

### GitHub Copilot Training
v3-complete includes quantum context files that train Copilot on spatial programming patterns:

```bash
# Copilot learns quantum navigation
gh copilot explain "quantum +1 movement"
gh copilot suggest "convert function to +0 class format"
```

### Semantic Code Discovery
Use GrepAI for intent-based code search:

```bash
q "user authentication flow"      # Find auth logic
q "database connection setup"     # Find DB config
qt "UserLogin"                   # Trace login function calls
```

## BSD/Git Install

UV-Speed is designed for portable deployment:

```bash
# Git clone
git clone <repo> uvspeed
cd uvspeed
./launch-progressive.sh

# BSD package
tar -xzf uvspeed.tar.gz
./uvspeed/launch-progressive.sh

# Flash drive / portable
cp -r uvspeed /media/usb/
/media/usb/uvspeed/launch-progressive.sh
```

---

🌌 **Ready for quantum development with progressive complexity levels**