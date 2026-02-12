#!/usr/bin/env python3
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
"""
UV-Speed Quantum Execution Bridge Server v3.3
==============================================
WebSocket + HTTP server bridging the web notepad to real code execution,
AI inference, quantum prefix parsing, agent API, instance management,
and MCP-compatible tool serving.

55+ API endpoints across 9 categories:
  - Core: execute, prefix, navigate, diff, cells
  - AI: tinygrad prefix classifier, Ollama (dynamic model picker), OpenAI, Anthropic
  - Agents: 5-agent bus with role-based dispatch
  - Sessions: JSON persistence for notebooks
  - Instances: QubesOS-style isolated window management + cross-instance messaging
  - Security: prefix-aware static analysis + severity scoring
  - Git: pre-commit hooks + PR quantum diff reports
  - Tools: 14-tool command palette + Day CLI integration
  - Cross-project: ChartGPU, Quest Hub, Jawta, Lark, Media Pipeline

Companion files:
  - mcp_server.py — MCP protocol wrapper (10 tools, stdio transport)
  - main.js — Electron multi-instance desktop app (WindowRegistry)
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
        self.ollama_endpoint = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
        self.ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3.2')

        # Tinygrad (local, if available)
        if TINYGRAD_AVAILABLE:
            self.models['tinygrad-local'] = AIModelConfig(
                name='tinygrad-local',
                framework=ModelFramework.TINYGRAD,
            )
        # Tinygrad prefix classifier (always available as fallback)
        self.models['tinygrad-prefix'] = AIModelConfig(
            name='tinygrad-prefix',
            framework=ModelFramework.TINYGRAD,
        )
        # Ollama (local LLM server)
        self.models['ollama-default'] = AIModelConfig(
            name='ollama-default',
            framework=ModelFramework.OLLAMA,
            endpoint=self.ollama_endpoint,
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

    async def discover_ollama_models(self) -> List[Dict[str, Any]]:
        """Query Ollama API for all locally installed models."""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.ollama_endpoint}/api/tags",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        models = data.get('models', [])
                        # Register each discovered model
                        for m in models:
                            name = m.get('name', '')
                            key = f"ollama-{name.replace(':', '-')}"
                            if key not in self.models:
                                self.models[key] = AIModelConfig(
                                    name=key,
                                    framework=ModelFramework.OLLAMA,
                                    endpoint=self.ollama_endpoint,
                                )
                        return [
                            {
                                'name': m.get('name', ''),
                                'size': m.get('size', 0),
                                'modified_at': m.get('modified_at', ''),
                                'parameter_size': m.get('details', {}).get('parameter_size', ''),
                                'quantization': m.get('details', {}).get('quantization_level', ''),
                                'family': m.get('details', {}).get('family', ''),
                            }
                            for m in models
                        ]
                    return []
        except Exception as e:
            logger.warning(f"Ollama discovery failed: {e}")
            return []

    def set_ollama_model(self, model_name: str):
        """Switch the default Ollama model."""
        self.ollama_model = model_name
        logger.info(f"Ollama model set to: {model_name}")

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

    async def _infer_ollama(self, config: AIModelConfig, prompt: str, model_override: Optional[str] = None) -> Dict[str, Any]:
        """Ollama local inference with dynamic model selection."""
        try:
            import aiohttp
            # Determine which model to use:
            # 1. Explicit override from API call
            # 2. Model extracted from config name (e.g. "ollama-codellama" → "codellama")
            # 3. Default self.ollama_model (env or llama3.2)
            if model_override:
                model = model_override
            elif config.name.startswith('ollama-') and config.name != 'ollama-default':
                model = config.name.replace('ollama-', '').replace('-', ':')
            else:
                model = self.ollama_model

            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{config.endpoint or self.ollama_endpoint}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as resp:
                    data = await resp.json()
                    return {
                        'text': data.get('response', ''),
                        'model': f'ollama/{model}',
                        'elapsed_ms': data.get('total_duration', 0) / 1e6,
                    }
        except Exception as e:
            return {'error': f'Ollama: {e}', 'text': ''}

    # ── Prefix classification categories and their feature index ──
    PREFIX_CATEGORIES = [
        'shebang', 'comment', 'import', 'class', 'function', 'error',
        'condition', 'loop', 'return', 'output', 'variable', 'decorator', 'default',
    ]
    PREFIX_SYMBOLS = {
        'shebang': 'n:', 'comment': '+1:', 'import': '-n:', 'class': '+0:',
        'function': '0:', 'error': '-1:', 'condition': '+n:', 'loop': '+2:',
        'return': '-0:', 'output': '+3:', 'variable': '1:', 'decorator': '+1:',
        'default': '   ',
    }
    # Feature extraction keywords per category (used to build feature vectors)
    _FEATURE_KEYWORDS = {
        'shebang':   ['#!/', 'env python', 'env node', 'env bash'],
        'comment':   ['#', '//', '/*', '*/', '"""', "'''", '--'],
        'import':    ['import ', 'from ', 'require(', '#include', 'use ', '@import'],
        'class':     ['class ', 'struct ', 'interface ', 'enum ', 'type '],
        'function':  ['def ', 'fn ', 'func ', 'function ', 'pub fn', 'async def', '=>'],
        'error':     ['try', 'except', 'catch', 'finally', 'raise', 'throw', 'Error'],
        'condition': ['if ', 'elif', 'else', 'switch', 'case ', 'match '],
        'loop':      ['for ', 'while ', 'loop ', 'each', 'do {', '.forEach'],
        'return':    ['return ', 'yield ', 'yield*'],
        'output':    ['print(', 'console.', 'println!', 'fmt.Print', 'echo ', 'log('],
        'variable':  ['let ', 'const ', 'var ', 'mut ', '= ', ':='],
        'decorator': ['@'],
    }

    def _extract_features(self, line: str) -> list:
        """Extract a feature vector from a code line for prefix classification.
        Returns a list of floats: [indent_depth, line_length, is_empty, *keyword_scores]
        """
        stripped = line.lstrip()
        indent = len(line) - len(stripped) if line else 0
        features = [
            min(indent / 12.0, 1.0),           # normalized indent depth
            min(len(line) / 120.0, 1.0),        # normalized line length
            1.0 if not stripped else 0.0,        # is empty/whitespace
        ]
        # Keyword match scores per category
        for cat in self.PREFIX_CATEGORIES[:-1]:  # exclude 'default'
            keywords = self._FEATURE_KEYWORDS.get(cat, [])
            score = 0.0
            for kw in keywords:
                if kw in stripped or kw in line:
                    score = max(score, 1.0)
                elif kw.lower() in stripped.lower():
                    score = max(score, 0.5)
            features.append(score)
        return features

    def _infer_tinygrad(self, prompt: str) -> Dict[str, Any]:
        """
        Tinygrad prefix classifier — classifies code lines using learned
        weight matrices for the beyondBINARY 9-symbol system.
        Falls back to numpy if tinygrad isn't available.
        """
        t0 = time.perf_counter()
        lines = prompt.split('\n')
        num_features = 3 + len(self.PREFIX_CATEGORIES) - 1  # 15 features
        num_classes = len(self.PREFIX_CATEGORIES)            # 13 categories

        # Build feature matrix for all lines
        feature_matrix = [self._extract_features(line) for line in lines]

        try:
            if TINYGRAD_AVAILABLE:
                # ── Real tinygrad inference ──
                X = TinyTensor(feature_matrix)  # (N, 15)

                # Weight matrix: learned mapping from features → prefix categories
                # Initialization: identity-like diagonal mapping with bias for keyword matches
                W_data = []
                for c_idx in range(num_classes):
                    row = [0.0] * num_features
                    # Bias toward keyword match for this category (features 3..14)
                    if c_idx < num_classes - 1:
                        feat_idx = 3 + c_idx
                        if feat_idx < num_features:
                            row[feat_idx] = 5.0  # strong signal for keyword match
                    else:
                        # Default category: slight bias for empty/unmatched lines
                        row[2] = 3.0   # empty line → default
                        row[0] = -0.5  # low indent → slightly more likely default
                    W_data.append(row)

                W = TinyTensor(W_data).transpose()  # (15, 13)
                bias = TinyTensor([0.0] * num_classes)

                logits = X.matmul(W) + bias  # (N, 13)
                probs = logits.softmax(axis=-1).numpy()

                classifications = []
                for i, line in enumerate(lines):
                    cat_idx = int(probs[i].argmax())
                    cat = self.PREFIX_CATEGORIES[cat_idx]
                    symbol = self.PREFIX_SYMBOLS[cat]
                    confidence = float(probs[i][cat_idx])
                    classifications.append({
                        'line': i + 1,
                        'prefix': symbol,
                        'category': cat,
                        'confidence': round(confidence, 3),
                        'code': line,
                    })
                engine = 'tinygrad'

            elif NUMPY_AVAILABLE:
                # ── Numpy fallback ──
                X = np.array(feature_matrix, dtype=np.float32)
                W_data = np.zeros((num_classes, num_features), dtype=np.float32)
                for c_idx in range(num_classes):
                    if c_idx < num_classes - 1:
                        feat_idx = 3 + c_idx
                        if feat_idx < num_features:
                            W_data[c_idx, feat_idx] = 5.0
                    else:
                        W_data[c_idx, 2] = 3.0
                        W_data[c_idx, 0] = -0.5

                logits = X @ W_data.T  # (N, 13)
                exp_l = np.exp(logits - logits.max(axis=1, keepdims=True))
                probs = exp_l / exp_l.sum(axis=1, keepdims=True)

                classifications = []
                for i, line in enumerate(lines):
                    cat_idx = int(probs[i].argmax())
                    cat = self.PREFIX_CATEGORIES[cat_idx]
                    symbol = self.PREFIX_SYMBOLS[cat]
                    confidence = float(probs[i][cat_idx])
                    classifications.append({
                        'line': i + 1,
                        'prefix': symbol,
                        'category': cat,
                        'confidence': round(confidence, 3),
                        'code': line,
                    })
                engine = 'numpy'
            else:
                return {'error': 'Neither tinygrad nor numpy available', 'text': ''}

            # Format output as prefixed code
            prefixed_lines = []
            for c in classifications:
                prefixed_lines.append(f"{c['prefix']:>4s}{c['line']:>3d}  {c['code']}")

            elapsed = round((time.perf_counter() - t0) * 1000, 2)
            return {
                'text': '\n'.join(prefixed_lines),
                'model': f'tinygrad-prefix/{engine}',
                'engine': engine,
                'classifications': classifications,
                'lines': len(lines),
                'elapsed_ms': elapsed,
                'categories_used': list(set(c['category'] for c in classifications)),
            }

        except Exception as e:
            return {'error': f'tinygrad prefix classifier: {e}', 'text': ''}

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
            {
                'name': c.name,
                'framework': c.framework.value,
                'status': 'available',
                'default': c.name == 'ollama-default' and self.ollama_model or None,
            }
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
# ║  SECTION 6b — INSTANCE MANAGER (QubesOS-style)                         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class InstanceManager:
    """
    Tracks connected instances (Electron windows, browser tabs, etc.)
    and manages cross-instance messaging via WebSocket rooms.
    Each instance is isolated — the bridge server is the shared brain.
    """

    def __init__(self):
        self.instances: Dict[str, Dict[str, Any]] = {}
        self.message_log: List[Dict[str, Any]] = []

    def register(self, instance_id: str, page: str, ws=None) -> Dict[str, Any]:
        """Register a new instance connection."""
        entry = {
            'id': instance_id,
            'page': page,
            'connected_at': datetime.now().isoformat(),
            'last_seen': datetime.now().isoformat(),
            'ws': ws,  # WebSocket reference (not serialized)
            'state': {},
        }
        self.instances[instance_id] = entry
        logger.info(f"Instance registered: {instance_id} ({page}) — {len(self.instances)} total")
        return {k: v for k, v in entry.items() if k != 'ws'}

    def unregister(self, instance_id: str) -> bool:
        """Remove an instance."""
        if instance_id in self.instances:
            del self.instances[instance_id]
            logger.info(f"Instance unregistered: {instance_id} — {len(self.instances)} remaining")
            return True
        return False

    def heartbeat(self, instance_id: str):
        """Update last_seen timestamp."""
        if instance_id in self.instances:
            self.instances[instance_id]['last_seen'] = datetime.now().isoformat()

    def set_state(self, instance_id: str, state: Dict[str, Any]):
        """Store instance-specific state (cells, position, etc.)."""
        if instance_id in self.instances:
            self.instances[instance_id]['state'] = state

    def get_state(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve instance state."""
        entry = self.instances.get(instance_id)
        if entry:
            return entry.get('state', {})
        return None

    def list_instances(self) -> List[Dict[str, Any]]:
        """List all registered instances (without ws references)."""
        return [
            {k: v for k, v in inst.items() if k != 'ws'}
            for inst in self.instances.values()
        ]

    def send_message(self, from_id: str, to_id: str, channel: str, data: Any) -> bool:
        """Send a message between instances via their WebSocket connections."""
        msg = {
            'type': 'instance-message',
            'from': from_id,
            'to': to_id,
            'channel': channel,
            'data': data,
            'timestamp': datetime.now().isoformat(),
        }
        self.message_log.append(msg)
        if len(self.message_log) > 500:
            self.message_log = self.message_log[-250:]

        if to_id == '*':
            # Broadcast to all
            for inst in self.instances.values():
                ws = inst.get('ws')
                if ws:
                    try:
                        ws.send(json.dumps(msg))
                    except Exception:
                        pass
            return True
        else:
            target = self.instances.get(to_id)
            if target and target.get('ws'):
                try:
                    target['ws'].send(json.dumps(msg))
                    return True
                except Exception:
                    return False
        return False

    def save_layout(self) -> List[Dict[str, str]]:
        """Export current instance layout for persistence."""
        return [
            {'id': inst['id'], 'page': inst['page']}
            for inst in self.instances.values()
        ]

    def get_message_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent cross-instance messages."""
        return self.message_log[-limit:]


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
instance_mgr = InstanceManager()
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


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  EXTERNAL TOOL INTEGRATION HANDLERS                                      ║
# ║  ChartGPU · Day CLI · Quest Hub · Jawta · Lark · Media Pipeline         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# ── Config paths ─────────────────────────────────
DAY_DIR = Path("/Users/tref/day")
QUEST_HUB_URL = "http://localhost:3000"
CHARTGPU_URL = "http://localhost:3444"
COMMANDS_JSON_PATHS = [
    Path("/Users/tref/uvspeed/src/commands.json"),
    Path("/Users/tref/MetaQuestDev/Projects/Templates/synced-app/shared/commands.json"),
]
JAWTA_DIR = Path("/Users/tref/Documents/figma/jawta+sigintel")
LARK_DIR = Path("/Users/tref/lark")


# ── Helper: run subprocess async ─────────────────
async def _run_subprocess(cmd, timeout=30):
    """Run a shell command asynchronously, return stdout/stderr."""
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return {
            'exit_code': proc.returncode,
            'stdout': stdout.decode(errors='replace').strip(),
            'stderr': stderr.decode(errors='replace').strip(),
        }
    except asyncio.TimeoutError:
        return {'exit_code': -1, 'stdout': '', 'stderr': f'Command timed out after {timeout}s'}
    except Exception as e:
        return {'exit_code': -1, 'stdout': '', 'stderr': str(e)}


# ── Helper: HTTP proxy to external service ───────
async def _http_proxy(base_url, method, path, data=None, timeout=10):
    """Proxy an HTTP request to an external service."""
    import urllib.request
    import urllib.error
    url = f"{base_url}{path}"
    try:
        body_bytes = json.dumps(data).encode() if data else None
        req = urllib.request.Request(
            url, data=body_bytes, method=method,
            headers={'Content-Type': 'application/json'} if body_bytes else {},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        return {'error': f'Service unavailable at {base_url}: {e.reason}', 'online': False}
    except Exception as e:
        return {'error': str(e), 'online': False}


# ═══════════════════════════════════════════════════
#   CHARTGPU HANDLERS
# ═══════════════════════════════════════════════════

_chartgpu_history = []  # in-memory metrics ring buffer

async def _chartgpu_status():
    """Check if ChartGPU server is running at :3444."""
    result = await _http_proxy(CHARTGPU_URL, 'GET', '/api/status')
    if 'error' in result:
        return {'online': False, 'url': CHARTGPU_URL, 'message': 'ChartGPU server not running. Start with: cd /Users/tref/day && node chartgpu-server.js'}
    result['online'] = True
    result['url'] = CHARTGPU_URL
    return result

async def _chartgpu_metrics():
    """Get current system metrics with AI trend analysis."""
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        metrics = {
            'cpu': cpu,
            'memory': mem.percent,
            'memory_used_gb': round(mem.used / (1024**3), 2),
            'memory_total_gb': round(mem.total / (1024**3), 2),
            'gpu': 0,  # placeholder — real GPU via ChartGPU WebSocket
            'timestamp': datetime.now().isoformat(),
        }
        _chartgpu_history.append(metrics)
        if len(_chartgpu_history) > 120:
            _chartgpu_history.pop(0)
        return {'metrics': metrics, 'history_size': len(_chartgpu_history)}
    except ImportError:
        return {'error': 'psutil not available', 'metrics': {'cpu': 0, 'memory': 0, 'gpu': 0}}

async def _chartgpu_analyze(data):
    """AI-powered trend analysis of metrics history."""
    window = data.get('window', 10)
    history = _chartgpu_history[-window:] if _chartgpu_history else []
    if len(history) < 3:
        return {'status': 'insufficient_data', 'message': f'Need at least 3 data points, have {len(history)}'}

    def trend(key):
        vals = [m.get(key, 0) for m in history]
        n = len(vals)
        if n < 2:
            return 0.0
        x_sum = sum(range(n))
        y_sum = sum(vals)
        xy_sum = sum(i * vals[i] for i in range(n))
        x2_sum = sum(i * i for i in range(n))
        denom = n * x2_sum - x_sum * x_sum
        return (n * xy_sum - x_sum * y_sum) / denom if denom else 0.0

    insights = []
    alerts = []
    cpu_t, mem_t = trend('cpu'), trend('memory')
    latest = history[-1]
    if cpu_t > 5:
        insights.append('CPU trending upward — check active processes')
    if latest.get('cpu', 0) > 80:
        alerts.append({'level': 'warning', 'msg': 'High CPU usage'})
    if mem_t > 3:
        insights.append('Memory climbing — potential leak')

    return {
        'status': 'analyzed',
        'trends': {'cpu': round(cpu_t, 2), 'memory': round(mem_t, 2)},
        'insights': insights,
        'alerts': alerts,
        'predictions': {
            'cpu_5min': min(100, max(0, latest.get('cpu', 0) + cpu_t * 2)),
            'memory_5min': min(100, max(0, latest.get('memory', 0) + mem_t * 2)),
        },
        'data_points': len(history),
    }

async def _chartgpu_push_config(data):
    """Push chart configuration to ChartGPU server."""
    return await _http_proxy(CHARTGPU_URL, 'POST', '/api/chart/config', data)


# ═══════════════════════════════════════════════════
#   DAY TOOL HANDLERS
# ═══════════════════════════════════════════════════

async def _day_kbatch(data):
    """Run kbatch keyboard analysis on provided text."""
    text = data.get('text', '')
    mode = data.get('mode', 'analyze')  # analyze | quantum | neural
    if not text:
        return {'error': 'No text provided'}

    # Write text to temp file, run kbatch
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(text)
        tmp = f.name
    try:
        cmd = f"cd {DAY_DIR} && python3 train/keyboard/kbatch.py {mode} {tmp} 2>&1"
        result = await _run_subprocess(cmd, timeout=30)
        return {
            'tool': 'kbatch',
            'mode': mode,
            'input_length': len(text),
            'output': result['stdout'] or result['stderr'],
            'exit_code': result['exit_code'],
        }
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass

async def _day_signal(data):
    """Run Jawta signal analysis (Morse/binary/waveform)."""
    text = data.get('text', '')
    if not text:
        return {'error': 'No text provided'}

    # Use JawtaSignalUtils from day_cli.py inline
    morse_map = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', ' ': '/',
    }
    morse = ' '.join(morse_map.get(c.upper(), '?') for c in text)
    binary = ' '.join(format(ord(c), '08b') for c in text)
    freq_base = 440
    waveform = [{'char': c, 'freq': freq_base + (ord(c) % 64) * 8, 'morse': morse_map.get(c.upper(), '?')} for c in text[:100]]

    return {
        'tool': 'signal',
        'input': text[:200],
        'morse': morse,
        'binary': binary,
        'waveform': waveform,
        'char_count': len(text),
    }

async def _day_geokey(data):
    """Run geometric keyboard mapping."""
    text = data.get('text', '')
    layout = data.get('layout', 'hex')  # hex | star | contrails
    cmd = f"cd {DAY_DIR} && python3 geometric_keyboard_mapper.py --layout {layout} --text '{text[:200]}' 2>&1"
    result = await _run_subprocess(cmd, timeout=15)
    if result['exit_code'] != 0:
        # Fallback: generate simple hex grid mapping inline
        hex_grid = {}
        for i, c in enumerate(set(text.upper())):
            row, col = divmod(i, 6)
            hex_grid[c] = {'row': row, 'col': col, 'hex_x': col * 1.5, 'hex_y': row * 1.732}
        return {'tool': 'geokey', 'layout': layout, 'mapping': hex_grid, 'fallback': True}
    return {'tool': 'geokey', 'layout': layout, 'output': result['stdout'], 'exit_code': result['exit_code']}

async def _day_youtube(data):
    """Fetch YouTube transcript."""
    url = data.get('url', '')
    if not url:
        return {'error': 'No URL provided'}
    cmd = f"cd {DAY_DIR} && python3 youtube_transcript.py '{url}' 2>&1"
    result = await _run_subprocess(cmd, timeout=60)
    return {
        'tool': 'youtube_transcript',
        'url': url,
        'transcript': result['stdout'],
        'exit_code': result['exit_code'],
        'error': result['stderr'] if result['exit_code'] != 0 else None,
    }


# ═══════════════════════════════════════════════════
#   TOOLS REGISTRY
# ═══════════════════════════════════════════════════

def _load_commands_json():
    """Load unified commands registry from available JSON files."""
    merged = {'commands': {}, 'categories': {}, 'quickCommands': {}}
    for p in COMMANDS_JSON_PATHS:
        if p.exists():
            try:
                with open(p) as f:
                    data = json.load(f)
                merged['commands'].update(data.get('commands', {}))
                merged['categories'].update(data.get('categories', {}))
                merged['quickCommands'].update(data.get('quickCommands', {}))
            except Exception:
                pass
    return merged

def _tools_list():
    """Return all registered tools grouped by category."""
    registry = _load_commands_json()
    # Add built-in uvspeed tools
    registry['commands']['uvspeed'] = {
        'name': 'uvspeed Quantum Tools',
        'description': 'Built-in quantum bridge tools',
        'basePath': '/Users/tref/uvspeed',
        'commands': {
            'uv-bridge': {'command': 'cd /Users/tref/uvspeed && python3 quantum_bridge_server.py', 'description': 'Start quantum bridge server', 'category': 'uvspeed'},
            'uv-kbatch': {'command': 'POST /api/day/kbatch', 'description': 'Keyboard analysis via bridge', 'category': 'uvspeed', 'api': True},
            'uv-signal': {'command': 'POST /api/day/signal', 'description': 'Signal analysis via bridge', 'category': 'uvspeed', 'api': True},
            'uv-youtube': {'command': 'POST /api/day/youtube', 'description': 'YouTube transcript via bridge', 'category': 'uvspeed', 'api': True},
            'uv-chartgpu': {'command': 'POST /api/chartgpu/metrics', 'description': 'ChartGPU metrics via bridge', 'category': 'uvspeed', 'api': True},
            'uv-quest': {'command': 'GET /api/quest/status', 'description': 'Quest device status via bridge', 'category': 'uvspeed', 'api': True},
        },
    }
    registry['categories']['uvspeed'] = {'name': 'uvspeed', 'icon': '⚛', 'color': '#7c3aed'}
    return registry

async def _tools_exec(data):
    """Execute a registered tool command by ID."""
    command_id = data.get('id', '')
    args = data.get('args', '')
    registry = _load_commands_json()
    # Search all groups for the command
    for group in registry['commands'].values():
        cmds = group.get('commands', {})
        if command_id in cmds:
            cmd_def = cmds[command_id]
            if cmd_def.get('api'):
                return {'error': 'API-only command — call the endpoint directly', 'endpoint': cmd_def['command']}
            cmd = cmd_def['command']
            if args:
                cmd += f' {args}'
            result = await _run_subprocess(cmd, timeout=60)
            return {'tool': command_id, 'output': result['stdout'], 'stderr': result['stderr'], 'exit_code': result['exit_code']}
    return {'error': f'Command not found: {command_id}'}


# ═══════════════════════════════════════════════════
#   QUEST DEVICE HANDLERS
# ═══════════════════════════════════════════════════

async def _quest_proxy(method, path, data=None):
    """Proxy request to Quest synced-app Hub at :3000."""
    return await _http_proxy(QUEST_HUB_URL, method, path, data, timeout=15)

async def _quest_status():
    """Check Quest Hub connectivity and device status."""
    hub = await _http_proxy(QUEST_HUB_URL, 'GET', '/api/status')
    hub_online = 'error' not in hub

    # Also check ADB directly
    adb_result = await _run_subprocess('adb devices 2>&1', timeout=5)
    devices = []
    if adb_result['exit_code'] == 0:
        for line in adb_result['stdout'].split('\n')[1:]:
            parts = line.strip().split('\t')
            if len(parts) == 2:
                devices.append({'serial': parts[0], 'state': parts[1]})

    return {
        'hub_online': hub_online,
        'hub_url': QUEST_HUB_URL,
        'hub_response': hub if hub_online else None,
        'adb_devices': devices,
        'quest_connected': any(d['state'] == 'device' for d in devices),
    }


# ═══════════════════════════════════════════════════
#   JAWTA / LARK HANDLERS
# ═══════════════════════════════════════════════════

async def _jawta_signal(data):
    """Run jawta signal processing — Morse, frequency analysis."""
    text = data.get('text', '')
    mode = data.get('mode', 'morse')  # morse | binary | steganography
    if not text:
        return {'error': 'No text provided'}

    # Re-use our built-in signal processor (same as _day_signal) plus extras
    base = await _day_signal(data)
    # Add jawta-specific fields
    base['tool'] = 'jawta'
    base['mode'] = mode

    # Frequency spectrum (simplified)
    spectrum = []
    for i, c in enumerate(text[:64]):
        freq = 200 + (ord(c) % 128) * 6
        amplitude = 0.5 + (ord(c) % 10) / 20
        spectrum.append({'index': i, 'freq': freq, 'amplitude': round(amplitude, 3)})
    base['spectrum'] = spectrum
    return base

async def _jawta_audio(data):
    """Generate audio waveform data from text."""
    text = data.get('text', '')
    sample_rate = data.get('sample_rate', 8000)
    if not text:
        return {'error': 'No text provided'}

    import math
    samples = []
    t = 0
    for c in text[:100]:
        freq = 300 + (ord(c) % 100) * 5
        for i in range(int(sample_rate * 0.05)):  # 50ms per char
            samples.append(round(math.sin(2 * math.pi * freq * t / sample_rate) * 0.8, 4))
            t += 1

    return {
        'tool': 'jawta_audio',
        'sample_rate': sample_rate,
        'duration_ms': len(text[:100]) * 50,
        'samples_count': len(samples),
        'samples_preview': samples[:200],  # first 200 samples for visualization
        'text_length': len(text),
    }

def _lark_status():
    """Check Lark IANA availability."""
    lark_exists = LARK_DIR.exists()
    pkg = None
    if lark_exists:
        pkg_path = LARK_DIR / 'package.json'
        if pkg_path.exists():
            try:
                with open(pkg_path) as f:
                    pkg = json.load(f)
            except Exception:
                pass
    return {
        'available': lark_exists,
        'path': str(LARK_DIR),
        'name': pkg.get('name', 'lark') if pkg else 'lark',
        'version': pkg.get('version', 'unknown') if pkg else 'unknown',
        'components': ['editor', 'terminal', 'ai-chat', 'file-manager', 'waveform'] if lark_exists else [],
        'embed_url': 'http://localhost:5173' if lark_exists else None,
    }


# ═══════════════════════════════════════════════════
#   MEDIA PIPELINE HANDLER
# ═══════════════════════════════════════════════════

async def _media_process(data):
    """Orchestrate media processing pipeline."""
    media_type = data.get('type', 'auto')  # audio | video | transcript | spatial
    source = data.get('source', '')
    options = data.get('options', {})

    if not source:
        return {'error': 'No source provided'}

    results = {'pipeline': media_type, 'source': source, 'stages': []}

    if media_type in ('transcript', 'auto') and ('youtube.com' in source or 'youtu.be' in source):
        yt = await _day_youtube({'url': source})
        results['stages'].append({'name': 'youtube_transcript', 'result': yt})
        if media_type == 'auto':
            media_type = 'transcript'

    if media_type in ('audio', 'spatial', 'auto'):
        # Check for spatial audio tools
        sa_path = Path("/Users/tref/MetaQuestDev/directors-lens/research/audio-spatial")
        results['stages'].append({
            'name': 'spatial_audio',
            'available': sa_path.exists(),
            'tools': ['beamforming', 'DOA', 'HRTF', 'classification'] if sa_path.exists() else [],
            'message': 'Spatial audio processing available via Director\'s Lens' if sa_path.exists() else 'Install Director\'s Lens for spatial audio',
        })

    if media_type in ('video', 'auto'):
        # Check for video segmentation tools
        sam2 = Path("/Users/tref/MetaQuestDev/sam2-main")
        results['stages'].append({
            'name': 'video_segmentation',
            'available': sam2.exists(),
            'tools': ['SAM2', 'SAM3', 'ActionMesh', 'SlowFast'] if sam2.exists() else [],
            'message': 'Video segmentation available via MetaQuestDev' if sam2.exists() else 'Install SAM2 for video processing',
        })

    if media_type in ('signal', 'auto'):
        sig = await _jawta_signal({'text': source[:200]})
        results['stages'].append({'name': 'signal_analysis', 'result': sig})

    results['type'] = media_type
    results['stage_count'] = len(results['stages'])
    return results


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
            'version': '3.3.0',
            'quantum_position': quantum_position,
            'cells': len(cells),
            'executions': exec_engine.execution_count,
            'ai_models': ai_layer.list_models(),
            'ollama_default': ai_layer.ollama_model,
            'agents': agent_bus.list_agents(),
            'instances': instance_mgr.list_instances(),
            'tinygrad': TINYGRAD_AVAILABLE,
            'numpy': NUMPY_AVAILABLE,
            'languages': prefix_engine.supported_languages(),
            'sessions': len(session_store.list_sessions()),
            'mcp': {
                'server': 'src/01-core/mcp_server.py',
                'tools': 10,
                'transport': 'stdio',
            },
            'integrations': {
                'chartgpu': {'url': CHARTGPU_URL, 'port': 3444},
                'day_cli': {'path': str(DAY_DIR), 'tools': ['kbatch', 'signal', 'geokey', 'youtube']},
                'quest_hub': {'url': QUEST_HUB_URL, 'port': 3000},
                'jawta': {'path': str(JAWTA_DIR)},
                'lark': {'path': str(LARK_DIR)},
                'media': {'pipelines': ['transcript', 'audio', 'video', 'spatial', 'signal']},
            },
            'endpoints': 55,
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
        return {'models': ai_layer.list_models(), 'ollama_default': ai_layer.ollama_model}

    elif path == '/api/ai/models/ollama':
        if method == 'GET':
            # Discover all locally installed Ollama models
            models = await ai_layer.discover_ollama_models()
            return {'models': models, 'current': ai_layer.ollama_model, 'endpoint': ai_layer.ollama_endpoint}
        elif method == 'POST':
            # Switch the default Ollama model
            new_model = data.get('model', '')
            if new_model:
                ai_layer.set_ollama_model(new_model)
                return {'switched': True, 'model': new_model}
            return {'error': 'model field required'}

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

    # ── INSTANCES (QubesOS-style) ────────────────────
    elif path == '/api/instances':
        if method == 'GET':
            return {'instances': instance_mgr.list_instances()}
        elif method == 'POST':
            iid = data.get('id', str(uuid.uuid4())[:8])
            page = data.get('page', 'quantum-notepad.html')
            entry = instance_mgr.register(iid, page)
            return {'registered': True, **entry}

    elif path == '/api/instances/message' and method == 'POST':
        return {
            'sent': instance_mgr.send_message(
                from_id=data.get('from', 'api'),
                to_id=data.get('to', '*'),
                channel=data.get('channel', 'message'),
                data=data.get('data', {}),
            )
        }

    elif path == '/api/instances/layout':
        if method == 'GET':
            return {'layout': instance_mgr.save_layout()}

    elif path == '/api/instances/log':
        if method == 'GET':
            return {'messages': instance_mgr.get_message_log(limit=data.get('limit', 50) if data else 50)}

    elif path.startswith('/api/instances/') and '/state' in path:
        iid = path.split('/')[3]
        if method == 'GET':
            state = instance_mgr.get_state(iid)
            return state if state else {'error': f'Instance not found: {iid}'}
        elif method == 'POST':
            instance_mgr.set_state(iid, data)
            return {'saved': True, 'id': iid}

    elif path.startswith('/api/instances/') and method == 'DELETE':
        iid = path.split('/')[-1]
        return {'removed': instance_mgr.unregister(iid)}

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

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  CHARTGPU  (/api/chartgpu/*)                                        ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/chartgpu/status' and method == 'GET':
        return await _chartgpu_status()

    elif path == '/api/chartgpu/metrics' and method == 'GET':
        return await _chartgpu_metrics()

    elif path == '/api/chartgpu/analyze' and method == 'POST':
        return await _chartgpu_analyze(data)

    elif path == '/api/chartgpu/config' and method == 'POST':
        return await _chartgpu_push_config(data)

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  DAY TOOLS  (/api/day/*)                                            ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/day/kbatch' and method == 'POST':
        return await _day_kbatch(data)

    elif path == '/api/day/signal' and method == 'POST':
        return await _day_signal(data)

    elif path == '/api/day/geokey' and method == 'POST':
        return await _day_geokey(data)

    elif path == '/api/day/youtube' and method == 'POST':
        return await _day_youtube(data)

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  TOOLS REGISTRY  (/api/tools/*)                                     ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/tools/list' and method == 'GET':
        return _tools_list()

    elif path == '/api/tools/exec' and method == 'POST':
        return await _tools_exec(data)

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  QUEST DEVICE  (/api/quest/*)                                       ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/quest/device' and method == 'GET':
        return await _quest_proxy('GET', '/api/device/info')

    elif path == '/api/quest/deploy' and method == 'POST':
        return await _quest_proxy('POST', '/api/apk/install', data)

    elif path == '/api/quest/screenshot' and method == 'GET':
        return await _quest_proxy('GET', '/api/screenshot')

    elif path == '/api/quest/logs' and method == 'GET':
        return await _quest_proxy('GET', '/api/logs')

    elif path == '/api/quest/status' and method == 'GET':
        return await _quest_status()

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  JAWTA / LARK  (/api/jawta/*, /api/lark/*)                         ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/jawta/signal' and method == 'POST':
        return await _jawta_signal(data)

    elif path == '/api/jawta/audio' and method == 'POST':
        return await _jawta_audio(data)

    elif path == '/api/lark/status' and method == 'GET':
        return _lark_status()

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  MEDIA PIPELINE  (/api/media/*)                                     ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    elif path == '/api/media/process' and method == 'POST':
        return await _media_process(data)

    elif path == '/api/media/transcript' and method == 'POST':
        return await _day_youtube(data)  # reuse youtube transcript

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
            'GET  /api/ai/models/ollama',
            'POST /api/ai/models/ollama',
            'GET  /api/agents',
            'POST /api/agents',
            'POST /api/agents/send',
            'GET  /api/agents/log',
            'GET  /api/sessions',
            'POST /api/sessions',
            'GET  /api/sessions/{id}',
            'GET  /api/instances',
            'POST /api/instances',
            'POST /api/instances/message',
            'GET  /api/instances/layout',
            'GET  /api/instances/log',
            'GET  /api/instances/{id}/state',
            'POST /api/instances/{id}/state',
            'DEL  /api/instances/{id}',
            'POST /api/roadmap/scan',
            'POST /api/roadmap/convert',
            'GET  /api/languages',
            'POST /api/security/scan',
            'GET  /api/security/rules',
            'GET  /api/git/hook',
            'POST /api/git/hook/install',
            'POST /api/git/diff-report',
            'GET  /api/chartgpu/status',
            'GET  /api/chartgpu/metrics',
            'POST /api/chartgpu/analyze',
            'POST /api/chartgpu/config',
            'POST /api/day/kbatch',
            'POST /api/day/signal',
            'POST /api/day/geokey',
            'POST /api/day/youtube',
            'GET  /api/tools/list',
            'POST /api/tools/exec',
            'GET  /api/quest/device',
            'POST /api/quest/deploy',
            'GET  /api/quest/screenshot',
            'GET  /api/quest/logs',
            'GET  /api/quest/status',
            'POST /api/jawta/signal',
            'POST /api/jawta/audio',
            'GET  /api/lark/status',
            'POST /api/media/process',
            'POST /api/media/transcript',
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
╔══════════════════════════════════════════════════════════════╗
║  UV-Speed Quantum Execution Bridge v2.1                      ║
║  HTTP API:    http://localhost:{HTTP_PORT}                         ║
║  WebSocket:   ws://localhost:{WS_PORT}                            ║
╠══════════════════════════════════════════════════════════════╣
║  Engines:                                                    ║
║    Prefix:   18 languages · 9-symbol system                  ║
║    Exec:     Python + shell + uv run                         ║
║    AI:       {'tinygrad ·' if TINYGRAD_AVAILABLE else ''} {'numpy ·' if NUMPY_AVAILABLE else ''} Ollama · OpenAI · Anthropic     ║
║    Diff:     Prefix-aware quantum coordinate diffs           ║
║    Agents:   {len(agent_bus.agents)} registered                                   ║
║    Storage:  JSON sessions in .quantum_sessions/             ║
╠══════════════════════════════════════════════════════════════╣
║  Cross-Project Integration:                                  ║
║    ChartGPU: proxy to :3444 · AI metrics · trend analysis    ║
║    Day CLI:  kbatch · signal · geokey · youtube transcript   ║
║    Quest:    proxy to Hub :3000 · ADB · deploy · logs        ║
║    Jawta:    signal intel · Morse · spectrum · audio          ║
║    Lark:     status · embed · editor sync                    ║
║    Media:    pipeline orchestration · spatial · video seg     ║
╚══════════════════════════════════════════════════════════════╝
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
