// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
//
// VS Code Extension: Quantum Prefix Gutter
// Renders the 11-symbol prefix system as gutter decorations in every editor.
//
// Architecture:
//   1. Classifies each line using regex (fast) or WASM engine (faster)
//   2. Renders prefix symbols as gutter decorations with color coding
//   3. Shows coverage % in status bar
//   4. Supports dimensional diff, heatmap, and quantum circuit views

import * as vscode from 'vscode';

// ── Prefix System ──

interface ClassifyResult {
    symbol: string;
    category: string;
    bits: number;
    coords: [number, number, number];
}

const SYMBOLS = {
    '+1': { color: '#7ee787', category: 'declaration', label: 'decl' },
    '1':  { color: '#79c0ff', category: 'logic',       label: 'logic' },
    '-1': { color: '#ff7b72', category: 'io',          label: 'io' },
    '+0': { color: '#d2a8ff', category: 'assignment',  label: 'assign' },
    '0':  { color: '#484f58', category: 'neutral',     label: 'neutral' },
    '-0': { color: '#8b949e', category: 'comment',     label: 'comment' },
    '+n': { color: '#f0d852', category: 'modifier',    label: 'mod' },
    'n':  { color: '#f0883e', category: 'import',      label: 'import' },
    '-n': { color: '#6e7681', category: 'unknown',     label: 'unknown' },
} as const;

type PrefixSymbol = keyof typeof SYMBOLS;

// ── Classifier ──

const KEYWORDS: Record<string, PrefixSymbol> = {};
const KEYWORD_MAP: Array<[string[], PrefixSymbol]> = [
    [['import', 'from', 'use', 'require', 'using', 'extern', 'mod', 'package'], 'n'],
    [['fn', 'function', 'def', 'class', 'struct', 'enum', 'trait', 'interface', 'type', 'const', 'let', 'var', 'val', 'static', 'impl', 'export'], '+1'],
    [['if', 'else', 'elif', 'for', 'while', 'loop', 'match', 'switch', 'case', 'try', 'catch', 'except', 'finally', 'do'], '1'],
    [['return', 'yield', 'break', 'continue', 'throw', 'raise', 'defer', 'await'], '+n'],
];

function classifyLine(line: string): ClassifyResult {
    const trimmed = line.trim();
    if (!trimmed) return { symbol: '0', category: 'neutral', bits: 4, coords: [0, 0, 0] };

    // Comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')
        || trimmed.startsWith('--') || trimmed.startsWith('<!--')) {
        return { symbol: '-0', category: 'comment', bits: 5, coords: [-1, 0, 0] };
    }

    // #include
    if (trimmed.startsWith('#include')) {
        return { symbol: 'n', category: 'import', bits: 7, coords: [0, -1, 0] };
    }

    // Keyword matching
    for (const [keywords, sym] of KEYWORD_MAP) {
        for (const kw of keywords) {
            if (trimmed.startsWith(kw) && (trimmed.length === kw.length || /[\s({:<[\t!.]/.test(trimmed[kw.length]))) {
                const info = SYMBOLS[sym];
                return { symbol: sym, category: info.category, bits: 0, coords: [0, 0, 0] };
            }
        }
    }

    // pub fn, pub struct, async fn
    if (trimmed.startsWith('pub fn') || trimmed.startsWith('pub struct') || trimmed.startsWith('async fn')) {
        return { symbol: '+1', category: 'declaration', bits: 0, coords: [1, 1, 0] };
    }
    if (trimmed.startsWith('} else')) {
        return { symbol: '1', category: 'logic', bits: 1, coords: [0, 1, 0] };
    }

    // I/O patterns
    const ioPatterns = ['print', 'console.', '.log(', '.warn(', '.error(', 'write(', 'read(', 'fetch(', 'stdin', 'stdout', 'stderr'];
    for (const p of ioPatterns) {
        if (trimmed.includes(p)) return { symbol: '-1', category: 'io', bits: 2, coords: [-1, 1, 0] };
    }

    // Assignment
    for (let i = 0; i < trimmed.length - 1; i++) {
        if (trimmed[i] === '=' && trimmed[i - 1] !== '=' && trimmed[i + 1] !== '=') {
            return { symbol: '+0', category: 'assignment', bits: 3, coords: [1, 0, 0] };
        }
    }

    // Closing delimiters
    if (['}', '};', ')', ']', 'end', 'fi', 'done'].includes(trimmed)) {
        return { symbol: '0', category: 'neutral', bits: 4, coords: [0, 0, 0] };
    }

    return { symbol: '-n', category: 'unknown', bits: 8, coords: [-1, -1, 0] };
}

// ── Gutter Decorations ──

const decorationTypes = new Map<PrefixSymbol, vscode.TextEditorDecorationType>();

function createDecorationTypes() {
    for (const [sym, info] of Object.entries(SYMBOLS)) {
        const dt = vscode.window.createTextEditorDecorationType({
            gutterIconPath: undefined, // Will use text decoration instead
            before: {
                contentText: sym.padStart(2),
                color: info.color,
                fontWeight: 'bold',
                width: '28px',
                textDecoration: 'none; font-size: 10px; font-family: monospace; text-align: right; display: inline-block',
            },
            isWholeLine: false,
        });
        decorationTypes.set(sym as PrefixSymbol, dt);
    }
}

// ── Status Bar ──

let statusBarItem: vscode.StatusBarItem;

function updateStatusBar(results: ClassifyResult[]) {
    if (!statusBarItem) return;
    const classified = results.filter(r => r.category !== 'neutral' && r.category !== 'unknown').length;
    const coverage = results.length > 0 ? ((classified / results.length) * 100).toFixed(0) : '0';
    statusBarItem.text = `⚛ ${coverage}% prefixed`;
    statusBarItem.tooltip = `Quantum Prefixes: ${classified}/${results.length} lines classified`;
    statusBarItem.show();
}

// ── Main Update ──

function updateDecorations(editor: vscode.TextEditor) {
    const config = vscode.workspace.getConfiguration('quantumPrefixes');
    if (!config.get('enabled')) return;

    const doc = editor.document;
    const lang = doc.languageId;
    const enabledLangs = config.get<string[]>('languages') || [];
    if (enabledLangs.length > 0 && !enabledLangs.includes(lang)) return;

    const results: ClassifyResult[] = [];
    const decoMap = new Map<PrefixSymbol, vscode.DecorationOptions[]>();

    for (const sym of Object.keys(SYMBOLS)) {
        decoMap.set(sym as PrefixSymbol, []);
    }

    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;
        const result = classifyLine(line);
        results.push(result);

        const arr = decoMap.get(result.symbol as PrefixSymbol);
        if (arr) {
            arr.push({
                range: new vscode.Range(i, 0, i, 0),
                hoverMessage: `${result.symbol} → ${result.category}`,
            });
        }
    }

    // Apply decorations
    for (const [sym, dt] of decorationTypes) {
        const ranges = decoMap.get(sym) || [];
        editor.setDecorations(dt, ranges);
    }

    updateStatusBar(results);
}

// ── Activation ──

export function activate(context: vscode.ExtensionContext) {
    createDecorationTypes();

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'quantumPrefixes.toggle';
    context.subscriptions.push(statusBarItem);

    // Update on editor change
    let timeout: NodeJS.Timeout | undefined;
    function triggerUpdate(editor?: vscode.TextEditor) {
        if (!editor) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => updateDecorations(editor), 150);
    }

    vscode.window.onDidChangeActiveTextEditor(triggerUpdate, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(e => {
        const editor = vscode.window.activeTextEditor;
        if (editor && e.document === editor.document) triggerUpdate(editor);
    }, null, context.subscriptions);

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('quantumPrefixes.toggle', () => {
            const config = vscode.workspace.getConfiguration('quantumPrefixes');
            const current = config.get('enabled');
            config.update('enabled', !current, true);
            vscode.window.showInformationMessage(`Quantum Prefixes: ${!current ? 'Enabled' : 'Disabled'}`);
            if (vscode.window.activeTextEditor) triggerUpdate(vscode.window.activeTextEditor);
        }),

        vscode.commands.registerCommand('quantumPrefixes.classify', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const doc = editor.document;
            const results: ClassifyResult[] = [];
            for (let i = 0; i < doc.lineCount; i++) {
                results.push(classifyLine(doc.lineAt(i).text));
            }
            const counts: Record<string, number> = {};
            results.forEach(r => { counts[r.symbol] = (counts[r.symbol] || 0) + 1; });
            const classified = results.filter(r => r.category !== 'neutral' && r.category !== 'unknown').length;
            const summary = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' | ');
            vscode.window.showInformationMessage(
                `⚛ ${doc.fileName.split('/').pop()}: ${classified}/${results.length} lines (${((classified/results.length)*100).toFixed(0)}%) — ${summary}`
            );
        }),

        vscode.commands.registerCommand('quantumPrefixes.export', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const doc = editor.document;
            let output = '// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}\n';
            for (let i = 0; i < doc.lineCount; i++) {
                const line = doc.lineAt(i).text;
                const result = classifyLine(line);
                output += `// ${result.symbol.padStart(2)}: ${i + 1} ${line}\n`;
            }
            const newDoc = await vscode.workspace.openTextDocument({ content: output, language: doc.languageId });
            vscode.window.showTextDocument(newDoc);
        }),

        vscode.commands.registerCommand('quantumPrefixes.heatmap', () => {
            vscode.window.showInformationMessage('⚛ Quantum Heatmap — coming in v0.2.0 (webview panel with treemap visualization)');
        }),

        vscode.commands.registerCommand('quantumPrefixes.dimensionalDiff', () => {
            vscode.window.showInformationMessage('⚛ Dimensional Diff — coming in v0.2.0 (X/Y/Z spatial diff view)');
        }),

        vscode.commands.registerCommand('quantumPrefixes.circuit', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const doc = editor.document;

            // Build circuit from prefix classification
            const GATE_MAP: Record<string, { gate: string; qubits: number }> = {
                '+1': { gate: 'H', qubits: 1 },
                '1':  { gate: 'CNOT', qubits: 2 },
                '-1': { gate: 'X', qubits: 1 },
                '+0': { gate: 'Rz', qubits: 1 },
                '0':  { gate: 'I', qubits: 1 },
                '-0': { gate: 'S', qubits: 1 },
                '+n': { gate: 'T', qubits: 1 },
                'n':  { gate: 'SWAP', qubits: 2 },
                '-n': { gate: 'M', qubits: 1 },
            };

            const gates: Array<{ gate: string; qubit: number; target?: number; line: number; symbol: string }> = [];
            let maxQ = 0, qPtr = 0;

            for (let i = 0; i < doc.lineCount; i++) {
                const result = classifyLine(doc.lineAt(i).text);
                const mapping = GATE_MAP[result.symbol] || GATE_MAP['-n'];
                const g: typeof gates[0] = { gate: mapping.gate, qubit: qPtr % 8, line: i + 1, symbol: result.symbol };
                if (mapping.qubits === 2) g.target = (qPtr + 1) % 8;
                gates.push(g);
                if (g.qubit > maxQ) maxQ = g.qubit;
                if (g.target !== undefined && g.target > maxQ) maxQ = g.target;
                if (['+1', '1', '+0'].includes(result.symbol)) qPtr++;
                if (['+n', '-n', '-0'].includes(result.symbol)) qPtr = Math.max(0, qPtr - 1);
            }

            // Build ASCII circuit
            const numQ = maxQ + 1;
            const circuitLines: string[] = [];
            for (let q = 0; q < numQ; q++) {
                let wire = `q${q}: `;
                gates.forEach(g => {
                    if (g.qubit === q) wire += `[${g.gate}]─`;
                    else if (g.target === q) wire += `─●──`;
                    else wire += `────`;
                });
                circuitLines.push(wire);
            }

            // Show as QASM in new document
            let qasm = `// ⚛ Quantum Circuit — ${doc.fileName.split('/').pop()}\n`;
            qasm += `// ${numQ} qubits, ${gates.length} gates\n\n`;
            qasm += `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${numQ}];\ncreg c[${numQ}];\n\n`;
            gates.forEach(g => {
                if (g.gate === 'CNOT') qasm += `cx q[${g.qubit}],q[${g.target ?? 0}];  // line ${g.line} (${g.symbol})\n`;
                else if (g.gate === 'SWAP') qasm += `swap q[${g.qubit}],q[${g.target ?? 0}];  // line ${g.line} (${g.symbol})\n`;
                else if (g.gate === 'Rz') qasm += `rz(0.7854) q[${g.qubit}];  // line ${g.line} (${g.symbol})\n`;
                else if (g.gate !== 'I' && g.gate !== 'M') qasm += `${g.gate.toLowerCase()} q[${g.qubit}];  // line ${g.line} (${g.symbol})\n`;
            });
            qasm += `\nmeasure q -> c;\n\n// ── ASCII Circuit ──\n// ${circuitLines.join('\n// ')}`;

            vscode.workspace.openTextDocument({ content: qasm, language: 'plaintext' }).then(d => {
                vscode.window.showTextDocument(d);
            });
        }),
    );

    // Initial update
    if (vscode.window.activeTextEditor) {
        triggerUpdate(vscode.window.activeTextEditor);
    }

    console.log('⚛ uvspeed Quantum Prefixes extension activated');
}

export function deactivate() {
    for (const dt of decorationTypes.values()) {
        dt.dispose();
    }
    decorationTypes.clear();
    if (statusBarItem) statusBarItem.dispose();
}
