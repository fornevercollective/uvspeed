#!/usr/bin/env python3
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
"""
Prefix ALL project files with the beyondBINARY quantum header.
Adds a single-line header comment appropriate to each file's language.
Does NOT modify binary files or files that already have the header.
"""

import os
import sys
from pathlib import Path

HEADER_TAG = "beyondBINARY quantum-prefixed"

# Comment styles per extension
COMMENT_MAP = {
    # Hash-style comments
    '.py':    '# ',
    '.sh':    '# ',
    '.yaml':  '# ',
    '.yml':   '# ',
    '.toml':  '# ',
    '.rb':    '# ',
    '.nu':    '# ',
    # Slash-style comments
    '.js':    '// ',
    '.ts':    '// ',
    '.jsx':   '// ',
    '.tsx':   '// ',
    '.rs':    '// ',
    '.go':    '// ',
    '.c':     '// ',
    '.h':     '// ',
    '.cpp':   '// ',
    '.java':  '// ',
    '.swift': '// ',
    '.kt':    '// ',
    '.css':   '/* ',  # special: needs closing */
    '.zig':   '// ',
    # HTML-style comments
    '.html':  '<!-- ',  # special: needs closing -->
    '.htm':   '<!-- ',
    '.svg':   '<!-- ',
    '.md':    '<!-- ',  # markdown: HTML comment
    '.mdc':   '<!-- ',
    # SQL
    '.sql':   '-- ',
    # JSON — cannot have comments, skip
    '.json':  None,
}

CSS_CLOSE = ' */'
HTML_CLOSE = ' -->'

SKIP_DIRS = {
    '.git', 'node_modules', '__pycache__', '.venv', 'venv',
    '.tox', 'dist', 'build', '.quantum_sessions', 'site-packages',
}

HEADER_LINE = f'{HEADER_TAG} | uvspeed | {{+1, 1, -1, +0, 0, -0, +n, n, -n}}'


def make_header(ext: str):
    prefix = COMMENT_MAP.get(ext)
    if prefix is None:
        return None
    line = prefix + HEADER_LINE
    if ext == '.css':
        line += CSS_CLOSE
    elif ext in ('.html', '.htm', '.svg', '.md', '.mdc'):
        line += HTML_CLOSE
    return line


def should_skip(path: Path) -> bool:
    for part in path.parts:
        if part in SKIP_DIRS:
            return True
    return False


def process_file(filepath: Path, dry_run: bool = False) -> bool:
    ext = filepath.suffix.lower()
    header = make_header(ext)
    if header is None:
        return False

    try:
        content = filepath.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return False

    # Already prefixed?
    if HEADER_TAG in content[:500]:
        return False

    # Preserve shebang
    if content.startswith('#!'):
        first_newline = content.index('\n') + 1
        new_content = content[:first_newline] + header + '\n' + content[first_newline:]
    else:
        new_content = header + '\n' + content

    if dry_run:
        print(f"  [dry-run] {filepath}")
    else:
        filepath.write_text(new_content, encoding='utf-8')
        print(f"  ✓ {filepath}")

    return True


def main():
    root = Path(__file__).parent.parent
    dry_run = '--dry-run' in sys.argv

    print(f"{'[DRY RUN] ' if dry_run else ''}Prefixing all files in: {root}")
    print(f"Header: {HEADER_LINE}\n")

    count = 0
    skipped = 0
    already = 0

    for filepath in sorted(root.rglob('*')):
        if not filepath.is_file():
            continue
        if should_skip(filepath):
            continue

        ext = filepath.suffix.lower()
        if ext not in COMMENT_MAP:
            continue

        if COMMENT_MAP[ext] is None:
            skipped += 1
            continue

        try:
            content = filepath.read_text(encoding='utf-8', errors='replace')
            if HEADER_TAG in content[:500]:
                already += 1
                continue
        except Exception:
            continue

        if process_file(filepath, dry_run):
            count += 1

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Done!")
    print(f"  Prefixed: {count}")
    print(f"  Already had header: {already}")
    print(f"  Skipped (no comment syntax): {skipped}")


if __name__ == '__main__':
    main()
