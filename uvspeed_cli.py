# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UVspeed CLI entry point — thin wrapper for pip install
# Routes to src/01-core/ Python modules

import importlib.util
import os
import sys

CORE_DIR = os.path.join(os.path.dirname(__file__), 'src', '01-core')


def _load_module(name, filename):
    """Load a module from src/01-core/ by filename."""
    spec = importlib.util.spec_from_file_location(name, os.path.join(CORE_DIR, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    """Launch the quantum bridge server."""
    bridge = _load_module('quantum_bridge_server', 'quantum_bridge_server.py')
    if hasattr(bridge, 'main'):
        bridge.main()
    else:
        print('UVspeed Quantum Bridge Server — run with: uvspeed-bridge')
        print(f'Core modules at: {CORE_DIR}')


if __name__ == '__main__':
    main()
