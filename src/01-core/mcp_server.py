#!/usr/bin/env python3
# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
"""
UV-Speed MCP Server — Model Context Protocol
==============================================
Wraps the uvspeed bridge server's 40+ endpoints as MCP tools,
enabling Cursor, VS Code, and other AI-native IDEs to call the
quantum prefix engine, code execution, navigation, and AI inference
via the standard MCP protocol.

Transports:
  - stdio  (default) — for Cursor / Claude Desktop integration
  - SSE    (optional) — for browser-based MCP clients

Usage:
  # stdio transport (Cursor / Claude Desktop)
  python src/01-core/mcp_server.py

  # Or via uv
  uv run python src/01-core/mcp_server.py

Cursor config (.cursor/mcp.json):
  {
    "mcpServers": {
      "uvspeed": {
        "command": "python",
        "args": ["src/01-core/mcp_server.py"],
        "cwd": "/path/to/uvspeed"
      }
    }
  }
"""

import asyncio
import json
import sys
import os
import logging
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Logging — stderr only (stdout is reserved for MCP JSON-RPC)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [MCP] %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("uvspeed-mcp")

# ---------------------------------------------------------------------------
# Bridge client — talks to the running bridge server via HTTP
# ---------------------------------------------------------------------------
BRIDGE_HTTP = os.environ.get("UVSPEED_BRIDGE_HTTP", "http://localhost:8085")
BRIDGE_WS = os.environ.get("UVSPEED_BRIDGE_WS", "ws://localhost:8086")


async def bridge_call(method: str, path: str, data: Optional[Dict] = None) -> Dict:
    """Call the bridge server HTTP API."""
    try:
        import aiohttp
        url = f"{BRIDGE_HTTP}{path}"
        async with aiohttp.ClientSession() as session:
            if method == "GET":
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    return await resp.json()
            else:
                async with session.post(url, json=data or {}, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    return await resp.json()
    except ImportError:
        # Fallback to urllib if aiohttp not available
        import urllib.request
        url = f"{BRIDGE_HTTP}{path}"
        req = urllib.request.Request(url, method=method)
        if data:
            req.data = json.dumps(data).encode()
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except Exception as e:
            return {"error": str(e)}
    except Exception as e:
        return {"error": f"Bridge connection failed: {e}"}


# ---------------------------------------------------------------------------
# MCP Tool Definitions
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "uvspeed_status",
        "description": "Get the current status of the uvspeed bridge server including quantum position, active instances, AI model availability, and server health.",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "uvspeed_prefix",
        "description": "Convert source code to quantum-prefixed format. Classifies each line with the beyondBINARY 11-symbol prefix system {+1, 1, -1, +0, 0, -0, +n, n, -n}. Supports 20 languages.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Source code to prefix"},
                "language": {"type": "string", "description": "Programming language (python, javascript, rust, go, etc.)"},
            },
            "required": ["code", "language"],
        },
    },
    {
        "name": "uvspeed_execute",
        "description": "Execute code via the uvspeed bridge server. Supports Python, shell, and uv run execution modes with quantum prefix tracking.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to execute"},
                "language": {"type": "string", "description": "Execution mode: python, shell, uv"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "uvspeed_navigate",
        "description": "Navigate through the 3D quantum code space. Directions: +1 (lines up/+Y), -1 (lines down/-Y), +0 (dependencies right/+X), -0 (dependencies left/-X), +n (complexity up/+Z), -n (complexity down/-Z).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": ["+1", "-1", "+0", "-0", "+n", "-n"],
                    "description": "Navigation direction in 3D code space",
                },
                "amount": {"type": "integer", "description": "Number of steps (default 1)", "default": 1},
            },
            "required": ["direction"],
        },
    },
    {
        "name": "uvspeed_diff",
        "description": "Generate a prefix-aware structural diff between two code snippets. Shows how quantum weights change between versions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "original": {"type": "string", "description": "Original code"},
                "modified": {"type": "string", "description": "Modified code"},
                "language": {"type": "string", "description": "Programming language"},
            },
            "required": ["original", "modified"],
        },
    },
    {
        "name": "uvspeed_ai",
        "description": "Run AI inference via the uvspeed bridge. Auto-selects best available model: Ollama (local) > tinygrad > OpenAI > Anthropic. Supports model selection.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Prompt for AI inference"},
                "model": {"type": "string", "description": "Model name (ollama-default, tinygrad-local, openai, anthropic). Auto-selects if omitted."},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "uvspeed_ai_models",
        "description": "List all available AI models registered with the uvspeed bridge server, including local (tinygrad, Ollama) and cloud (OpenAI, Anthropic) backends.",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "uvspeed_security_scan",
        "description": "Run a prefix-aware security scan on code. Detects hardcoded secrets, dangerous patterns, SQL injection, command injection, and more with severity scoring.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to scan"},
                "language": {"type": "string", "description": "Programming language"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "uvspeed_sessions",
        "description": "List, save, or load notebook sessions. Sessions persist cells, quantum position, and execution state.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["list", "save", "load"],
                    "description": "Session action",
                },
                "session_id": {"type": "string", "description": "Session ID (for save/load)"},
                "data": {"type": "object", "description": "Session data to save"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "uvspeed_languages",
        "description": "List all 20 supported languages with their quantum prefix coverage percentages and tier classification.",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "uvspeed_prefix_gaps",
        "description": (
            "Analyze quantum prefix coverage gaps in source code. "
            "Returns which prefix categories are missing or underrepresented, "
            "with structured suggestions for filling gaps (e.g., missing error handling, "
            "missing loops, missing documentation). "
            "Use after generating code to check structural completeness."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Source code to analyze for prefix gaps"},
                "language": {"type": "string", "description": "Programming language (python, javascript, rust, etc.)"},
                "threshold": {
                    "type": "number",
                    "description": "Minimum acceptable coverage percentage (default 80)",
                    "default": 80,
                },
            },
            "required": ["code", "language"],
        },
    },
]


# ---------------------------------------------------------------------------
# Local Prefix Classifier (mirrors quantum-prefixes.js logic)
# ---------------------------------------------------------------------------

import re

_PREFIX_PATTERNS: Dict[str, List[re.Pattern]] = {
    "n:": [re.compile(r"^#!"), re.compile(r"^<!(DOCTYPE|doctype)")],
    "+1:": [re.compile(r"^\s*(#|//|/\*|\*|--|<!--|%|;;\s)")],
    "-n:": [
        re.compile(r"^\s*(import |from .+ import|require\(|use |include|#include|@import|extern crate)"),
    ],
    "+0:": [
        re.compile(r"^\s*(class |struct |type |enum |interface |trait |@dataclass|@frozen)"),
    ],
    "0:": [
        re.compile(r"^\s*(def |fn |func |function |const .+=.*=>|let .+=.*=>|async |pub fn |pub async )"),
    ],
    "-1:": [
        re.compile(r"^\s*(try |except |catch|raise |throw |finally |rescue |panic!)"),
    ],
    "+n:": [
        re.compile(r"^\s*(if |else |elif |elsif |switch |match |case |guard |when |unless )"),
    ],
    "+2:": [
        re.compile(r"^\s*(for |while |loop |each |do \{|\.forEach|\.map\(|\.filter\()"),
    ],
    "-0:": [
        re.compile(r"^\s*(return |yield |break|continue)"),
    ],
    "+3:": [
        re.compile(r"^\s*(print|console\.|log\.|echo |puts |fmt\.Print|println!|render|display)"),
    ],
    "1:": [
        re.compile(r"^\s*(let |var |const |self\.\w+\s*=|this\.\w+\s*=|\w+\s*[:=]\s)"),
    ],
}

_CATEGORY_NAMES = {
    "n:": "shebang",
    "+1:": "comment",
    "-n:": "import",
    "+0:": "class",
    "0:": "function",
    "-1:": "error",
    "+n:": "condition",
    "+2:": "loop",
    "-0:": "return",
    "+3:": "output",
    "1:": "variable",
}

_GAP_SUGGESTIONS = {
    "-1:": "Missing error handling — consider adding try/catch or raise/throw blocks",
    "+1:": "Missing documentation — add comments or docstrings for clarity",
    "+2:": "No loops detected — consider iteration for batch processing",
    "+n:": "No conditional logic — add if/else for edge cases or validation",
    "+3:": "No output/logging — add print/log statements for debugging",
    "-0:": "No explicit returns — ensure functions have clear return values",
    "0:": "No function definitions — consider extracting logic into functions",
    "+0:": "No class/struct definitions — consider data structures for complex state",
    "1:": "No variable assignments detected — check if logic is overly inline",
    "-n:": "No imports — ensure dependencies are properly declared",
    "n:": "No shebang/entry point — consider adding #!/usr/bin/env for scripts",
}


def _classify_line(line: str) -> str:
    stripped = line.strip()
    if not stripped:
        return " "
    for sym, patterns in _PREFIX_PATTERNS.items():
        for p in patterns:
            if p.search(stripped):
                return sym
    return " "


def _analyze_prefix_gaps(code: str, language: str, threshold: float) -> Dict:
    """Analyze prefix coverage and find structural gaps."""
    lines = code.split("\n")
    total = len(lines)
    counts: Dict[str, int] = {}
    classified = 0

    for line in lines:
        sym = _classify_line(line)
        if sym != " ":
            classified += 1
            counts[sym] = counts.get(sym, 0) + 1

    coverage = round((classified / total) * 100, 1) if total > 0 else 0

    # Identify missing/underrepresented categories
    gaps = []
    for sym, cat_name in _CATEGORY_NAMES.items():
        count = counts.get(sym, 0)
        pct = round((count / total) * 100, 1) if total > 0 else 0
        if count == 0:
            gaps.append({
                "symbol": sym,
                "category": cat_name,
                "count": 0,
                "percentage": 0,
                "severity": "missing",
                "suggestion": _GAP_SUGGESTIONS.get(sym, ""),
            })
        elif pct < 3 and sym in ("-1:", "+2:", "+n:", "+3:"):
            gaps.append({
                "symbol": sym,
                "category": cat_name,
                "count": count,
                "percentage": pct,
                "severity": "underrepresented",
                "suggestion": _GAP_SUGGESTIONS.get(sym, "").replace("Missing", "Low").replace("No ", "Few "),
            })

    return {
        "coverage": coverage,
        "threshold": threshold,
        "meets_threshold": coverage >= threshold,
        "total_lines": total,
        "classified_lines": classified,
        "prefix_counts": counts,
        "gaps": gaps,
        "gap_count": len(gaps),
        "language": language,
    }


# ---------------------------------------------------------------------------
# MCP Tool Handlers
# ---------------------------------------------------------------------------

async def handle_tool(name: str, arguments: Dict[str, Any]) -> str:
    """Dispatch MCP tool call to bridge server."""

    if name == "uvspeed_status":
        result = await bridge_call("GET", "/api/status")

    elif name == "uvspeed_prefix":
        result = await bridge_call("POST", "/api/prefix", {
            "code": arguments["code"],
            "language": arguments.get("language", "python"),
        })

    elif name == "uvspeed_execute":
        result = await bridge_call("POST", "/api/execute", {
            "code": arguments["code"],
            "language": arguments.get("language", "python"),
        })

    elif name == "uvspeed_navigate":
        result = await bridge_call("POST", "/api/navigate", {
            "direction": arguments["direction"],
            "amount": arguments.get("amount", 1),
        })

    elif name == "uvspeed_diff":
        result = await bridge_call("POST", "/api/diff", {
            "original": arguments["original"],
            "modified": arguments["modified"],
            "language": arguments.get("language", "python"),
        })

    elif name == "uvspeed_ai":
        payload = {"prompt": arguments["prompt"]}
        if "model" in arguments:
            payload["model"] = arguments["model"]
        result = await bridge_call("POST", "/api/ai", payload)

    elif name == "uvspeed_ai_models":
        result = await bridge_call("GET", "/api/ai/models")

    elif name == "uvspeed_security_scan":
        result = await bridge_call("POST", "/api/security/scan", {
            "code": arguments["code"],
            "language": arguments.get("language", "python"),
        })

    elif name == "uvspeed_sessions":
        action = arguments["action"]
        if action == "list":
            result = await bridge_call("GET", "/api/sessions")
        elif action == "save":
            result = await bridge_call("POST", "/api/sessions", {
                "id": arguments.get("session_id", ""),
                **(arguments.get("data") or {}),
            })
        elif action == "load":
            sid = arguments.get("session_id", "")
            result = await bridge_call("GET", f"/api/sessions/{sid}")
        else:
            result = {"error": f"Unknown action: {action}"}

    elif name == "uvspeed_languages":
        result = await bridge_call("GET", "/api/languages")

    elif name == "uvspeed_prefix_gaps":
        result = _analyze_prefix_gaps(
            arguments["code"],
            arguments.get("language", "python"),
            arguments.get("threshold", 80),
        )

    else:
        result = {"error": f"Unknown tool: {name}"}

    return json.dumps(result, indent=2, default=str)


# ---------------------------------------------------------------------------
# MCP JSON-RPC Protocol (stdio transport)
# ---------------------------------------------------------------------------

SERVER_INFO = {
    "name": "uvspeed-quantum",
    "version": "3.2.0",
}

CAPABILITIES = {
    "tools": {},
}


async def handle_request(req: Dict) -> Dict:
    """Handle a single MCP JSON-RPC request."""
    method = req.get("method", "")
    params = req.get("params", {})
    req_id = req.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": CAPABILITIES,
                "serverInfo": SERVER_INFO,
            },
        }

    elif method == "notifications/initialized":
        # Client acknowledged init — no response needed
        return None

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS},
        }

    elif method == "tools/call":
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})
        try:
            text = await handle_tool(tool_name, arguments)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": text}],
                },
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps({"error": str(e)})}],
                    "isError": True,
                },
            }

    elif method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }


async def stdio_loop():
    """Main stdio transport loop — reads JSON-RPC from stdin, writes to stdout."""
    log.info("uvspeed MCP server starting (stdio transport)")
    log.info(f"Bridge endpoint: {BRIDGE_HTTP}")
    log.info(f"Tools registered: {len(TOOLS)}")

    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await asyncio.get_event_loop().connect_read_pipe(lambda: protocol, sys.stdin)

    buffer = b""
    while True:
        try:
            chunk = await reader.read(65536)
            if not chunk:
                break  # EOF
            buffer += chunk

            # Process complete JSON-RPC messages (newline-delimited)
            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)
                line = line.strip()
                if not line:
                    continue

                try:
                    req = json.loads(line)
                except json.JSONDecodeError:
                    log.error(f"Invalid JSON: {line[:100]}")
                    continue

                response = await handle_request(req)
                if response is not None:
                    out = json.dumps(response) + "\n"
                    sys.stdout.write(out)
                    sys.stdout.flush()

        except asyncio.CancelledError:
            break
        except Exception as e:
            log.error(f"stdio loop error: {e}")
            break

    log.info("uvspeed MCP server stopped")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    try:
        asyncio.run(stdio_loop())
    except KeyboardInterrupt:
        log.info("MCP server interrupted")
    except Exception as e:
        log.error(f"MCP server fatal: {e}")
        sys.exit(1)
