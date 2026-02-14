# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# UVspeed CLI — quantum prefix tools with structured subcommands
"""
uvspeed-bridge — Quantum prefix development platform CLI.

Subcommands:
  serve     Start the quantum bridge server
  classify  Classify a file or stdin with quantum prefixes
  prefix    Add prefix gutter to source code
  stats     Show prefix statistics for a file
  health    Check bridge server status
  version   Show version info
"""

import importlib.util
import json
import os
import sys

CORE_DIR = os.path.join(os.path.dirname(__file__), 'src', '01-core')
VERSION = '4.2.0'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 9-Symbol Prefix Classifier (Python port)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYMBOLS = {
    'declaration': '+1', 'logic': '1',  'io': '-1',
    'assignment': '+0',  'neutral': '0', 'comment': '-0',
    'modifier': '+n',    'import': 'n',  'unknown': '-n',
}


def classify_line(line: str) -> dict:
    """Classify a single line of code into one of 9 quantum prefixes."""
    trimmed = line.strip()

    if not trimmed:
        return {'symbol': '0', 'category': 'neutral'}

    # Comments
    if trimmed.startswith(('#', '//', '/*', '--', '"""', "'''")):
        return {'symbol': '-0', 'category': 'comment'}

    # Imports
    for kw in ('import ', 'from ', 'use ', 'require', '#include', 'package '):
        if trimmed.startswith(kw):
            return {'symbol': 'n', 'category': 'import'}

    # Declarations
    for kw in ('fn ', 'function ', 'def ', 'class ', 'struct ', 'enum ',
               'const ', 'let ', 'var ', 'type ', 'interface ', 'trait ',
               'pub fn ', 'async def ', 'export '):
        if trimmed.startswith(kw):
            return {'symbol': '+1', 'category': 'declaration'}

    # Logic/control flow
    for kw in ('if ', 'else', 'elif ', 'for ', 'while ', 'match ', 'switch ',
               'case ', 'try', 'catch', 'except', 'finally'):
        if trimmed.startswith(kw):
            return {'symbol': '1', 'category': 'logic'}

    # Modifiers
    for kw in ('return ', 'yield ', 'break', 'continue', 'raise ', 'throw '):
        if trimmed.startswith(kw):
            return {'symbol': '+n', 'category': 'modifier'}

    # I/O
    io_patterns = ('print', 'console.', 'log(', 'write(', 'read(', 'fetch(',
                   'println!', 'fmt.', 'echo ')
    for pat in io_patterns:
        if pat in trimmed:
            return {'symbol': '-1', 'category': 'io'}

    # Assignment
    for op in (' = ', ' := ', ' += ', ' -= ', ' *= ', ' /= '):
        if op in trimmed:
            return {'symbol': '+0', 'category': 'assignment'}

    return {'symbol': '-n', 'category': 'unknown'}


def classify_source(source: str) -> list:
    """Classify all lines in source code."""
    return [
        {**classify_line(line), 'line': i + 1, 'text': line}
        for i, line in enumerate(source.splitlines())
    ]


def prefix_content(source: str) -> str:
    """Add prefix gutter to every line."""
    lines = source.splitlines()
    result = []
    for line in lines:
        cl = classify_line(line)
        result.append(f"{cl['symbol']:>3} {line}")
    return '\n'.join(result)


def prefix_stats(source: str) -> dict:
    """Calculate prefix distribution statistics."""
    results = classify_source(source)
    total = len(results)
    counts = {}
    for r in results:
        cat = r['category']
        counts[cat] = counts.get(cat, 0) + 1

    classified = sum(v for k, v in counts.items() if k not in ('neutral', 'unknown'))
    return {
        'total_lines': total,
        'classified_lines': classified,
        'coverage': round(classified / total * 100, 1) if total > 0 else 0,
        'prefix_counts': counts,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Module loader
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _load_module(name: str, filename: str):
    """Load a module from src/01-core/ by filename."""
    spec = importlib.util.spec_from_file_location(name, os.path.join(CORE_DIR, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLI Commands
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def cmd_serve(args: list):
    """Start the quantum bridge server."""
    bridge = _load_module('quantum_bridge_server', 'quantum_bridge_server.py')
    if hasattr(bridge, 'main'):
        bridge.main()
    else:
        print('Bridge server module loaded but no main() found.')
        print(f'Core modules at: {CORE_DIR}')


def cmd_classify(args: list):
    """Classify a file or stdin with quantum prefixes."""
    if args and args[0] != '-':
        filepath = args[0]
        if not os.path.isfile(filepath):
            print(f'Error: File not found: {filepath}', file=sys.stderr)
            sys.exit(1)
        with open(filepath) as f:
            source = f.read()
    else:
        source = sys.stdin.read()

    fmt = 'json' if '--json' in args else 'text'
    results = classify_source(source)

    if fmt == 'json':
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            sym = r['symbol'].rjust(3)
            print(f'{sym} {r["text"]}')


def cmd_prefix(args: list):
    """Add prefix gutter to source code (stdout)."""
    if args and args[0] != '-':
        with open(args[0]) as f:
            source = f.read()
    else:
        source = sys.stdin.read()

    print(prefix_content(source))


def cmd_stats(args: list):
    """Show prefix statistics for a file."""
    if args and args[0] != '-':
        with open(args[0]) as f:
            source = f.read()
    else:
        source = sys.stdin.read()

    stats = prefix_stats(source)
    fmt = 'json' if '--json' in args else 'text'

    if fmt == 'json':
        print(json.dumps(stats, indent=2))
    else:
        print(f'⚛ Quantum Prefix Stats')
        print(f'  Lines:      {stats["total_lines"]}')
        print(f'  Classified: {stats["classified_lines"]}')
        print(f'  Coverage:   {stats["coverage"]}%')
        print(f'  Distribution:')
        for cat, count in sorted(stats['prefix_counts'].items(), key=lambda x: -x[1]):
            sym = SYMBOLS.get(cat, '??')
            bar = '█' * min(count, 40)
            print(f'    {sym:>3} {cat:<12} {count:>4}  {bar}')


def cmd_health(args: list):
    """Check bridge server status."""
    import socket
    port = 8085
    try:
        s = socket.create_connection(('127.0.0.1', port), timeout=1)
        s.close()
        print(f'✓ Bridge server running on port {port}')
    except (ConnectionRefusedError, socket.timeout, OSError):
        print(f'✗ Bridge server not running (port {port})')
        sys.exit(1)


def cmd_version(args: list):
    """Show version info."""
    print(f'⚛ uvspeed-quantum v{VERSION}')
    print(f'  Prefix system: 9-symbol beyondBINARY')
    print(f'  Symbols: {{+1, 1, -1, +0, 0, -0, +n, n, -n}}')
    print(f'  Python:  {sys.version.split()[0]}')
    print(f'  Core:    {CORE_DIR}')


def cmd_pre(args: list):
    """Run pre-push checklist (folder, inspect, gold, readme)."""
    import glob
    import subprocess

    root = os.path.dirname(os.path.abspath(__file__))

    subcmds = args if args else ['folder', 'inspect', 'gold']
    errors = 0

    for sub in subcmds:
        if sub == 'folder':
            print(f'\n⚛ Folder Check')
            modified = subprocess.run(
                ['git', 'diff', '--name-only', 'HEAD'],
                capture_output=True, text=True, cwd=root
            ).stdout.strip().splitlines()
            untracked = subprocess.run(
                ['git', 'ls-files', '--others', '--exclude-standard'],
                capture_output=True, text=True, cwd=root
            ).stdout.strip().splitlines()
            print(f'  · Modified:  {len(modified)} files')
            print(f'  · Untracked: {len(untracked)} files')
            stale = os.path.join(root, 'web', 'quantum-prefix.js')
            if os.path.exists(stale):
                print(f'  ✗ Stale file: web/quantum-prefix.js')
                errors += 1
            else:
                print(f'  ✓ No stale files')

        elif sub == 'inspect':
            print(f'\n⚛ Inspect Apps')
            app_target = None
            # Check if there's an app name following inspect
            idx = subcmds.index(sub)
            if idx + 1 < len(subcmds) and subcmds[idx + 1] not in (
                'folder', 'inspect', 'gold', 'readme', 'push', 'pre'
            ):
                app_target = subcmds[idx + 1]

            html_dir = os.path.join(root, 'web')
            if app_target:
                candidates = glob.glob(os.path.join(html_dir, f'*{app_target}*.html'))
                if not candidates:
                    print(f'  ✗ No app matching: {app_target}')
                    errors += 1
                    continue
                html_files = candidates
            else:
                html_files = sorted(glob.glob(os.path.join(html_dir, '*.html')))

            for f in html_files:
                name = os.path.basename(f)
                with open(f) as fh:
                    content = fh.read()
                issues = []
                if '<!DOCTYPE html>' not in content and '<!doctype html>' not in content:
                    issues.append('DOCTYPE')
                if '</html>' not in content:
                    issues.append('</html>')
                if 'quantum-prefixes.js' not in content:
                    issues.append('quantum-prefixes.js')
                if 'sw.js' not in content:
                    issues.append('sw.js')
                if issues:
                    print(f'  ✗ {name}: missing {", ".join(issues)}')
                    errors += len(issues)
                else:
                    print(f'  ✓ {name}')
            print(f'  · {len(html_files)} apps checked')

        elif sub == 'gold':
            print(f'\n⚛ Gold Standard Check')
            gold_files = [
                'web/quantum-prefixes.d.ts', 'web/wasm-loader.ts', 'tsconfig.json',
                'web/quantum-theme.css', 'src-tauri/src/prefix_engine.rs',
                'src/bridge/main.go', 'src/shaders/prefix-classify.wgsl',
                'scripts/build.nu', 'scripts/test.nu', 'scripts/audit.nu',
                'scripts/build-wasm.sh', 'scripts/version-sync.sh',
                'scripts/pre.sh', '.github/workflows/ci.yml',
                '.github/workflows/health.yml', '.pre-commit-config.yaml',
            ]
            found = missing = 0
            for gf in gold_files:
                full = os.path.join(root, gf)
                if os.path.exists(full):
                    found += 1
                else:
                    print(f'  ✗ MISSING: {gf}')
                    missing += 1
                    errors += 1
            print(f'  ✓ {found}/{len(gold_files)} gold standard files present')
            if missing:
                print(f'  ✗ {missing} files missing')

        elif sub == 'readme':
            print(f'\n⚛ README Check')
            readme = os.path.join(root, 'README.md')
            if not os.path.exists(readme):
                print('  ✗ README.md not found')
                errors += 1
                continue
            with open(readme) as fh:
                content = fh.read()
            checks = [
                ('Version badge', 'v4.' in content),
                ('Gold Standard section', 'Gold Standard' in content),
                ('Architecture (crates)', 'crates/prefix-engine' in content),
            ]
            for label, passed in checks:
                if passed:
                    print(f'  ✓ {label}')
                else:
                    print(f'  ✗ {label}')
                    errors += 1

    # Summary
    print()
    if errors > 0:
        print(f'✗ {errors} issues found — fix before pushing')
        sys.exit(1)
    else:
        print(f'✓ All checks passed — ready to push')


def cmd_help(args: list):
    """Show usage help."""
    print(f'⚛ uvspeed-bridge v{VERSION} — Quantum prefix development platform')
    print()
    print('Usage: uvspeed-bridge <command> [args]')
    print()
    print('Commands:')
    print('  serve              Start the quantum bridge server')
    print('  classify <file>    Classify a file (or stdin) with prefixes')
    print('  prefix <file>      Add prefix gutter to source (stdout)')
    print('  stats <file>       Show prefix distribution statistics')
    print('  pre [checks...]    Pre-push checklist (folder, inspect, gold, readme)')
    print('  health             Check bridge server status')
    print('  version            Show version info')
    print()
    print('Options:')
    print('  --json             Output in JSON format (classify, stats)')
    print('  -                  Read from stdin')
    print()
    print('Examples:')
    print('  uvspeed-bridge serve')
    print('  uvspeed-bridge classify myfile.py')
    print('  uvspeed-bridge pre                    # full pre-push audit')
    print('  uvspeed-bridge pre folder inspect      # just folder + inspect')
    print('  cat main.rs | uvspeed-bridge prefix -')
    print('  uvspeed-bridge stats src/ --json')


COMMANDS = {
    'serve': cmd_serve,
    'classify': cmd_classify,
    'prefix': cmd_prefix,
    'stats': cmd_stats,
    'pre': cmd_pre,
    'health': cmd_health,
    'version': cmd_version,
    'help': cmd_help,
    '--help': cmd_help,
    '-h': cmd_help,
    '--version': cmd_version,
    '-V': cmd_version,
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Entry point
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main():
    """Route to subcommand or default to serve."""
    args = sys.argv[1:]

    if not args:
        # Default: start the bridge server (backward compatible)
        cmd_serve([])
        return

    command = args[0]
    if command in COMMANDS:
        COMMANDS[command](args[1:])
    else:
        # Unknown command — assume it's a file to classify
        if os.path.isfile(command):
            cmd_classify(args)
        else:
            print(f'Unknown command: {command}', file=sys.stderr)
            cmd_help([])
            sys.exit(1)


if __name__ == '__main__':
    main()
