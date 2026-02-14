/**
 * ⚛ quantum-prefixes.js — Shared Quantum Gutter Prefix Engine
 *
 * Universal module used by all UV-Speed apps (notepad, hexbench, hexterm,
 * hexcast, archflow, research-lab, dashboard, grid, launcher, etc.)
 *
 * Provides:
 *   • 9-symbol line classifier  (classifyLine)
 *   • Per-language regex rules   (LANG_PATTERNS)
 *   • Content prefixing          (prefixContent)
 *   • Metadata generation        (prefixMetadata)
 *   • Live cross-app sync        (BroadcastChannel 'quantum-prefixes')
 *   • IoT/Quantum bridge relay   (WebSocket → iot-quantum-computer)
 *   • localStorage persistence   (quantum-prefixes-state)
 *
 * Usage:
 *   <script src="quantum-prefixes.js"></script>
 *   const qp = window.QuantumPrefixes;
 *   const prefixed = qp.prefixContent(code, 'python');
 *   qp.broadcastState('hexbench', { cells: 5, coverage: 72 });
 */

(function (root) {
    'use strict';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9-Symbol Prefix Map
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const PREFIXES = {
        shebang:   { sym: 'n:',  cls: 'pfx-shebang',   color: '#e2b714' },
        comment:   { sym: '+1:', cls: 'pfx-comment',    color: '#6a9955' },
        import:    { sym: '-n:', cls: 'pfx-import',     color: '#c586c0' },
        class:     { sym: '+0:', cls: 'pfx-class',      color: '#4ec9b0' },
        function:  { sym: '0:',  cls: 'pfx-function',   color: '#569cd6' },
        error:     { sym: '-1:', cls: 'pfx-error',      color: '#f44747' },
        condition: { sym: '+n:', cls: 'pfx-condition',   color: '#d7ba7d' },
        loop:      { sym: '+2:', cls: 'pfx-loop',       color: '#9cdcfe' },
        return:    { sym: '-0:', cls: 'pfx-return',     color: '#c586c0' },
        output:    { sym: '+3:', cls: 'pfx-output',     color: '#ce9178' },
        variable:  { sym: '1:',  cls: 'pfx-variable',   color: '#d4d4d4' },
        decorator: { sym: '+1:', cls: 'pfx-decorator',  color: '#dcdcaa' },
        default:   { sym: '   ', cls: 'pfx-default',    color: '#808080' },
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANSI escape codes (for terminal rendering)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const PREFIX_ANSI = {
        'n:':  '\x1b[33m',   // shebang — yellow
        '+1:': '\x1b[32m',   // comment — green
        '-n:': '\x1b[35m',   // import — magenta
        '+0:': '\x1b[36m',   // class — cyan
        '0:':  '\x1b[34m',   // function — blue
        '-1:': '\x1b[31m',   // error — red
        '+n:': '\x1b[33m',   // condition — yellow
        '+2:': '\x1b[36m',   // loop — cyan
        '-0:': '\x1b[35m',   // return — magenta
        '+3:': '\x1b[31m',   // output — red
        '1:':  '\x1b[37m',   // variable — white
        '   ': '\x1b[90m',   // default — dim
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Language Pattern Rules (regex per category)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const LANG_PATTERNS = {
        python: {
            shebang:   /^#!.*python/,
            comment:   /^\s*#/,
            import:    /^\s*(import|from)\s/,
            class:     /^\s*class\s/,
            function:  /^\s*(def|async\s+def)\s/,
            decorator: /^\s*@/,
            error:     /^\s*(try|except|finally|raise)/,
            condition: /^\s*(if|elif|else)\b/,
            loop:      /^\s*(for|while)\s/,
            return:    /^\s*(return|yield)\s/,
            output:    /^\s*print\(/,
            variable:  /^\s*\w+\s*=/,
        },
        javascript: {
            shebang:   /^#!.*node/,
            comment:   /^\s*(\/\/|\/\*|\*)/,
            import:    /^\s*(import|require|const\s+.*=\s*require|export)/,
            class:     /^\s*(class|interface)\s/,
            function:  /^\s*(function|const\s+\w+\s*=\s*(\(|async)|=>)/,
            error:     /^\s*(try|catch|finally|throw)\b/,
            condition: /^\s*(if|else\s+if|else|switch|case)\b/,
            loop:      /^\s*(for|while|do)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*console\./,
            variable:  /^\s*(const|let|var)\s/,
        },
        typescript: {
            comment:   /^\s*(\/\/|\/\*|\*)/,
            import:    /^\s*(import|require|from|export)/,
            class:     /^\s*(class|interface|type|enum)\s/,
            function:  /^\s*(function|const\s+\w+\s*[:=]|=>)/,
            decorator: /^\s*@/,
            error:     /^\s*(try|catch|finally|throw)\b/,
            condition: /^\s*(if|else|switch|case)\b/,
            loop:      /^\s*(for|while|do)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*console\./,
            variable:  /^\s*(const|let|var)\s/,
        },
        rust: {
            comment:   /^\s*(\/\/|\/\*)/,
            import:    /^\s*(use|extern\s+crate|mod)\s/,
            class:     /^\s*(struct|enum|trait|impl)\s/,
            function:  /^\s*(pub\s+)?(fn|async\s+fn)\s/,
            decorator: /^\s*#\[/,
            error:     /^\s*(panic!|unwrap|expect|Result|Err)/,
            condition: /^\s*(if|else|match)\b/,
            loop:      /^\s*(for|while|loop)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*(println!|print!|eprintln!)/,
            variable:  /^\s*(let|mut|const)\s/,
        },
        go: {
            comment:   /^\s*\/\//,
            import:    /^\s*(import|package)\s/,
            class:     /^\s*type\s+\w+\s+(struct|interface)/,
            function:  /^\s*func\s/,
            error:     /^\s*(if\s+err|panic\(|log\.(Fatal|Panic))/,
            condition: /^\s*(if|else|switch|case)\b/,
            loop:      /^\s*for\b/,
            return:    /^\s*return\s/,
            output:    /^\s*fmt\./,
            variable:  /^\s*(var|:=)\s/,
        },
        shell: {
            shebang:   /^#!\/(bin|usr)\/(bash|sh|zsh)/,
            comment:   /^\s*#/,
            import:    /^\s*(source|\.)\s/,
            function:  /^\s*(\w+\s*\(\)\s*\{|function\s+\w+)/,
            error:     /^\s*(trap|set\s+-e)/,
            condition: /^\s*(if|elif|else|fi|then)\b/,
            loop:      /^\s*(for|while|until|do|done)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*echo\s/,
            variable:  /^\s*\w+=/,
        },
        c: {
            comment:   /^\s*(\/\/|\/\*|\*)/,
            import:    /^\s*#(include|define|pragma|ifdef|ifndef|endif)/,
            class:     /^\s*(struct|enum|union|typedef)\s/,
            function:  /^\s*(void|int|char|float|double|long|unsigned|static|extern)\s+\w+\s*\(/,
            error:     /^\s*(assert|abort|exit|perror)/,
            condition: /^\s*(if|else|switch|case)\b/,
            loop:      /^\s*(for|while|do)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*(printf|puts|fprintf|sprintf)/,
            variable:  /^\s*(int|char|float|double|long|unsigned|const|static|volatile)\s+\w+/,
        },
        cpp: {
            comment:   /^\s*(\/\/|\/\*|\*)/,
            import:    /^\s*#(include|define|pragma|ifdef|ifndef|endif)|^\s*using\s/,
            class:     /^\s*(class|struct|enum|namespace|template)\s/,
            function:  /^\s*(void|int|char|float|double|auto|virtual|static|inline)\s+\w+\s*\(/,
            error:     /^\s*(try|catch|throw|assert)/,
            condition: /^\s*(if|else|switch|case)\b/,
            loop:      /^\s*(for|while|do)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*(std::cout|std::cerr|printf|puts)/,
            variable:  /^\s*(int|char|float|double|auto|const|static|std::)\s*\w+/,
        },
        html: {
            comment:   /^\s*<!--/,
            import:    /^\s*<(link|script|meta)/,
            class:     /^\s*<(div|section|article|main|header|footer|nav)/,
            function:  /^\s*<(form|button|input)/,
            condition: /^\s*<(template|slot)/,
            output:    /^\s*<(p|h[1-6]|span|a|li|td)/,
        },
        css: {
            comment:   /^\s*\/\*/,
            import:    /^\s*@(import|charset|font-face)/,
            class:     /^\s*\./,
            variable:  /^\s*--/,
            condition: /^\s*@(media|supports|keyframes)/,
        },
        markdown: {
            shebang:   /^---/,
            comment:   /^\s*<!--/,
            import:    /^\s*!\[/,
            class:     /^\s*#{1,6}\s/,
            function:  /^\s*```/,
            condition: /^\s*>/,
            loop:      /^\s*[-*+]\s/,
            output:    /^\s*\|/,
            variable:  /^\s*\[.*\]:/,
        },
        mermaid: {
            comment:   /^\s*%%/,
            class:     /^\s*(graph|subgraph|flowchart|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram|journey)/,
            function:  /^\s*(style|click|class)\b/,
            condition: /^\s*(end|direction)\b/,
            output:    /-->/,
            variable:  /^\s*\w+[\[\({"]/,
        },
        sql: {
            comment:   /^\s*--/,
            import:    /^\s*(USE|DATABASE)\b/i,
            class:     /^\s*(CREATE|ALTER|DROP)\b/i,
            function:  /^\s*(SELECT|INSERT|UPDATE|DELETE)\b/i,
            condition: /^\s*(WHERE|CASE|WHEN|IF)\b/i,
            loop:      /^\s*(JOIN|UNION|GROUP)\b/i,
        },
        yaml: {
            comment:   /^\s*#/,
            import:    /^\s*---/,
            variable:  /^\s*\w+\s*:/,
            class:     /^\s*-\s/,
        },
        json: {
            class:     /^\s*\{/,
            variable:  /^\s*"/,
            loop:      /^\s*\[/,
        },
        arduino: {
            comment:   /^\s*(\/\/|\/\*|\*)/,
            import:    /^\s*#(include|define)/,
            class:     /^\s*(struct|enum|class)\s/,
            function:  /^\s*(void|int|float|char|byte|boolean|unsigned|long)\s+\w+\s*\(/,
            error:     /^\s*(Serial\.print|assert)/,
            condition: /^\s*(if|else|switch|case)\b/,
            loop:      /^\s*(for|while|do)\b/,
            return:    /^\s*return\s/,
            output:    /^\s*(Serial\.(print|write|begin)|analogWrite|digitalWrite)/,
            variable:  /^\s*(int|float|char|byte|boolean|unsigned|long|const|#define)\s+\w+/,
        },
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Language Detection (auto-detect from content)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function detectLanguage(content, hint) {
        if (hint && LANG_PATTERNS[hint]) return hint;
        const c = content || '';
        // Shebang detection
        if (/^#!.*python/.test(c)) return 'python';
        if (/^#!.*node/.test(c)) return 'javascript';
        if (/^#!\/(bin|usr)/.test(c)) return 'shell';
        // Arduino / C++ patterns
        if (/#include\s*<Arduino\.h>|void\s+setup\(\)|void\s+loop\(\)/m.test(c)) return 'arduino';
        // Language keyword heuristics
        if (/^\s*(import|from)\s.*\n.*def\s/m.test(c)) return 'python';
        if (/^\s*def\s|^\s*class\s.*:/m.test(c)) return 'python';
        if (/^\s*(const|let|var|function|=>|require\(|import\s.*from)/m.test(c)) return 'javascript';
        if (/^\s*(fn\s|let\s+mut|impl\s|use\s+\w+::)/m.test(c)) return 'rust';
        if (/^\s*(func\s|package\s|fmt\.)/m.test(c)) return 'go';
        if (/^\s*(SELECT|CREATE|INSERT|ALTER)\b/im.test(c)) return 'sql';
        if (/^\s*<(!DOCTYPE|html|div|section)/im.test(c)) return 'html';
        if (/^\s*(@media|\.[\w-]+\s*\{)/m.test(c)) return 'css';
        if (/^\s*(graph|flowchart|sequenceDiagram|classDiagram)/m.test(c)) return 'mermaid';
        if (/^\s*---\s*\n/m.test(c) && /^\s*\w+:/m.test(c)) return 'yaml';
        if (/^\s*\{[\s]*"/.test(c)) return 'json';
        if (/^\s*#.*\n/m.test(c) && /^\s*(echo|export|source)\b/m.test(c)) return 'shell';
        if (/^\s*#(include|define)/.test(c) && /^\s*(void|int|char)\s+\w+\s*\(/m.test(c)) return 'c';
        // Markdown detection
        if (/^\s*#{1,6}\s/.test(c) || /^\s*[-*+]\s/.test(c)) return 'markdown';
        return 'python'; // default
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Line Classifier
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function classifyLine(line, language) {
        const lang = language || 'python';
        const patterns = LANG_PATTERNS[lang] || LANG_PATTERNS.python;
        for (const [category, regex] of Object.entries(patterns)) {
            if (regex.test(line)) {
                const pfx = PREFIXES[category] || PREFIXES.default;
                return { ...pfx, category };
            }
        }
        return { ...PREFIXES.default, category: 'default' };
    }

    // Quick classifier (returns just the symbol string — for terminal use)
    function classifyLineSym(line, language) {
        return classifyLine(line, language).sym;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Content Prefixing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function prefixContent(content, language) {
        const lang = language || detectLanguage(content);
        const lines = (content || '').split('\n');
        return lines.map(function (line) {
            var result = classifyLine(line, lang);
            return result.sym + ' ' + line;
        }).join('\n');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Prefix Metadata (per-content analysis)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function prefixMetadata(content, language) {
        const lang = language || detectLanguage(content);
        const lines = (content || '').split('\n');
        var counts = {};
        var classified = 0;
        var lineData = lines.map(function (line, i) {
            var result = classifyLine(line, lang);
            counts[result.category] = (counts[result.category] || 0) + 1;
            if (result.category !== 'default') classified++;
            return { line: i + 1, sym: result.sym, category: result.category };
        });
        return {
            language: lang,
            totalLines: lines.length,
            classifiedLines: classified,
            coverage: lines.length > 0 ? Math.round((classified / lines.length) * 100) : 0,
            prefixCounts: counts,
            lines: lineData
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Export Header (for file downloads)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function exportHeader(meta, source) {
        var countsStr = Object.entries(meta.prefixCounts)
            .map(function (e) { return e[0] + ':' + e[1]; }).join(' · ');
        return '# ⚛ Quantum Prefix Gutter' +
            (source ? ' — ' + source : '') +
            ' — ' + meta.language +
            ' — ' + meta.coverage + '% coverage (' +
            meta.classifiedLines + '/' + meta.totalLines + ' lines)\n' +
            '# Symbols: n: +1: -n: +0: 0: -1: +n: 1: -0:\n' +
            '# ' + countsStr + '\n\n';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Export with Prefixes (content + header)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function exportWithPrefixes(content, language, source) {
        var lang = language || detectLanguage(content);
        var meta = prefixMetadata(content, lang);
        var header = exportHeader(meta, source);
        var prefixed = prefixContent(content, lang);
        return { text: header + prefixed, meta: meta };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Download Helper
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function downloadWithPrefixes(content, filename, language, source) {
        var result = exportWithPrefixes(content, language, source);
        var blob = new Blob([result.text], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return result.meta;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // JSON Export (with prefix metadata baked in)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function wrapJsonExport(data, contents, source) {
        // contents: array of { content, language? } or a single string
        var items = Array.isArray(contents) ? contents : [{ content: contents }];
        var totalLines = 0, totalClassified = 0, globalCounts = {};

        items.forEach(function (item) {
            var meta = prefixMetadata(item.content || '', item.language);
            totalLines += meta.totalLines;
            totalClassified += meta.classifiedLines;
            for (var cat in meta.prefixCounts) {
                globalCounts[cat] = (globalCounts[cat] || 0) + meta.prefixCounts[cat];
            }
        });

        return Object.assign({}, data, {
            quantumGutter: {
                source: source || 'unknown',
                version: '9-symbol-v1',
                symbols: ['n:', '+1:', '-n:', '+0:', '0:', '-1:', '+n:', '1:', '-0:'],
                totalLines: totalLines,
                classifiedLines: totalClassified,
                coverage: totalLines > 0 ? Math.round((totalClassified / totalLines) * 100) + '%' : '0%',
                prefixCounts: globalCounts,
                timestamp: new Date().toISOString()
            }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANSI gutter line (for terminal rendering)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function gutterLineAnsi(line, lineNum, language) {
        var result = classifyLine(line, language);
        var col = PREFIX_ANSI[result.sym] || '\x1b[90m';
        var num = String(lineNum).padStart(3);
        return '\x1b[90m' + num + '\x1b[0m ' + col + result.sym.padEnd(3) + '\x1b[0m ' + line;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Live Sync — BroadcastChannel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    var _syncChannel = null;
    var _stateListeners = [];
    var _globalState = {};    // source → { coverage, lines, prefixCounts, ... }
    var _iotSocket = null;
    var _iotUrl = null;

    function _ensureChannel() {
        if (_syncChannel) return _syncChannel;
        try {
            _syncChannel = new BroadcastChannel('quantum-prefixes');
            _syncChannel.onmessage = function (e) {
                var msg = e.data;
                if (msg && msg.type === 'qp-state') {
                    _globalState[msg.source] = msg.state;
                    _stateListeners.forEach(function (fn) { fn(msg.source, msg.state, _globalState); });
                    // Relay to IoT bridge if connected
                    _relayToIoT(msg);
                } else if (msg && msg.type === 'qp-request') {
                    // Another app requesting current state — re-broadcast ours
                    _stateListeners.forEach(function (fn) { fn('__request__', null, _globalState); });
                }
            };
        } catch (e) {
            // BroadcastChannel not available (e.g. old browser)
        }
        return _syncChannel;
    }

    /**
     * Broadcast current quantum prefix state for this source app.
     * @param {string} source  App name (e.g. 'hexbench', 'notepad', 'hexterm')
     * @param {object} state   State object { coverage, totalLines, classifiedLines, prefixCounts, ... }
     */
    function broadcastState(source, state) {
        var ch = _ensureChannel();
        var payload = {
            type: 'qp-state',
            source: source,
            state: Object.assign({}, state, { timestamp: Date.now() }),
        };
        if (ch) ch.postMessage(payload);
        // Also persist to localStorage for cold-start recovery
        _globalState[source] = payload.state;
        try {
            localStorage.setItem('quantum-prefixes-state', JSON.stringify(_globalState));
        } catch (e) { /* quota */ }
        // Relay to IoT
        _relayToIoT(payload);
    }

    /**
     * Request all apps to re-broadcast their state.
     */
    function requestStateSync() {
        var ch = _ensureChannel();
        if (ch) ch.postMessage({ type: 'qp-request' });
    }

    /**
     * Register a listener for state changes.
     * @param {function} fn  Called with (source, state, globalState)
     */
    function onStateChange(fn) {
        _stateListeners.push(fn);
        // Deliver current global state immediately
        for (var src in _globalState) {
            fn(src, _globalState[src], _globalState);
        }
    }

    /**
     * Get aggregate global state (all sources combined).
     */
    function getGlobalState() {
        return Object.assign({}, _globalState);
    }

    /**
     * Load last-known state from localStorage (call on init).
     */
    function loadPersistedState() {
        try {
            var raw = localStorage.getItem('quantum-prefixes-state');
            if (raw) _globalState = JSON.parse(raw);
        } catch (e) { /* corrupt */ }
        return Object.assign({}, _globalState);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // IoT / Quantum Computer Bridge
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    /**
     * Connect to an IoT quantum computer bridge via WebSocket.
     * Messages are JSON: { type: 'qp-state', source, state }
     * The bridge can also push commands back.
     * @param {string} url  WebSocket URL (e.g. 'ws://192.168.1.100:9877/quantum')
     * @param {object} opts  { onMessage, onOpen, onClose, onError, reconnect }
     */
    function connectIoT(url, opts) {
        opts = opts || {};
        _iotUrl = url;

        function _connect() {
            try {
                _iotSocket = new WebSocket(url);
                _iotSocket.onopen = function () {
                    // Send full global state on connect
                    _iotSocket.send(JSON.stringify({
                        type: 'qp-init',
                        globalState: _globalState,
                        timestamp: Date.now()
                    }));
                    if (opts.onOpen) opts.onOpen();
                };
                _iotSocket.onmessage = function (e) {
                    try {
                        var msg = JSON.parse(e.data);
                        // Forward IoT commands to BroadcastChannel
                        if (msg.type === 'qp-command') {
                            var ch = _ensureChannel();
                            if (ch) ch.postMessage(msg);
                        }
                        if (opts.onMessage) opts.onMessage(msg);
                    } catch (err) { /* parse error */ }
                };
                _iotSocket.onclose = function () {
                    _iotSocket = null;
                    if (opts.onClose) opts.onClose();
                    if (opts.reconnect !== false) {
                        setTimeout(_connect, 5000);
                    }
                };
                _iotSocket.onerror = function (err) {
                    if (opts.onError) opts.onError(err);
                };
            } catch (e) {
                if (opts.onError) opts.onError(e);
                if (opts.reconnect !== false) {
                    setTimeout(_connect, 5000);
                }
            }
        }

        _connect();
    }

    function _relayToIoT(payload) {
        if (_iotSocket && _iotSocket.readyState === WebSocket.OPEN) {
            try {
                _iotSocket.send(JSON.stringify(payload));
            } catch (e) { /* socket error */ }
        }
    }

    function disconnectIoT() {
        if (_iotSocket) {
            _iotSocket.close();
            _iotSocket = null;
        }
        _iotUrl = null;
    }

    function isIoTConnected() {
        return _iotSocket && _iotSocket.readyState === WebSocket.OPEN;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Aggregate Stats Helper
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function aggregateGlobalStats() {
        var totalLines = 0, totalClassified = 0, counts = {}, sources = [];
        for (var src in _globalState) {
            var s = _globalState[src];
            if (!s) continue;
            sources.push(src);
            totalLines += (s.totalLines || 0);
            totalClassified += (s.classifiedLines || 0);
            if (s.prefixCounts) {
                for (var cat in s.prefixCounts) {
                    counts[cat] = (counts[cat] || 0) + s.prefixCounts[cat];
                }
            }
        }
        return {
            sources: sources,
            totalLines: totalLines,
            classifiedLines: totalClassified,
            coverage: totalLines > 0 ? Math.round((totalClassified / totalLines) * 100) : 0,
            prefixCounts: counts
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Theme Engine — Light / Dark mode for all apps
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    var THEMES = {
        dark: {
            '--qp-bg':           '#0d1117',
            '--qp-bg-secondary': '#161b22',
            '--qp-bg-tertiary':  '#21262d',
            '--qp-bg-hover':     '#292e36',
            '--qp-border':       '#30363d',
            '--qp-border-muted': '#21262d',
            '--qp-text':         '#e6edf3',
            '--qp-text-secondary': '#c9d1d9',
            '--qp-text-muted':   '#8b949e',
            '--qp-accent':       '#58a6ff',
            '--qp-accent-subtle':'rgba(56,139,253,0.15)',
            '--qp-shadow':       'rgba(0,0,0,0.3)',
            '--qp-card':         '#161b22',
            '--qp-card-border':  '#21262d',
            '--qp-input-bg':     '#0d1117',
            '--qp-canvas-bg':    '#0d1117',
            '--qp-code-bg':      '#161b22',
            '--qp-scrollbar':    '#30363d',
            '--qp-scrollbar-track': '#0d1117',
        },
        light: {
            '--qp-bg':           '#ffffff',
            '--qp-bg-secondary': '#f6f8fa',
            '--qp-bg-tertiary':  '#eaeef2',
            '--qp-bg-hover':     '#e2e6ea',
            '--qp-border':       '#d0d7de',
            '--qp-border-muted': '#d8dee4',
            '--qp-text':         '#1f2328',
            '--qp-text-secondary': '#424a53',
            '--qp-text-muted':   '#656d76',
            '--qp-accent':       '#0969da',
            '--qp-accent-subtle':'rgba(9,105,218,0.1)',
            '--qp-shadow':       'rgba(31,35,40,0.12)',
            '--qp-card':         '#ffffff',
            '--qp-card-border':  '#d0d7de',
            '--qp-input-bg':     '#f6f8fa',
            '--qp-canvas-bg':    '#f6f8fa',
            '--qp-code-bg':      '#f6f8fa',
            '--qp-scrollbar':    '#c1c8cd',
            '--qp-scrollbar-track': '#f6f8fa',
        }
    };

    var _currentTheme = 'dark';
    var _themeStyleEl = null;
    var _themeToggleEl = null;
    var _themeChannel = null;
    var _themeListeners = [];

    function _ensureThemeChannel() {
        if (_themeChannel) return _themeChannel;
        try {
            _themeChannel = new BroadcastChannel('qp-theme');
            _themeChannel.onmessage = function(e) {
                if (e.data && e.data.type === 'qp-theme-change' && e.data.theme !== _currentTheme) {
                    _applyTheme(e.data.theme, true);
                }
            };
        } catch(e) {}
        return _themeChannel;
    }

    function _applyTheme(theme, fromBroadcast) {
        _currentTheme = theme;
        var vars = THEMES[theme] || THEMES.dark;

        // Set CSS custom properties on :root
        var root = document.documentElement;
        for (var key in vars) { root.style.setProperty(key, vars[key]); }

        // Set data attribute for CSS selectors
        root.setAttribute('data-theme', theme);

        // Inject override stylesheet that maps hardcoded dark colors → variables
        if (!_themeStyleEl && typeof document !== 'undefined') {
            _themeStyleEl = document.createElement('style');
            _themeStyleEl.id = 'qp-theme-overrides';
            document.head.appendChild(_themeStyleEl);
        }

        if (_themeStyleEl) {
            // This CSS overrides hardcoded colors with theme variables.
            // Pages that already use --cursor-* get mapped too.
            _themeStyleEl.textContent = theme === 'light' ? [
                ':root {',
                '  --cursor-bg: var(--qp-bg); --cursor-bg-secondary: var(--qp-bg-secondary);',
                '  --cursor-bg-tertiary: var(--qp-bg-tertiary); --cursor-bg-hover: var(--qp-bg-hover);',
                '  --cursor-border: var(--qp-border); --cursor-border-muted: var(--qp-border-muted);',
                '  --cursor-text: var(--qp-text); --cursor-text-secondary: var(--qp-text-secondary);',
                '  --cursor-text-muted: var(--qp-text-muted); --cursor-accent: var(--qp-accent);',
                '  --cursor-accent-subtle: var(--qp-accent-subtle); --cursor-shadow: var(--qp-shadow);',
                '  --bg: var(--qp-bg); --bg2: var(--qp-bg-secondary); --bg3: var(--qp-bg-tertiary);',
                '  --border: var(--qp-border); --text: var(--qp-text); --text-m: var(--qp-text-muted);',
                '  --muted: var(--qp-text-muted);',
                '  color-scheme: light;',
                '}',
                'body { background: var(--qp-bg) !important; color: var(--qp-text) !important; }',
                '::-webkit-scrollbar-thumb { background: var(--qp-scrollbar) !important; }',
                '::-webkit-scrollbar-track { background: var(--qp-scrollbar-track) !important; }',
                // Map common hardcoded dark backgrounds
                '[style*="background:#0d1117"], [style*="background: #0d1117"] { background: var(--qp-bg) !important; }',
                '[style*="background:#161b22"], [style*="background: #161b22"] { background: var(--qp-bg-secondary) !important; }',
                '[style*="background:#21262d"], [style*="background: #21262d"] { background: var(--qp-bg-tertiary) !important; }',
                '[style*="color:#e6edf3"], [style*="color: #e6edf3"] { color: var(--qp-text) !important; }',
                '[style*="color:#c9d1d9"], [style*="color: #c9d1d9"] { color: var(--qp-text-secondary) !important; }',
                '[style*="color:#8b949e"], [style*="color: #8b949e"] { color: var(--qp-text-muted) !important; }',
                '[style*="border-color:#30363d"], [style*="border-color: #30363d"] { border-color: var(--qp-border) !important; }',
                // Common element overrides
                'input, textarea, select { background: var(--qp-input-bg) !important; color: var(--qp-text) !important; border-color: var(--qp-border) !important; }',
                'code { background: var(--qp-code-bg) !important; }',
                'pre { background: var(--qp-code-bg) !important; }',
                '.hero, .cta { background: var(--qp-bg-secondary) !important; }',
                'canvas { border-color: var(--qp-border) !important; }',
                // Quantum nav cube — light mode needs opaque-ish backgrounds for 3D faces
                '.nav-cube-face { background: rgba(240,242,245,0.92) !important; border-color: var(--qp-border) !important; }',
                '.nav-cube-face span { background: rgba(220,225,230,0.8) !important; color: var(--qp-text-muted) !important; }',
                '.nav-cube-face span:hover { color: var(--qp-text) !important; }',
                '.nav-cube-face span.ncf-active { color: #fff !important; }',
                '.nav-cube-arrow { background: var(--qp-bg-tertiary) !important; color: var(--qp-text-muted) !important; border-color: var(--qp-border) !important; }',
                '.ncv-controls { border-top-color: var(--qp-border) !important; }',
                // Sidebar panels — ensure backgrounds are not too white in light mode
                '.sidebar-tabs-ext { background: var(--qp-bg-tertiary) !important; }',
                '.sidebar-tab-ext-panel { background: var(--qp-bg) !important; }',
                '.gpuq-mini-card { background: var(--qp-bg-tertiary) !important; border-color: var(--qp-border) !important; }',
                '.gpuq-mini-label { border-top-color: var(--qp-border-muted, var(--qp-border)) !important; }',
                '.chat-msg { background: var(--qp-bg-tertiary) !important; }',
                '.chat-msg.sys { background: none !important; }',
                '.chat-link-bar { background: var(--qp-bg-tertiary) !important; }',
                '.layer-btn { background: var(--qp-bg-tertiary) !important; border-color: var(--qp-border) !important; }',
                '.blocks-panel, .lang-panel, .llm-panel, .gpuq-panel { background: var(--qp-bg) !important; }',
                // kBatch panels
                '.lkb-panel { background: var(--qp-bg) !important; }',
            ].join('\n') : [
                ':root {',
                '  --cursor-bg: var(--qp-bg); --cursor-bg-secondary: var(--qp-bg-secondary);',
                '  --cursor-bg-tertiary: var(--qp-bg-tertiary); --cursor-bg-hover: var(--qp-bg-hover);',
                '  --cursor-border: var(--qp-border); --cursor-border-muted: var(--qp-border-muted);',
                '  --cursor-text: var(--qp-text); --cursor-text-secondary: var(--qp-text-secondary);',
                '  --cursor-text-muted: var(--qp-text-muted); --cursor-accent: var(--qp-accent);',
                '  --cursor-accent-subtle: var(--qp-accent-subtle); --cursor-shadow: var(--qp-shadow);',
                '  --bg: var(--qp-bg); --bg2: var(--qp-bg-secondary); --bg3: var(--qp-bg-tertiary);',
                '  --border: var(--qp-border); --text: var(--qp-text); --text-m: var(--qp-text-muted);',
                '  --muted: var(--qp-text-muted);',
                '  color-scheme: dark;',
                '}',
            ].join('\n');
        }

        // Update toggle button appearance — highlight active side
        try {
            var sunEl = document.getElementById('qp-theme-sun');
            var moonEl = document.getElementById('qp-theme-moon');
            if (sunEl && moonEl) {
                sunEl.style.background = theme === 'light' ? 'var(--qp-accent-subtle, rgba(88,166,255,0.15))' : 'none';
                sunEl.style.color = theme === 'light' ? 'var(--qp-accent, #58a6ff)' : 'var(--qp-text-muted, #8b949e)';
                moonEl.style.background = theme === 'dark' ? 'var(--qp-accent-subtle, rgba(88,166,255,0.15))' : 'none';
                moonEl.style.color = theme === 'dark' ? 'var(--qp-accent, #58a6ff)' : 'var(--qp-text-muted, #8b949e)';
            }
        } catch(e) {}

        // Persist
        try { localStorage.setItem('qp-theme', theme); } catch(e) {}

        // Broadcast to other tabs
        if (!fromBroadcast) {
            var ch = _ensureThemeChannel();
            if (ch) ch.postMessage({ type: 'qp-theme-change', theme: theme });
        }

        // Notify listeners
        _themeListeners.forEach(function(fn) { fn(theme); });
    }

    function toggleTheme() {
        try { localStorage.setItem('qp-theme-override', 'yes'); } catch(e) {}
        _applyTheme(_currentTheme === 'dark' ? 'light' : 'dark');
    }

    function setTheme(theme) {
        if (theme === 'dark' || theme === 'light') _applyTheme(theme);
    }

    function getTheme() { return _currentTheme; }

    function onThemeChange(fn) { _themeListeners.push(fn); }

    function _initTheme() {
        if (typeof document === 'undefined') return;
        try {
            // Determine if user has manually overridden, or if we auto-detect
            var userOverride = null;
            try { userOverride = localStorage.getItem('qp-theme-override'); } catch(e) {}
            var saved = null;
            try { saved = localStorage.getItem('qp-theme'); } catch(e) {}

            var systemPref = 'dark';
            try {
                if (root.matchMedia && root.matchMedia('(prefers-color-scheme: light)').matches) systemPref = 'light';
            } catch(e) {}

            // If user has a manual override, use it; otherwise follow system
            var initial = (userOverride === 'yes' && saved) ? saved : systemPref;

            // Create side-by-side ☀ ☾ toggle — top-right, no circle
            _themeToggleEl = document.createElement('div');
            _themeToggleEl.id = 'qp-theme-toggle';
            var s = _themeToggleEl.style;
            s.position = 'fixed'; s.top = '8px'; s.right = '12px'; s.zIndex = '99999';
            s.display = 'flex'; s.alignItems = 'center'; s.gap = '0';
            s.borderRadius = '6px'; s.overflow = 'hidden';
            s.border = '1px solid var(--qp-border, #30363d)';
            s.background = 'var(--qp-bg-secondary, #161b22)';
            s.boxShadow = '0 1px 4px var(--qp-shadow, rgba(0,0,0,0.2))';
            s.fontFamily = 'system-ui, sans-serif'; s.lineHeight = '1';
            s.userSelect = 'none'; s.webkitUserSelect = 'none';

            // Sun button (light)
            var sunBtn = document.createElement('button');
            sunBtn.id = 'qp-theme-sun';
            sunBtn.textContent = '☀';
            sunBtn.title = 'Light mode';
            _styleThemeBtn(sunBtn);

            // Moon button (dark)
            var moonBtn = document.createElement('button');
            moonBtn.id = 'qp-theme-moon';
            moonBtn.textContent = '☾';
            moonBtn.title = 'Dark mode';
            _styleThemeBtn(moonBtn);

            sunBtn.addEventListener('click', function() {
                try { localStorage.setItem('qp-theme-override', 'yes'); } catch(e) {}
                _applyTheme('light');
            });
            moonBtn.addEventListener('click', function() {
                try { localStorage.setItem('qp-theme-override', 'yes'); } catch(e) {}
                _applyTheme('dark');
            });

            _themeToggleEl.appendChild(sunBtn);
            _themeToggleEl.appendChild(moonBtn);
            document.body.appendChild(_themeToggleEl);

            _ensureThemeChannel();
            _applyTheme(initial);

            // Auto-detect system preference changes — apply unless user has overridden
            if (root.matchMedia) {
                try {
                    root.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
                        try {
                            var override = localStorage.getItem('qp-theme-override');
                            if (override !== 'yes') {
                                _applyTheme(e.matches ? 'light' : 'dark');
                            }
                        } catch(ex) {}
                    });
                } catch(e) {}
            }
        } catch(err) {
            // Failsafe — never crash the page over theme init
            if (typeof console !== 'undefined') console.warn('QP theme init error:', err);
        }
    }

    function _styleThemeBtn(btn) {
        var s = btn.style;
        s.background = 'none'; s.border = 'none'; s.padding = '4px 10px';
        s.fontSize = '14px'; s.cursor = 'pointer'; s.color = 'var(--qp-text-muted, #8b949e)';
        s.transition = 'all 0.15s ease'; s.lineHeight = '1'; s.borderRadius = '0';
        s.outline = 'none'; s.display = 'flex'; s.alignItems = 'center'; s.justifyContent = 'center';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Auto-init
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    loadPersistedState();
    _ensureChannel();

    // Init theme when DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _initTheme);
        } else {
            _initTheme();
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Public API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    var API = {
        // Constants
        PREFIXES: PREFIXES,
        PREFIX_ANSI: PREFIX_ANSI,
        LANG_PATTERNS: LANG_PATTERNS,
        VERSION: '9-symbol-v1',

        // Core
        detectLanguage: detectLanguage,
        classifyLine: classifyLine,
        classifyLineSym: classifyLineSym,

        // Content operations
        prefixContent: prefixContent,
        prefixMetadata: prefixMetadata,
        exportHeader: exportHeader,
        exportWithPrefixes: exportWithPrefixes,
        downloadWithPrefixes: downloadWithPrefixes,
        wrapJsonExport: wrapJsonExport,
        gutterLineAnsi: gutterLineAnsi,

        // Live sync
        broadcastState: broadcastState,
        requestStateSync: requestStateSync,
        onStateChange: onStateChange,
        getGlobalState: getGlobalState,
        loadPersistedState: loadPersistedState,
        aggregateGlobalStats: aggregateGlobalStats,

        // IoT / Quantum bridge
        connectIoT: connectIoT,
        disconnectIoT: disconnectIoT,
        isIoTConnected: isIoTConnected,

        // Theme
        toggleTheme: toggleTheme,
        setTheme: setTheme,
        getTheme: getTheme,
        onThemeChange: onThemeChange,
        THEMES: THEMES,
    };

    // Expose globally
    root.QuantumPrefixes = API;

    // Also expose as module if available
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;
    }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
