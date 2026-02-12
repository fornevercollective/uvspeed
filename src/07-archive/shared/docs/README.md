<!-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n} -->
# UV-Speed Quantum Terminal Documentation

## Installation

### Quick Start
```bash
git clone <repository> uvspeed
cd uvspeed
./launch.sh
```

### Manual Install
```bash
./launch.sh install  # Dependencies only
./launch.sh status   # Check installation
```

## Architecture

```
UV-Speed Quantum Terminal
├── Zig (Ghostty)           # Terminal emulator
├── Rust (Nushell/UV)       # Shell and package management  
├── Semantic (GrepAI)       # Intelligent code search
└── Visual (Quantum Nav)    # 3D spatial programming
```

## Quantum Navigation

### Prefixes
All code uses quantum navigation prefixes:
- `n:` = Entry points (#!/usr/bin/env)
- `+1:` = Comments/documentation  
- `-n:` = Imports/dependencies
- `+0:` = Classes
- `0:` = Functions
- `-1:` = Error handling
- `+n:` = Conditionals
- `+2:` = Loops
- `-0:` = Returns
- `+3:` = Output statements

### 3D Movement
Navigate code in 3D space:
- `+1/-1` = Y-axis (lines up/down)
- `+0/-0` = X-axis (dependencies left/right)
- `+n/-n` = Z-axis (complexity forward/back)

## Core Commands

### Development
```bash
v <command>      # uv run (fast execution)
va <package>     # uv add (add dependency)
vs              # uv sync (sync environment)
```

### Quantum Features  
```bash
quantum         # Launch AI terminal with 3D navigation
qconvert <file> # Convert code to quantum numbering
qstatus         # Show system status
```

### AI Integration
```bash
code <prompt>   # Generate code with quantum context
+1 +0 +n3      # Move in 3D code space
convert <file>  # Add quantum numbering to file
```

## GitHub Copilot Integration

UV-Speed integrates with GitHub Copilot CLI for quantum-aware development:

```bash
# Install Copilot CLI (if not present)
brew install gh
gh auth login
gh extension install github/gh-copilot

# Use quantum-enhanced Copilot
./tools/copilot-quantum explain "quantum navigation system"
```

### Copilot Context
The system provides Copilot with quantum development context, enabling:
- Quantum-numbered code generation
- 3D spatial programming concepts
- UV-Speed workflow understanding
- Architecture-aware suggestions

## Examples

### Hello Quantum
```bash
cd examples/hello-quantum
uv run main.py
```

### Convert Existing Code
```bash
qconvert my_script.py  # Creates my_script_quantum.py
```

### Quantum AI Coding
```bash
quantum
# In quantum terminal:
code calculator class
+1 +2 +n3  # Move to different position
code hello function
```

## Compatibility

- **macOS**: Native Apple Silicon + Intel
- **Linux**: Universal binaries
- **BSD**: Full compatibility  
- **Portable**: USB/external drive support

## File Structure

```
uvspeed/
├── launch.sh              # Main launcher
├── quantum/               # Quantum terminal core
│   ├── opencode_quantum_terminal_clean.py
│   ├── quantum_handler_clean.py
│   └── quantum_status_clean.py
├── tools/                 # Portable binaries
│   ├── bin/               # UV, Nushell
│   └── copilot-quantum    # Copilot wrapper
├── config/               # Environment files
│   ├── quantum.env        # Aliases and settings
│   └── copilot_context.md # AI context
├── examples/             # Demo projects
└── docs/                 # Documentation
```

## Troubleshooting

### OpenCode Issues
If OpenCode AI fails, the system uses intelligent fallback with contextual code generation.

### Missing Dependencies
```bash
./launch.sh install  # Re-run installation
./launch.sh status   # Check what's missing
```

### Performance
- Use `v` instead of `python` for 10x faster startup
- GrepAI provides semantic search over grep
- Nushell offers structured data and pipelines