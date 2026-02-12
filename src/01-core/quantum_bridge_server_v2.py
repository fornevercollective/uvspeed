#!/usr/bin/env python3
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
"""
UV-Speed Quantum Execution Bridge Server
=========================================
WebSocket + HTTP server bridging the web notepad to real code execution,
AI inference, quantum prefix parsing, and agent API endpoints.

Combines patterns from:
- quantum_notepad.py (exec engine, tinygrad integration)
- quantum_handler_clean.py (prefix parser, 18-language support)
- unified_llm_core.py (multi-framework LLM inference)
- quantum_bridge.py (quantum optimization)
- electron-app/main.js (Express+WebSocket pattern)

Priority Build Order:
  1. Real code execution (WebSocket bridge to uv run + Pyodide)
  2. JSON import/export + persistence
  3. Agent API endpoints (/api/prefix, /api/execute, /api/cells)
  5. Prefix-aware diff/PR output
  6. Multi-agent orchestration protocol
  8. Open LLM/AI model integration (tinygrad/Ollama/OpenAI/Anthropic)
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import time
import traceback
import uuid
import hashlib
import difflib
from pathlib import Path
from typing import Dict, List, Any, Optional, AsyncGenerator
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from io import StringIO
from collections import defaultdict

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("quantum-bridge")

# ---------------------------------------------------------------------------
# Tinygrad / numpy detection
# ---------------------------------------------------------------------------
TINYGRAD_AVAILABLE = False
NUMPY_AVAILABLE = False
try:
    sys.path.insert(0, '/Users/tref/torch-env-311/lib/python3.11/site-packages/')
    from tinygrad.tensor import Tensor as TinyTensor
    import tinygrad
    TINYGRAD_AVAILABLE = True
    logger.info("tinygrad loaded successfully")
except Exception:
    logger.info("tinygrad not available — using numpy fallback")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
HTTP_PORT = 8085
WS_PORT = 8086
STORAGE_DIR = Path(__file__).parent / ".quantum_sessions"
STORAGE_DIR.mkdir(exist_ok=True)


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 1 — QUANTUM PREFIX SYSTEM (18 languages)                      ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class QuantumPrefixEngine:
    """
    Universal quantum prefix parser — 9-symbol system across 18 languages.
    Extends quantum_handler_clean.py with full language pack support.
    """

    PREFIXES = {
        'shebang':   'n:',    # Entry points
        'comment':   '+1:',   # Comments / documentation
        'import':    '-n:',   # Imports / includes / requires
        'class':     '+0:',   # Class / struct / type definitions
        'function':  '0:',    # Function / method definitions
        'error':     '-1:',   # Error handling / exceptions
        'condition': '+n:',   # If / else / switch / match
        'loop':      '+2:',   # For / while / repeat
        'return':    '-0:',   # Return / yield statements
        'output':    '+3:',   # Print / echo / log
        'variable':  '1:',    # Variable declarations
        'decorator': '+1:',   # Decorators / annotations
        'default':   '   ',   # Unclassified
    }

    PATTERNS: Dict[str, Dict[str, str]] = {
        'python': {
            'shebang': r'^#!/.*python',
            'comment': r'^\s*#',
            'import': r'^\s*(import|from)\s',
            'class': r'^\s*class\s',
            'function': r'^\s*(def|async\s+def)\s',
            'decorator': r'^\s*@',
            'error': r'^\s*(try|except|finally|raise)',
            'condition': r'^\s*(if|elif|else)\b',
            'loop': r'^\s*(for|while)\s',
            'return': r'^\s*(return|yield)\s',
            'output': r'^\s*print\(',
        },
        'javascript': {
            'shebang': r'^#!/.*node',
            'comment': r'^\s*(//|/\*|\*)',
            'import': r'^\s*(import|require|const\s+.*=\s*require)',
            'class': r'^\s*(class|interface)\s',
            'function': r'^\s*(function|const\s+\w+\s*=\s*(\(|async)|export\s+(default\s+)?function|=>)',
            'error': r'^\s*(try|catch|finally|throw)\b',
            'condition': r'^\s*(if|else\s+if|else|switch|case)\b',
            'loop': r'^\s*(for|while|do)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*console\.',
        },
        'typescript': {
            'shebang': r'^#!/.*ts-node',
            'comment': r'^\s*(//|/\*|\*)',
            'import': r'^\s*(import|require|from)',
            'class': r'^\s*(class|interface|type|enum)\s',
            'function': r'^\s*(function|const\s+\w+\s*[:=]|export\s+(default\s+)?function|=>)',
            'decorator': r'^\s*@',
            'error': r'^\s*(try|catch|finally|throw)\b',
            'condition': r'^\s*(if|else|switch|case)\b',
            'loop': r'^\s*(for|while|do)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*console\.',
        },
        'rust': {
            'comment': r'^\s*(//|/\*)',
            'import': r'^\s*(use|extern\s+crate|mod)\s',
            'class': r'^\s*(struct|enum|trait|impl)\s',
            'function': r'^\s*(pub\s+)?(fn|async\s+fn)\s',
            'decorator': r'^\s*#\[',
            'error': r'^\s*(panic!|unwrap|expect|Result|Err)',
            'condition': r'^\s*(if|else|match)\b',
            'loop': r'^\s*(for|while|loop)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*(println!|print!|eprintln!)',
        },
        'go': {
            'comment': r'^\s*//',
            'import': r'^\s*(import|package)\s',
            'class': r'^\s*type\s+\w+\s+(struct|interface)',
            'function': r'^\s*func\s',
            'error': r'^\s*(if\s+err|panic\(|log\.(Fatal|Panic))',
            'condition': r'^\s*(if|else|switch|case)\b',
            'loop': r'^\s*for\b',
            'return': r'^\s*return\s',
            'output': r'^\s*fmt\.',
        },
        'c': {
            'comment': r'^\s*(//|/\*)',
            'import': r'^\s*#\s*(include|define|pragma)',
            'class': r'^\s*(struct|union|enum|typedef)\s',
            'function': r'^\s*(\w+\s+)+\w+\s*\(',
            'error': r'^\s*(if\s*\(\s*err|perror|exit\()',
            'condition': r'^\s*(if|else|switch|case)\b',
            'loop': r'^\s*(for|while|do)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*(printf|fprintf|puts)\s*\(',
        },
        'shell': {
            'shebang': r'^#!/bin/(bash|sh|zsh)',
            'comment': r'^\s*#',
            'import': r'^\s*(source|\.)\s',
            'function': r'^\s*(\w+\s*\(\)\s*\{|function\s+\w+)',
            'error': r'^\s*(trap|set\s+-e)',
            'condition': r'^\s*(if|elif|else|fi|then)\b',
            'loop': r'^\s*(for|while|until|do|done)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*echo\s',
        },
        'html': {
            'comment': r'^\s*<!--',
            'import': r'^\s*<(link|script|meta)',
            'class': r'^\s*<(div|section|article|main|header|footer|nav)',
            'function': r'^\s*<(form|button|input)',
            'condition': r'^\s*<(template|slot)',
            'output': r'^\s*<(p|h[1-6]|span|a|li|td)',
        },
        'css': {
            'comment': r'^\s*/\*',
            'import': r'^\s*@(import|charset|font-face)',
            'class': r'^\s*\.',
            'variable': r'^\s*--',
            'condition': r'^\s*@(media|supports|keyframes)',
        },
        'java': {
            'comment': r'^\s*(//|/\*|\*)',
            'import': r'^\s*(import|package)\s',
            'class': r'^\s*(public\s+|private\s+|protected\s+)?(class|interface|enum|abstract)\s',
            'function': r'^\s*(public|private|protected|static|void|int|String)',
            'decorator': r'^\s*@',
            'error': r'^\s*(try|catch|finally|throw|throws)\b',
            'condition': r'^\s*(if|else|switch|case)\b',
            'loop': r'^\s*(for|while|do)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*System\.out\.',
        },
        'swift': {
            'comment': r'^\s*//',
            'import': r'^\s*import\s',
            'class': r'^\s*(class|struct|enum|protocol|extension)\s',
            'function': r'^\s*(func|init|deinit|subscript)\s',
            'decorator': r'^\s*@',
            'error': r'^\s*(try|catch|throw|guard|do)\b',
            'condition': r'^\s*(if|else|switch|case)\b',
            'loop': r'^\s*(for|while|repeat)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*print\(',
        },
        'kotlin': {
            'comment': r'^\s*//',
            'import': r'^\s*(import|package)\s',
            'class': r'^\s*(class|object|interface|data\s+class|sealed\s+class)\s',
            'function': r'^\s*(fun|suspend\s+fun|val|var)\s',
            'decorator': r'^\s*@',
            'error': r'^\s*(try|catch|finally|throw)\b',
            'condition': r'^\s*(if|else|when)\b',
            'loop': r'^\s*(for|while|do)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*println\(',
        },
        'ruby': {
            'shebang': r'^#!/.*ruby',
            'comment': r'^\s*#',
            'import': r'^\s*(require|include|extend|gem)\s',
            'class': r'^\s*(class|module)\s',
            'function': r'^\s*def\s',
            'error': r'^\s*(begin|rescue|ensure|raise)\b',
            'condition': r'^\s*(if|elsif|else|unless|case|when)\b',
            'loop': r'^\s*(for|while|until|loop|each|times)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*puts\s',
        },
        'yaml': {
            'comment': r'^\s*#',
            'import': r'^\s*---',
            'variable': r'^\s*\w+\s*:',
            'class': r'^\s*-\s',
        },
        'toml': {
            'comment': r'^\s*#',
            'class': r'^\s*\[',
            'variable': r'^\s*\w+\s*=',
        },
        'sql': {
            'comment': r'^\s*--',
            'import': r'^\s*(USE|DATABASE)\b',
            'class': r'^\s*(CREATE|ALTER|DROP)\b',
            'function': r'^\s*(SELECT|INSERT|UPDATE|DELETE)\b',
            'condition': r'^\s*(WHERE|CASE|WHEN|IF)\b',
            'loop': r'^\s*(JOIN|UNION|GROUP)\b',
        },
        'dockerfile': {
            'comment': r'^\s*#',
            'import': r'^\s*FROM\s',
            'variable': r'^\s*(ENV|ARG)\s',
            'function': r'^\s*(RUN|CMD|ENTRYPOINT)\s',
            'class': r'^\s*(WORKDIR|COPY|ADD)\s',
            'output': r'^\s*EXPOSE\s',
        },
        'nushell': {
            'shebang': r'^#!/.*nu',
            'comment': r'^\s*#',
            'import': r'^\s*(use|source)\s',
            'function': r'^\s*(def|export\s+def)\s',
            'variable': r'^\s*(let|mut|const)\s',
            'condition': r'^\s*(if|else|match)\b',
            'loop': r'^\s*(for|while|each)\b',
            'output': r'^\s*print\s',
        },
        'zig': {
            'comment': r'^\s*//',
            'import': r'^\s*@import\(',
            'class': r'^\s*(const\s+\w+\s*=\s*struct|pub\s+const)',
            'function': r'^\s*(pub\s+)?fn\s',
            'error': r'^\s*(try|catch|if\s*\(.*error)',
            'condition': r'^\s*(if|else|switch)\b',
            'loop': r'^\s*(for|while)\b',
            'return': r'^\s*return\s',
            'output': r'^\s*std\.debug\.print',
        },
        'assembly': {
            'comment': r'^\s*;',
            'import': r'^\s*%include',
            'class': r'^\s*section\s',
            'function': r'^\s*\w+:',
            'variable': r'^\s*(db|dw|dd|dq|equ)\s',
            'condition': r'^\s*(cmp|je|jne|jg|jl|jmp)',
            'loop': r'^\s*(loop|rep)',
            'output': r'^\s*(int\s+0x80|syscall)',
        },
    }

    LANG_MAP = {
        '.py': 'python', '.pyw': 'python',
        '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
        '.ts': 'typescript', '.tsx': 'typescript',
        '.rs': 'rust',
        '.go': 'go',
        '.c': 'c', '.h': 'c', '.cpp': 'c', '.cc': 'c', '.cxx': 'c', '.hpp': 'c',
        '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
        '.html': 'html', '.htm': 'html', '.svg': 'html',
        '.css': 'css', '.scss': 'css', '.less': 'css',
        '.java': 'java',
        '.swift': 'swift',
        '.kt': 'kotlin', '.kts': 'kotlin',
        '.rb': 'ruby',
        '.yml': 'yaml', '.yaml': 'yaml',
        '.toml': 'toml',
        '.sql': 'sql',
        '.dockerfile': 'dockerfile',
        '.nu': 'nushell',
        '.zig': 'zig',
        '.asm': 'assembly', '.s': 'assembly',
    }

    def detect_language(self, filename: str) -> str:
        name_lower = Path(filename).name.lower()
        if name_lower == 'dockerfile':
            return 'dockerfile'
        ext = Path(filename).suffix.lower()
        return self.LANG_MAP.get(ext, 'python')

    def classify_line(self, line: str, language: str) -> str:
        patterns = self.PATTERNS.get(language, self.PATTERNS['python'])
        for category, pattern in patterns.items():
            if re.match(pattern, line):
                return self.PREFIXES.get(category, self.PREFIXES['default'])
        return self.PREFIXES['default']

    def prefix_code(self, content: str, language: str = 'python') -> str:
        """Add quantum prefixes to every line of code."""
        lines = content.split('\n')
        out = []
        for i, line in enumerate(lines, 1):
            pfx = self.classify_line(line, language)
            out.append(f"{pfx:>4s}{i:>3d}  {line}")
        return '\n'.join(out)

    def prefix_file(self, filepath: str) -> Dict[str, Any]:
        """Prefix an entire file, return metadata."""
        lang = self.detect_language(filepath)
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        prefixed = self.prefix_code(content, lang)
        line_count = content.count('\n') + 1
        prefix_counts = defaultdict(int)
        for line in content.split('\n'):
            cat = self.classify_line(line, lang)
            prefix_counts[cat] += 1
        coverage = round((1 - prefix_counts.get('   ', 0) / max(line_count, 1)) * 100, 1)
        return {
            'language': lang,
            'lines': line_count,
            'coverage': coverage,
            'prefixed': prefixed,
            'prefix_distribution': dict(prefix_counts),
        }

    def supported_languages(self) -> List[str]:
        return sorted(self.PATTERNS.keys())


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 2 — CODE EXECUTION ENGINE                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class ExecutionEngine:
    """
    Real code execution via exec() with tinygrad/numpy namespace injection.
    Based on quantum_notepad.py _execute_python_code().
    """

    def __init__(self):
        self.execution_count = 0
        self.namespace = self._build_namespace()

    def _build_namespace(self) -> dict:
        ns = {
            '__builtins__': __builtins__,
            'quantum_position': [0, 0, 0],
        }
        if TINYGRAD_AVAILABLE:
            ns['tinygrad'] = tinygrad
            ns['Tensor'] = TinyTensor
            logger.info("Execution namespace includes tinygrad.Tensor")
        if NUMPY_AVAILABLE:
            ns['np'] = np
            ns['numpy'] = np
        # Try loading micrograd
        try:
            sys.path.insert(0, str(Path.home() / 'micrograd'))
            from micrograd.engine import Value
            ns['Value'] = Value
            ns['micrograd_available'] = True
            logger.info("micrograd.Value loaded")
        except Exception:
            ns['micrograd_available'] = False
        return ns

    def execute(self, code: str, cell_id: str = "") -> Dict[str, Any]:
        """Execute Python code, capture stdout and return value."""
        self.execution_count += 1
        t0 = time.perf_counter()
        stdout_capture = StringIO()
        old_stdout = sys.stdout
        result: Dict[str, Any] = {
            'cell_id': cell_id,
            'execution_count': self.execution_count,
            'success': False,
            'stdout': '',
            'return_value': None,
            'error': None,
            'elapsed_ms': 0,
        }
        try:
            # Inject captured print
            self.namespace['print'] = lambda *a, **kw: print(*a, file=stdout_capture, **kw)
            exec(code, self.namespace)
            result['success'] = True
            result['stdout'] = stdout_capture.getvalue()
            # Try to get last expression value
            try:
                lines = code.strip().split('\n')
                last = lines[-1].strip()
                if last and not last.startswith(('import', 'from', 'def', 'class', '#', 'if', 'for', 'while', 'try', 'with', 'return', 'raise', 'del', 'assert')):
                    val = eval(last, self.namespace)
                    if val is not None:
                        result['return_value'] = repr(val)
            except Exception:
                pass
        except Exception as e:
            result['error'] = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        finally:
            sys.stdout = old_stdout
            result['elapsed_ms'] = round((time.perf_counter() - t0) * 1000, 2)
        return result

    def execute_shell(self, cmd: str, timeout: int = 30) -> Dict[str, Any]:
        """Execute a shell command (for uv run, etc.)."""
        t0 = time.perf_counter()
        try:
            proc = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=timeout
            )
            return {
                'success': proc.returncode == 0,
                'stdout': proc.stdout,
                'stderr': proc.stderr,
                'returncode': proc.returncode,
                'elapsed_ms': round((time.perf_counter() - t0) * 1000, 2),
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'Command timed out after {timeout}s',
                'elapsed_ms': round((time.perf_counter() - t0) * 1000, 2),
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'elapsed_ms': round((time.perf_counter() - t0) * 1000, 2),
            }


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 3 — AI / LLM INFERENCE LAYER                                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class ModelFramework(Enum):
    TINYGRAD = "tinygrad"
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

@dataclass
class AIModelConfig:
    name: str
    framework: ModelFramework
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    context_length: int = 2048
    max_tokens: int = 4096

class AIInferenceLayer:
    """
    Unified AI inference — tinygrad-first, Ollama local, cloud fallback.
    Based on unified_llm_core.py patterns.
    """

    def __init__(self):
        self.models: Dict[str, AIModelConfig] = {}
        self._register_defaults()

    def _register_defaults(self):
        """Register available AI backends."""
        # Tinygrad (local, if available)
        if TINYGRAD_AVAILABLE:
            self.models['tinygrad-local'] = AIModelConfig(
                name='tinygrad-local',
                framework=ModelFramework.TINYGRAD,
            )
        # Ollama (local LLM server)
        self.models['ollama-default'] = AIModelConfig(
            name='ollama-default',
            framework=ModelFramework.OLLAMA,
            endpoint='http://localhost:11434',
        )
        # OpenAI (if key in env)
        if os.environ.get('OPENAI_API_KEY'):
            self.models['openai'] = AIModelConfig(
                name='openai',
                framework=ModelFramework.OPENAI,
                api_key=os.environ['OPENAI_API_KEY'],
            )
        # Anthropic (if key in env)
        if os.environ.get('ANTHROPIC_API_KEY'):
            self.models['anthropic'] = AIModelConfig(
                name='anthropic',
                framework=ModelFramework.ANTHROPIC,
                api_key=os.environ['ANTHROPIC_API_KEY'],
            )

    async def infer(self, prompt: str, model_name: Optional[str] = None) -> Dict[str, Any]:
        """Run inference on the best available model."""
        # Pick model: prefer Ollama (local) > tinygrad > cloud
        if model_name and model_name in self.models:
            config = self.models[model_name]
        elif 'ollama-default' in self.models:
            config = self.models['ollama-default']
        elif 'tinygrad-local' in self.models:
            config = self.models['tinygrad-local']
        else:
            return {'error': 'No AI model available', 'text': ''}

        if config.framework == ModelFramework.OLLAMA:
            return await self._infer_ollama(config, prompt)
        elif config.framework == ModelFramework.TINYGRAD:
            return self._infer_tinygrad(prompt)
        elif config.framework == ModelFramework.OPENAI:
            return await self._infer_openai(config, prompt)
        elif config.framework == ModelFramework.ANTHROPIC:
            return await self._infer_anthropic(config, prompt)
        return {'error': 'Unknown framework', 'text': ''}

    async def _infer_ollama(self, config: AIModelConfig, prompt: str) -> Dict[str, Any]:
        """Ollama local inference."""
        try:
            import aiohttp
            payload = {
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False,
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{config.endpoint}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
                    data = await resp.json()
                    return {
                        'text': data.get('response', ''),
                        'model': 'ollama/llama3.2',
                        'elapsed_ms': data.get('total_duration', 0) / 1e6,
                    }
        except Exception as e:
            return {'error': f'Ollama: {e}', 'text': ''}

    def _infer_tinygrad(self, prompt: str) -> Dict[str, Any]:
        """Tinygrad local inference (tensor ops demo)."""
        if not TINYGRAD_AVAILABLE:
            return {'error': 'tinygrad not available', 'text': ''}
        try:
            t0 = time.perf_counter()
            # Demo: basic tensor operation to prove tinygrad works
            t = TinyTensor([1.0, 2.0, 3.0])
            result = (t * 2 + 1).numpy().tolist()
            return {
                'text': f"tinygrad result: {result}",
                'model': 'tinygrad-local',
                'elapsed_ms': round((time.perf_counter() - t0) * 1000, 2),
            }
        except Exception as e:
            return {'error': f'tinygrad: {e}', 'text': ''}

    async def _infer_openai(self, config: AIModelConfig, prompt: str) -> Dict[str, Any]:
        try:
            import aiohttp
            headers = {
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2048,
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=payload, headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
                    data = await resp.json()
                    text = data['choices'][0]['message']['content']
                    return {'text': text, 'model': 'openai/gpt-4o-mini'}
        except Exception as e:
            return {'error': f'OpenAI: {e}', 'text': ''}

    async def _infer_anthropic(self, config: AIModelConfig, prompt: str) -> Dict[str, Any]:
        try:
            import aiohttp
            headers = {
                "x-api-key": config.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 2048,
                "messages": [{"role": "user", "content": prompt}],
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.anthropic.com/v1/messages",
                    json=payload, headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
                    data = await resp.json()
                    text = data['content'][0]['text']
                    return {'text': text, 'model': 'anthropic/claude-3-haiku'}
        except Exception as e:
            return {'error': f'Anthropic: {e}', 'text': ''}

    def list_models(self) -> List[Dict[str, str]]:
        return [
            {'name': c.name, 'framework': c.framework.value, 'status': 'available'}
            for c in self.models.values()
        ]


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 4 — PREFIX-AWARE DIFF ENGINE                                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class QuantumDiffEngine:
    """
    Prefix-aware diff — shows which quantum coordinates changed,
    not just line numbers. For PR review and agent consumption.
    """

    def __init__(self, prefix_engine: QuantumPrefixEngine):
        self.prefix = prefix_engine

    def diff_code(self, old: str, new: str, language: str = 'python') -> Dict[str, Any]:
        old_prefixed = self.prefix.prefix_code(old, language)
        new_prefixed = self.prefix.prefix_code(new, language)
        old_lines = old_prefixed.split('\n')
        new_lines = new_prefixed.split('\n')
        differ = difflib.unified_diff(old_lines, new_lines, lineterm='', n=3)
        diff_text = '\n'.join(differ)
        # Count changes by prefix category
        changes_by_prefix = defaultdict(int)
        for line in diff_text.split('\n'):
            if line.startswith('+') and not line.startswith('+++'):
                pfx = line[1:5].strip() if len(line) > 5 else ''
                changes_by_prefix[pfx] += 1
            elif line.startswith('-') and not line.startswith('---'):
                pfx = line[1:5].strip() if len(line) > 5 else ''
                changes_by_prefix[pfx] += 1
        return {
            'diff': diff_text,
            'changes_by_prefix': dict(changes_by_prefix),
            'total_additions': diff_text.count('\n+') - 1,
            'total_deletions': diff_text.count('\n-') - 1,
            'language': language,
        }

    def diff_files(self, old_path: str, new_path: str) -> Dict[str, Any]:
        lang = self.prefix.detect_language(old_path)
        with open(old_path) as f:
            old = f.read()
        with open(new_path) as f:
            new = f.read()
        return self.diff_code(old, new, lang)


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 4B — SECURITY SCANNER (prefix-aware)                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class SecurityScanner:
    """
    Prefix-aware security scanner. Uses quantum prefix classifications
    to flag risky patterns: exec/eval in function lines, hardcoded secrets
    in variable lines, unsafe imports, etc.
    """

    # Pattern → (severity, description)
    RULES: Dict[str, List[Dict[str, str]]] = {
        'python': [
            {'pattern': r'\bexec\s*\(', 'severity': 'high', 'desc': 'Dynamic code execution (exec)'},
            {'pattern': r'\beval\s*\(', 'severity': 'high', 'desc': 'Dynamic code evaluation (eval)'},
            {'pattern': r'subprocess\.call\(.*shell\s*=\s*True', 'severity': 'high', 'desc': 'Shell injection risk (subprocess shell=True)'},
            {'pattern': r'os\.system\s*\(', 'severity': 'high', 'desc': 'OS command execution'},
            {'pattern': r'__import__\s*\(', 'severity': 'medium', 'desc': 'Dynamic import'},
            {'pattern': r'(password|secret|api_key|token)\s*=\s*["\'][^"\']+["\']', 'severity': 'critical', 'desc': 'Hardcoded secret/credential'},
            {'pattern': r'pickle\.loads?\s*\(', 'severity': 'high', 'desc': 'Unsafe deserialization (pickle)'},
            {'pattern': r'yaml\.load\s*\((?!.*Loader)', 'severity': 'medium', 'desc': 'Unsafe YAML load (no Loader)'},
            {'pattern': r'assert\s+', 'severity': 'low', 'desc': 'Assert used for validation (stripped in -O)'},
            {'pattern': r'#\s*TODO|# \s*FIXME|# \s*HACK', 'severity': 'info', 'desc': 'Code smell marker'},
        ],
        'javascript': [
            {'pattern': r'\beval\s*\(', 'severity': 'high', 'desc': 'eval() — code injection risk'},
            {'pattern': r'innerHTML\s*=', 'severity': 'medium', 'desc': 'innerHTML — XSS risk'},
            {'pattern': r'document\.write\s*\(', 'severity': 'medium', 'desc': 'document.write — XSS risk'},
            {'pattern': r'(password|secret|api_key|token)\s*[:=]\s*["\'][^"\']+["\']', 'severity': 'critical', 'desc': 'Hardcoded secret'},
            {'pattern': r'new\s+Function\s*\(', 'severity': 'high', 'desc': 'Dynamic function creation'},
            {'pattern': r'child_process', 'severity': 'high', 'desc': 'Shell command access'},
            {'pattern': r'// \s*TODO|// \s*FIXME', 'severity': 'info', 'desc': 'Code smell marker'},
        ],
        'shell': [
            {'pattern': r'\$\{.*:-.*\}', 'severity': 'low', 'desc': 'Unquoted variable expansion'},
            {'pattern': r'curl\s.*\|\s*(bash|sh)', 'severity': 'critical', 'desc': 'Pipe-to-shell — remote code execution'},
            {'pattern': r'chmod\s+777', 'severity': 'high', 'desc': 'World-writable permissions'},
            {'pattern': r'rm\s+-rf\s+/', 'severity': 'critical', 'desc': 'Recursive delete from root'},
            {'pattern': r'(password|secret|token)=', 'severity': 'high', 'desc': 'Hardcoded credential in shell'},
        ],
    }

    def __init__(self, prefix_engine: QuantumPrefixEngine):
        self.prefix = prefix_engine

    def scan_code(self, code: str, language: str = 'python') -> Dict[str, Any]:
        """Scan code for security issues, annotated with quantum prefix context."""
        rules = self.RULES.get(language, self.RULES.get('python', []))
        findings = []
        lines = code.split('\n')

        for i, line in enumerate(lines, 1):
            pfx = self.prefix.classify_line(line, language)
            for rule in rules:
                if re.search(rule['pattern'], line, re.IGNORECASE):
                    findings.append({
                        'line': i,
                        'prefix': pfx,
                        'severity': rule['severity'],
                        'description': rule['desc'],
                        'code': line.strip()[:120],
                    })

        # Aggregate by severity
        by_severity = defaultdict(int)
        for f in findings:
            by_severity[f['severity']] += 1

        return {
            'language': language,
            'total_lines': len(lines),
            'findings': findings,
            'total_findings': len(findings),
            'by_severity': dict(by_severity),
            'risk_score': (
                by_severity.get('critical', 0) * 10 +
                by_severity.get('high', 0) * 5 +
                by_severity.get('medium', 0) * 2 +
                by_severity.get('low', 0) * 1
            ),
            'clean': len(findings) == 0,
        }

    def scan_file(self, filepath: str) -> Dict[str, Any]:
        """Scan a file for security issues."""
        lang = self.prefix.detect_language(filepath)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            return {'error': str(e)}
        result = self.scan_code(content, lang)
        result['path'] = filepath
        return result

    def scan_directory(self, directory: str) -> Dict[str, Any]:
        """Scan an entire directory."""
        target = Path(directory)
        if not target.exists():
            return {'error': f'Directory not found: {directory}'}

        skip_dirs = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build'}
        results = []
        total_findings = 0

        for p in target.rglob('*'):
            if p.is_file() and not any(sd in p.parts for sd in skip_dirs):
                ext = p.suffix.lower()
                lang = self.prefix.LANG_MAP.get(ext)
                if lang and lang in self.RULES:
                    r = self.scan_file(str(p))
                    if r.get('total_findings', 0) > 0:
                        results.append(r)
                        total_findings += r['total_findings']

        return {
            'directory': str(target),
            'files_scanned': len(results),
            'total_findings': total_findings,
            'results': sorted(results, key=lambda r: -r.get('risk_score', 0)),
        }


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 4C — GIT HOOKS (quantum-prefixed diffs for PRs)               ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class GitHookEngine:
    """
    Generates git pre-commit hooks and PR-ready quantum diffs.
    Produces prefix-annotated diff output suitable for automated review.
    """

    def __init__(self, prefix_engine: QuantumPrefixEngine, diff_engine: QuantumDiffEngine):
        self.prefix = prefix_engine
        self.diff = diff_engine

    def generate_pre_commit_hook(self) -> str:
        """Generate a git pre-commit hook script that runs quantum prefix validation."""
        return '''#!/usr/bin/env bash
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# Git pre-commit hook: validates quantum prefix coverage on staged files
set -e

BRIDGE_URL="${QUANTUM_BRIDGE_URL:-http://localhost:8085}"

echo "⚛ Quantum pre-commit: scanning staged files..."

STAGED=$(git diff --cached --name-only --diff-filter=ACM)
FAILED=0

for FILE in $STAGED; do
    EXT="${FILE##*.}"
    case "$EXT" in
        py|js|ts|rs|go|sh|html|css|java|swift|kt|rb|sql|zig)
            # Run security scan via bridge API
            RESULT=$(curl -s -X POST "$BRIDGE_URL/api/security/scan" \\
                -H "Content-Type: application/json" \\
                -d "{\\"path\\": \\"$FILE\\"}" 2>/dev/null || echo '{"error":"bridge offline"}')

            RISK=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('risk_score',0))" 2>/dev/null || echo 0)

            if [ "$RISK" -gt 20 ]; then
                echo "  ❌ $FILE — risk score $RISK (threshold: 20)"
                FAILED=1
            elif [ "$RISK" -gt 0 ]; then
                echo "  ⚠️  $FILE — risk score $RISK (warnings only)"
            else
                echo "  ✅ $FILE — clean"
            fi

            # Check for quantum prefix header
            HEAD=$(head -5 "$FILE")
            if ! echo "$HEAD" | grep -q "beyondBINARY"; then
                echo "  ⚠️  $FILE — missing beyondBINARY header"
            fi
            ;;
    esac
done

if [ "$FAILED" -eq 1 ]; then
    echo ""
    echo "⚛ Pre-commit BLOCKED: critical security findings."
    echo "  Run: curl -s $BRIDGE_URL/api/security/scan -d '{\\"path\\": \\".\\"}'  for details"
    exit 1
fi

echo "⚛ Pre-commit passed."
'''

    def install_pre_commit_hook(self, repo_dir: str = '.') -> Dict[str, Any]:
        """Install the quantum pre-commit hook into a git repo."""
        hook_dir = Path(repo_dir) / '.git' / 'hooks'
        if not hook_dir.exists():
            return {'error': f'Not a git repo: {repo_dir}'}

        hook_path = hook_dir / 'pre-commit'
        hook_content = self.generate_pre_commit_hook()
        hook_path.write_text(hook_content)
        hook_path.chmod(0o755)

        return {
            'installed': True,
            'path': str(hook_path),
            'size_bytes': len(hook_content),
        }

    def pr_diff_report(self, old_code: str, new_code: str, language: str = 'python',
                       filename: str = '') -> Dict[str, Any]:
        """
        Generate a PR-ready diff report with quantum prefix annotations.
        Suitable for posting as a GitHub PR comment.
        """
        diff_result = self.diff.diff_code(old_code, new_code, language)

        # Build markdown report
        md_lines = [
            f'## ⚛ Quantum Diff Report',
            f'**File:** `{filename or "inline"}`  **Language:** `{language}`',
            '',
            f'| Metric | Value |',
            f'|--------|-------|',
            f'| Additions | {diff_result["total_additions"]} |',
            f'| Deletions | {diff_result["total_deletions"]} |',
            f'| Language | {language} |',
            '',
        ]

        # Changes by prefix category
        if diff_result['changes_by_prefix']:
            md_lines.append('### Changes by Prefix Category')
            md_lines.append('| Prefix | Count | Category |')
            md_lines.append('|--------|-------|----------|')
            prefix_names = {
                'n:': 'shebang', '+1:': 'comment', '-n:': 'import',
                '+0:': 'class', '0:': 'function', '-1:': 'error',
                '+n:': 'condition', '+2:': 'loop', '-0:': 'return',
                '+3:': 'output', '1:': 'variable',
            }
            for pfx, count in sorted(diff_result['changes_by_prefix'].items(),
                                     key=lambda x: -x[1]):
                name = prefix_names.get(pfx, 'other')
                md_lines.append(f'| `{pfx}` | {count} | {name} |')
            md_lines.append('')

        # Abbreviated diff
        md_lines.append('### Diff (prefix-annotated)')
        md_lines.append('```diff')
        diff_lines = diff_result['diff'].split('\n')[:60]
        md_lines.extend(diff_lines)
        if len(diff_result['diff'].split('\n')) > 60:
            md_lines.append(f'... ({len(diff_result["diff"].split(chr(10))) - 60} more lines)')
        md_lines.append('```')

        diff_result['markdown_report'] = '\n'.join(md_lines)
        return diff_result


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 5 — MULTI-AGENT ORCHESTRATION                                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class AgentRole(Enum):
    CODE = "code"       # Writes/edits code
    REVIEW = "review"   # Reviews code with prefix-aware diffs
    DEPLOY = "deploy"   # Handles deployment
    TEST = "test"       # Runs tests
    PREFIX = "prefix"   # Converts code to quantum-prefixed form

@dataclass
class AgentMessage:
    sender: str
    receiver: str
    action: str  # "execute", "review", "prefix", "navigate", "deploy"
    payload: Dict[str, Any]
    quantum_coords: List[int] = field(default_factory=lambda: [0, 0, 0])
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    msg_id: str = field(default_factory=lambda: str(uuid.uuid4()))

class AgentBus:
    """
    Multi-agent message bus — routes messages between agents.
    Each agent can operate at specific quantum coordinates.
    """

    def __init__(self):
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.message_log: List[AgentMessage] = []
        self.handlers: Dict[str, Any] = {}

    def register_agent(self, name: str, role: AgentRole, capabilities: List[str] = None):
        self.agents[name] = {
            'role': role.value,
            'capabilities': capabilities or [],
            'registered_at': datetime.now().isoformat(),
            'status': 'idle',
        }
        logger.info(f"Agent registered: {name} ({role.value})")

    def send_message(self, msg: AgentMessage) -> Dict[str, Any]:
        self.message_log.append(msg)
        if msg.receiver in self.agents:
            self.agents[msg.receiver]['status'] = 'busy'
            logger.info(f"Message {msg.action}: {msg.sender} → {msg.receiver}")
            return {'delivered': True, 'msg_id': msg.msg_id}
        return {'delivered': False, 'error': f'Agent {msg.receiver} not found'}

    def list_agents(self) -> List[Dict[str, Any]]:
        return [
            {'name': n, **info} for n, info in self.agents.items()
        ]

    def get_message_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [asdict(m) for m in self.message_log[-limit:]]


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 6 — SESSION / PERSISTENCE                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class SessionStore:
    """JSON-file session persistence for notebooks."""

    def __init__(self, storage_dir: Path = STORAGE_DIR):
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(exist_ok=True)

    def save(self, session_id: str, data: Dict[str, Any]) -> str:
        path = self.storage_dir / f"{session_id}.json"
        data['saved_at'] = datetime.now().isoformat()
        with open(path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        return str(path)

    def load(self, session_id: str) -> Optional[Dict[str, Any]]:
        path = self.storage_dir / f"{session_id}.json"
        if path.exists():
            with open(path) as f:
                return json.load(f)
        return None

    def list_sessions(self) -> List[Dict[str, str]]:
        sessions = []
        for p in sorted(self.storage_dir.glob('*.json'), key=os.path.getmtime, reverse=True):
            sessions.append({
                'id': p.stem,
                'path': str(p),
                'modified': datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
                'size_kb': round(p.stat().st_size / 1024, 1),
            })
        return sessions

    def delete(self, session_id: str) -> bool:
        path = self.storage_dir / f"{session_id}.json"
        if path.exists():
            path.unlink()
            return True
        return False


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 7 — AI CONVERSION ROADMAP ENGINE                              ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class ConversionRoadmap:
    """
    Scans a codebase and produces an AI-compatible roadmap
    for converting all files to quantum-prefixed form.
    """

    def __init__(self, prefix_engine: QuantumPrefixEngine):
        self.prefix = prefix_engine

    def scan_directory(self, directory: str) -> Dict[str, Any]:
        """Scan a directory and produce a conversion plan."""
        target = Path(directory)
        if not target.exists():
            return {'error': f'Directory not found: {directory}'}

        files_by_lang = defaultdict(list)
        total_lines = 0
        total_files = 0
        skip_dirs = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', '.tox', 'dist', 'build'}

        for p in target.rglob('*'):
            if p.is_file() and not any(sd in p.parts for sd in skip_dirs):
                ext = p.suffix.lower()
                lang = self.prefix.LANG_MAP.get(ext)
                if lang:
                    try:
                        line_count = sum(1 for _ in open(p, 'r', errors='replace'))
                    except Exception:
                        line_count = 0
                    files_by_lang[lang].append({
                        'path': str(p.relative_to(target)),
                        'lines': line_count,
                    })
                    total_lines += line_count
                    total_files += 1

        # Build prioritized plan
        plan = []
        for lang in sorted(files_by_lang.keys(), key=lambda l: -len(files_by_lang[l])):
            lang_files = files_by_lang[lang]
            lang_lines = sum(f['lines'] for f in lang_files)
            plan.append({
                'language': lang,
                'file_count': len(lang_files),
                'total_lines': lang_lines,
                'files': sorted(lang_files, key=lambda f: -f['lines'])[:20],  # top 20 by size
                'estimated_time_seconds': round(lang_lines * 0.001, 1),  # ~1ms per line
            })

        return {
            'directory': str(target),
            'total_files': total_files,
            'total_lines': total_lines,
            'languages': len(files_by_lang),
            'plan': plan,
            'estimated_total_seconds': round(total_lines * 0.001, 1),
        }

    def convert_directory(self, directory: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """Actually convert all files in a directory to prefixed form."""
        target = Path(directory)
        out_dir = Path(output_dir) if output_dir else target / '_quantum'
        out_dir.mkdir(parents=True, exist_ok=True)

        converted = []
        errors = []
        skip_dirs = {'.git', 'node_modules', '__pycache__', '.venv', '_quantum'}

        for p in target.rglob('*'):
            if p.is_file() and not any(sd in p.parts for sd in skip_dirs):
                ext = p.suffix.lower()
                lang = self.prefix.LANG_MAP.get(ext)
                if lang:
                    try:
                        result = self.prefix.prefix_file(str(p))
                        # Write prefixed version
                        rel = p.relative_to(target)
                        out_path = out_dir / rel
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(out_path, 'w') as f:
                            f.write(result['prefixed'])
                        converted.append({
                            'path': str(rel),
                            'language': lang,
                            'coverage': result['coverage'],
                            'lines': result['lines'],
                        })
                    except Exception as e:
                        errors.append({'path': str(p), 'error': str(e)})

        return {
            'converted': len(converted),
            'errors': len(errors),
            'output_dir': str(out_dir),
            'files': converted,
            'error_details': errors,
        }


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  SECTION 8 — HTTP + WebSocket SERVER                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# Shared state
prefix_engine = QuantumPrefixEngine()
exec_engine = ExecutionEngine()
ai_layer = AIInferenceLayer()
diff_engine = QuantumDiffEngine(prefix_engine)
agent_bus = AgentBus()
session_store = SessionStore()
roadmap_engine = ConversionRoadmap(prefix_engine)
security_scanner = SecurityScanner(prefix_engine)
git_hook_engine = GitHookEngine(prefix_engine, diff_engine)
quantum_position = [0, 0, 0]
cells: List[Dict[str, Any]] = []  # In-memory cell store

# Register default agents
agent_bus.register_agent("code-agent", AgentRole.CODE, ["python", "javascript", "rust"])
agent_bus.register_agent("review-agent", AgentRole.REVIEW, ["diff", "lint", "security"])
agent_bus.register_agent("prefix-agent", AgentRole.PREFIX, ["convert", "scan", "weight"])
agent_bus.register_agent("deploy-agent", AgentRole.DEPLOY, ["docker", "uv", "npm"])
agent_bus.register_agent("test-agent", AgentRole.TEST, ["pytest", "jest", "cargo-test"])


async def handle_http(reader, writer):
    """Minimal async HTTP server — no dependencies required."""
    try:
        request_line = await asyncio.wait_for(reader.readline(), timeout=10)
        if not request_line:
            writer.close()
            return

        method, path, _ = request_line.decode().strip().split(' ', 2)

        # Read headers
        headers = {}
        content_length = 0
        while True:
            line = await reader.readline()
            if line == b'\r\n' or not line:
                break
            key, val = line.decode().strip().split(': ', 1)
            headers[key.lower()] = val
            if key.lower() == 'content-length':
                content_length = int(val)

        # Read body
        body = b''
        if content_length > 0:
            body = await reader.read(content_length)

        # CORS headers
        cors = (
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type\r\n"
        )

        if method == 'OPTIONS':
            writer.write(f"HTTP/1.1 204 No Content\r\n{cors}\r\n".encode())
            await writer.drain()
            writer.close()
            return

        # Route
        response = await route_request(method, path, body, headers)
        resp_body = json.dumps(response, default=str).encode()

        writer.write(
            f"HTTP/1.1 200 OK\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(resp_body)}\r\n"
            f"{cors}\r\n".encode()
            + resp_body
        )
        await writer.drain()
    except Exception as e:
        try:
            err = json.dumps({'error': str(e)}).encode()
            writer.write(
                f"HTTP/1.1 500 Internal Server Error\r\n"
                f"Content-Type: application/json\r\n"
                f"Content-Length: {len(err)}\r\n"
                f"Access-Control-Allow-Origin: *\r\n\r\n".encode()
                + err
            )
            await writer.drain()
        except Exception:
            pass
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def route_request(method: str, path: str, body: bytes, headers: dict) -> dict:
    """Route HTTP requests to handlers."""
    global quantum_position, cells
    data = {}
    if body:
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {}

    # ── STATUS ──────────────────────────────────────
    if path == '/api/status':
        return {
            'status': 'running',
            'version': '2.0.0',
            'quantum_position': quantum_position,
            'cells': len(cells),
            'executions': exec_engine.execution_count,
            'ai_models': ai_layer.list_models(),
            'agents': agent_bus.list_agents(),
            'tinygrad': TINYGRAD_AVAILABLE,
            'numpy': NUMPY_AVAILABLE,
            'languages': prefix_engine.supported_languages(),
            'sessions': len(session_store.list_sessions()),
        }

    # ── EXECUTE CODE ────────────────────────────────
    elif path == '/api/execute' and method == 'POST':
        code = data.get('code', '')
        cell_id = data.get('cell_id', str(uuid.uuid4()))
        mode = data.get('mode', 'python')  # python | shell | uv
        if mode == 'shell':
            return exec_engine.execute_shell(code)
        elif mode == 'uv':
            return exec_engine.execute_shell(f"uv run python -c \"{code}\"")
        else:
            return exec_engine.execute(code, cell_id)

    # ── PREFIX CODE ─────────────────────────────────
    elif path == '/api/prefix' and method == 'POST':
        code = data.get('code', '')
        language = data.get('language', 'python')
        prefixed = prefix_engine.prefix_code(code, language)
        return {'prefixed': prefixed, 'language': language}

    # ── PREFIX FILE ─────────────────────────────────
    elif path == '/api/prefix/file' and method == 'POST':
        filepath = data.get('path', '')
        if not filepath or not os.path.exists(filepath):
            return {'error': f'File not found: {filepath}'}
        return prefix_engine.prefix_file(filepath)

    # ── CELLS ───────────────────────────────────────
    elif path == '/api/cells':
        if method == 'GET':
            return {'cells': cells}
        elif method == 'POST':
            cell = {
                'id': data.get('id', str(uuid.uuid4())),
                'type': data.get('type', 'code'),
                'content': data.get('content', ''),
                'output': None,
                'execution_count': 0,
                'quantum_position': list(quantum_position),
                'created_at': datetime.now().isoformat(),
            }
            cells.append(cell)
            return {'cell': cell}

    # ── NAVIGATE ────────────────────────────────────
    elif path == '/api/navigate' and method == 'POST':
        dx = data.get('dx', 0)
        dy = data.get('dy', 0)
        dz = data.get('dz', 0)
        quantum_position[0] += dx
        quantum_position[1] += dy
        quantum_position[2] += dz
        return {'position': quantum_position}

    # ── DIFF ────────────────────────────────────────
    elif path == '/api/diff' and method == 'POST':
        old = data.get('old', '')
        new = data.get('new', '')
        language = data.get('language', 'python')
        return diff_engine.diff_code(old, new, language)

    # ── AI INFERENCE ────────────────────────────────
    elif path == '/api/ai' and method == 'POST':
        prompt = data.get('prompt', '')
        model = data.get('model')
        return await ai_layer.infer(prompt, model)

    # ── AI MODELS ───────────────────────────────────
    elif path == '/api/ai/models':
        return {'models': ai_layer.list_models()}

    # ── AGENTS ──────────────────────────────────────
    elif path == '/api/agents':
        if method == 'GET':
            return {'agents': agent_bus.list_agents()}
        elif method == 'POST':
            name = data.get('name', '')
            role = data.get('role', 'code')
            agent_bus.register_agent(name, AgentRole(role), data.get('capabilities', []))
            return {'registered': True, 'name': name}

    elif path == '/api/agents/send' and method == 'POST':
        msg = AgentMessage(
            sender=data.get('sender', 'user'),
            receiver=data.get('receiver', ''),
            action=data.get('action', ''),
            payload=data.get('payload', {}),
            quantum_coords=data.get('quantum_coords', quantum_position),
        )
        return agent_bus.send_message(msg)

    elif path == '/api/agents/log':
        return {'messages': agent_bus.get_message_log()}

    # ── SESSIONS ────────────────────────────────────
    elif path == '/api/sessions':
        if method == 'GET':
            return {'sessions': session_store.list_sessions()}
        elif method == 'POST':
            sid = data.get('id', str(uuid.uuid4())[:8])
            session_store.save(sid, data)
            return {'saved': True, 'id': sid}

    elif path.startswith('/api/sessions/') and method == 'GET':
        sid = path.split('/')[-1]
        session = session_store.load(sid)
        if session:
            return session
        return {'error': f'Session not found: {sid}'}

    # ── ROADMAP SCAN ────────────────────────────────
    elif path == '/api/roadmap/scan' and method == 'POST':
        directory = data.get('directory', '.')
        return roadmap_engine.scan_directory(directory)

    elif path == '/api/roadmap/convert' and method == 'POST':
        directory = data.get('directory', '.')
        output = data.get('output_dir')
        return roadmap_engine.convert_directory(directory, output)

    # ── LANGUAGES ───────────────────────────────────
    elif path == '/api/languages':
        return {'languages': prefix_engine.supported_languages()}

    # ── SECURITY SCANNING ─────────────────────────
    elif path == '/api/security/scan' and method == 'POST':
        code = data.get('code')
        filepath = data.get('path')
        directory = data.get('directory')
        language = data.get('language', 'python')
        if directory:
            return security_scanner.scan_directory(directory)
        elif filepath:
            return security_scanner.scan_file(filepath)
        elif code:
            return security_scanner.scan_code(code, language)
        else:
            return {'error': 'Provide code, path, or directory to scan'}

    elif path == '/api/security/rules':
        return {'rules': {lang: [r['desc'] for r in rules]
                          for lang, rules in SecurityScanner.RULES.items()}}

    # ── GIT HOOKS ─────────────────────────────────
    elif path == '/api/git/hook' and method == 'GET':
        return {'hook': git_hook_engine.generate_pre_commit_hook()}

    elif path == '/api/git/hook/install' and method == 'POST':
        repo_dir = data.get('repo', '.')
        return git_hook_engine.install_pre_commit_hook(repo_dir)

    elif path == '/api/git/diff-report' and method == 'POST':
        old = data.get('old', '')
        new = data.get('new', '')
        language = data.get('language', 'python')
        filename = data.get('filename', '')
        return git_hook_engine.pr_diff_report(old, new, language, filename)

    # ── 404 ─────────────────────────────────────────
    else:
        return {'error': f'Not found: {method} {path}', 'endpoints': [
            'GET  /api/status',
            'POST /api/execute',
            'POST /api/prefix',
            'POST /api/prefix/file',
            'GET  /api/cells',
            'POST /api/cells',
            'POST /api/navigate',
            'POST /api/diff',
            'POST /api/ai',
            'GET  /api/ai/models',
            'GET  /api/agents',
            'POST /api/agents',
            'POST /api/agents/send',
            'GET  /api/agents/log',
            'GET  /api/sessions',
            'POST /api/sessions',
            'GET  /api/sessions/{id}',
            'POST /api/roadmap/scan',
            'POST /api/roadmap/convert',
            'GET  /api/languages',
            'POST /api/security/scan',
            'GET  /api/security/rules',
            'GET  /api/git/hook',
            'POST /api/git/hook/install',
            'POST /api/git/diff-report',
        ]}


# ── WebSocket server (using websockets library) ────

import websockets
import websockets.server

ws_clients: set = set()

async def ws_handler(websocket):
    """Handle WebSocket connections using the websockets library."""
    ws_clients.add(websocket)
    logger.info(f"WebSocket client connected ({len(ws_clients)} total)")

    # Send init message
    try:
        await websocket.send(json.dumps({
            'type': 'init',
            'position': quantum_position,
            'status': 'connected',
            'ai_models': ai_layer.list_models(),
            'agents': agent_bus.list_agents(),
        }, default=str))
    except Exception as e:
        logger.error(f"Failed to send init: {e}")

    try:
        async for message in websocket:
            try:
                msg = json.loads(message)
                response = await handle_ws_message(msg)
                if response:
                    await websocket.send(json.dumps(response, default=str))
            except json.JSONDecodeError:
                await websocket.send(json.dumps({'error': 'Invalid JSON'}))
    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        ws_clients.discard(websocket)
        logger.info(f"WebSocket client disconnected ({len(ws_clients)} remaining)")


async def ws_broadcast(data: dict):
    """Broadcast to all connected WebSocket clients."""
    if not ws_clients:
        return
    payload = json.dumps(data, default=str)
    dead = set()
    for client in ws_clients:
        try:
            await client.send(payload)
        except Exception:
            dead.add(client)
    ws_clients -= dead


async def handle_ws_message(msg: dict) -> Optional[dict]:
    """Handle incoming WebSocket message."""
    global quantum_position
    msg_type = msg.get('type', '')

    if msg_type == 'execute':
        code = msg.get('code', '')
        cell_id = msg.get('cell_id', '')
        mode = msg.get('mode', 'python')
        if mode == 'shell':
            result = exec_engine.execute_shell(code)
        elif mode == 'uv':
            result = exec_engine.execute_shell(f"uv run python -c \"{code}\"")
        else:
            result = exec_engine.execute(code, cell_id)
        result['type'] = 'execution-result'
        # Broadcast to all clients
        await ws_broadcast(result)
        return result

    elif msg_type == 'navigate':
        quantum_position[0] += msg.get('dx', 0)
        quantum_position[1] += msg.get('dy', 0)
        quantum_position[2] += msg.get('dz', 0)
        update = {'type': 'position-changed', 'position': quantum_position}
        await ws_broadcast(update)
        return update

    elif msg_type == 'prefix':
        code = msg.get('code', '')
        language = msg.get('language', 'python')
        prefixed = prefix_engine.prefix_code(code, language)
        return {'type': 'prefix-result', 'prefixed': prefixed}

    elif msg_type == 'ai':
        prompt = msg.get('prompt', '')
        model = msg.get('model')
        result = await ai_layer.infer(prompt, model)
        result['type'] = 'ai-result'
        return result

    elif msg_type == 'ping':
        return {'type': 'pong', 'timestamp': datetime.now().isoformat()}

    return {'type': 'error', 'message': f'Unknown message type: {msg_type}'}


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  MAIN                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

async def main():
    banner = f"""
╔══════════════════════════════════════════════════════════╗
║  UV-Speed Quantum Execution Bridge                       ║
║  HTTP API:    http://localhost:{HTTP_PORT}                     ║
║  WebSocket:   ws://localhost:{WS_PORT}                        ║
╠══════════════════════════════════════════════════════════╣
║  Engines:                                                ║
║    Prefix:  18 languages · 9-symbol system               ║
║    Exec:    Python + shell + uv run                      ║
║    AI:      {'tinygrad ·' if TINYGRAD_AVAILABLE else ''} {'numpy ·' if NUMPY_AVAILABLE else ''} Ollama · OpenAI · Anthropic  ║
║    Diff:    Prefix-aware quantum coordinate diffs        ║
║    Agents:  {len(agent_bus.agents)} registered (code, review, prefix, deploy, test)   ║
║    Storage: JSON sessions in .quantum_sessions/          ║
╚══════════════════════════════════════════════════════════╝
"""
    print(banner)

    http_server = await asyncio.start_server(handle_http, '0.0.0.0', HTTP_PORT)
    logger.info(f"HTTP server listening on port {HTTP_PORT}")

    ws_server = await websockets.serve(ws_handler, '0.0.0.0', WS_PORT)
    logger.info(f"WebSocket server listening on port {WS_PORT}")

    async with http_server:
        await asyncio.gather(
            http_server.serve_forever(),
            asyncio.Future(),  # Keep running alongside websockets server
        )


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutting down")
