# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.3.x | Yes |
| 3.0.x – 3.2.x | Security fixes only |
| < 3.0 | No |

## Reporting a Vulnerability

If you discover a security vulnerability in uvspeed, please report it responsibly:

1. **Do NOT open a public issue** for security vulnerabilities
2. **Email**: Open a private security advisory via [GitHub Security Advisories](https://github.com/fornevercollective/uvspeed/security/advisories/new)
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected version(s)
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 1 week
- **Fix release**: Within 2 weeks for critical issues

## Security Features

uvspeed includes built-in security scanning:

### Prefix-Aware Security Scanner

The bridge server includes a static analysis scanner (`POST /api/security/scan`) that detects:

- Hardcoded secrets (API keys, passwords, tokens)
- Command injection patterns
- SQL injection patterns
- Path traversal vulnerabilities
- Dangerous function calls (`eval`, `exec`, `subprocess` with `shell=True`)
- Insecure deserialization (`pickle.loads`, `yaml.load`)

### Code Execution Sandboxing

- Bridge server code execution (`POST /api/execute`) runs in isolated subprocesses
- Configurable timeout limits (default: 30s)
- Output size limits prevent memory exhaustion
- No filesystem access beyond the working directory

### Electron Security

- `contextIsolation: true` — renderer cannot access Node.js APIs
- `nodeIntegration: false` — web content cannot require modules
- `webSecurity: true` in production builds
- External links open in system browser, not Electron windows
- Content Security Policy headers on served pages

### Local-First AI

- Ollama/tinygrad inference runs entirely on-device
- No code is sent to cloud APIs unless explicitly configured (OpenAI/Anthropic keys)
- MCP server communicates via stdio (no network exposure)

## Dependency Security

- Dependabot monitors npm and pip dependencies
- Minimal dependency footprint:
  - **Python**: `websockets` (required), `aiohttp`/`numpy`/`psutil` (optional)
  - **npm**: `electron`, `express`, `ws`, `xterm`, `node-pty`
- No transitive dependency on known vulnerable packages

## Scope

The following are **in scope** for security reports:

- Bridge server API endpoints
- Electron desktop app
- MCP server
- Code execution engine
- Authentication/authorization (if implemented)
- Dependency vulnerabilities

The following are **out of scope**:

- Static HTML pages served from GitHub Pages (no server-side logic)
- Third-party services (Ollama, OpenAI, Anthropic — report to those vendors)
- Intentional "demo" code in example projects
