// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// UVspeed - Advanced Notes & Terminal Environment
// Desktop app with quantum navigation, multi-instance windows, and AI integration
// v3.2.0 — QubesOS-style isolated instances, MCP-ready

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const WebSocket = require('ws');

let terminalServer;
let wsServer;

// App configuration
const isDev = process.argv.includes('--dev');
const APP_NAME = 'UVspeed';
const PORT = 3847; // UFFO in phone keypad

// Project root is two levels up from src/02-electron/
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// ═══════════════════════════════════════════════════════════════════════════
// Window Registry — QubesOS-style isolated instances
// Each window is an independent instance with its own state.
// The bridge server is the shared brain; windows communicate via IPC/WS.
// ═══════════════════════════════════════════════════════════════════════════

class WindowRegistry {
    constructor() {
        /** @type {Map<string, {window: BrowserWindow, page: string, createdAt: number}>} */
        this.windows = new Map();
        this._counter = 0;
    }

    /** Create a new isolated instance window */
    createInstance(page, options = {}) {
        const id = `inst-${++this._counter}-${Date.now().toString(36)}`;
        const defaults = {
            width: options.width || 1400,
            height: options.height || 900,
            minWidth: 900,
            minHeight: 600,
            title: `${APP_NAME} — ${page}`,
            icon: path.join(PROJECT_ROOT, 'icons', 'icon-192.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: !isDev
            },
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#0d1117',
            show: false,
        };

        const win = new BrowserWindow(defaults);
        const url = `http://localhost:${PORT}/web/${page}`;
        win.loadURL(url);

        win.once('ready-to-show', () => win.show());

        win.on('closed', () => {
            this.windows.delete(id);
            console.log(`🔒 Instance closed: ${id} (${page}) — ${this.windows.size} remaining`);
        });

        // Handle external links — open in system browser, not new Electron window
        win.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http://localhost:' + PORT)) {
                // Internal page — open as new instance
                const pageName = url.split('/web/')[1];
                if (pageName) this.createInstance(pageName);
                return { action: 'deny' };
            }
            shell.openExternal(url);
            return { action: 'deny' };
        });

        this.windows.set(id, { window: win, page, createdAt: Date.now() });
        console.log(`🟢 Instance created: ${id} (${page}) — ${this.windows.size} total`);
        return { id, window: win };
    }

    /** Get the focused window or the first one */
    getFocused() {
        return BrowserWindow.getFocusedWindow() || this.getFirst();
    }

    /** Get the first window (main) */
    getFirst() {
        const first = this.windows.values().next().value;
        return first ? first.window : null;
    }

    /** Send IPC message to all instances */
    broadcastToAll(channel, ...args) {
        this.windows.forEach(({ window }) => {
            if (!window.isDestroyed()) {
                window.webContents.send(channel, ...args);
            }
        });
    }

    /** Send IPC to specific instance */
    sendTo(instanceId, channel, ...args) {
        const entry = this.windows.get(instanceId);
        if (entry && !entry.window.isDestroyed()) {
            entry.window.webContents.send(channel, ...args);
        }
    }

    /** List all instances (for session manager API) */
    list() {
        const result = [];
        this.windows.forEach((entry, id) => {
            result.push({
                id,
                page: entry.page,
                createdAt: entry.createdAt,
                focused: entry.window === BrowserWindow.getFocusedWindow(),
                title: entry.window.isDestroyed() ? '(closed)' : entry.window.getTitle(),
            });
        });
        return result;
    }

    /** Save layout for restore on next launch */
    saveLayout() {
        const layout = [];
        this.windows.forEach((entry) => {
            if (!entry.window.isDestroyed()) {
                const bounds = entry.window.getBounds();
                layout.push({ page: entry.page, bounds });
            }
        });
        return layout;
    }

    /** Restore layout from saved state */
    restoreLayout(layout) {
        layout.forEach(({ page, bounds }) => {
            this.createInstance(page, bounds);
        });
    }

    /** Close all windows */
    closeAll() {
        this.windows.forEach(({ window }) => {
            if (!window.isDestroyed()) window.close();
        });
    }
}


class UVspeedApp {
    constructor() {
        this.quantumPosition = [0, 0, 0];
        this.activeTerminals = new Map();
        this.registry = new WindowRegistry();
        this.aiServices = {
            opencode: false,
            copilot: false,
            quantum: true
        };
    }

    async initialize() {
        await this.setupServer();
        this.createMainWindow();
        this.setupMenus();
        this.setupIPC();
    }

    async setupServer() {
        // Express server for serving quantum web interfaces
        const server = express();
        
        // Serve static files (paths relative to project root)
        server.use('/web', express.static(path.join(PROJECT_ROOT, 'web')));
        server.use('/icons', express.static(path.join(PROJECT_ROOT, 'icons')));
        server.use('/src', express.static(path.join(PROJECT_ROOT, 'src')));
        
        // API endpoints
        server.get('/api/status', (req, res) => {
            res.json({
                position: this.quantumPosition,
                terminals: this.activeTerminals.size,
                instances: this.registry.list(),
                ai: this.aiServices,
                version: app.getVersion()
            });
        });
        
        server.get('/api/quantum/position', (req, res) => {
            res.json({ position: this.quantumPosition });
        });
        
        server.post('/api/quantum/navigate', express.json(), (req, res) => {
            const { direction, amount = 1 } = req.body;
            this.navigateQuantum(direction, amount);
            res.json({ position: this.quantumPosition });
        });

        // ── Instance Management API ──
        server.get('/api/instances', (req, res) => {
            res.json({ instances: this.registry.list() });
        });

        server.post('/api/instances', express.json(), (req, res) => {
            const { page } = req.body;
            if (!page) return res.status(400).json({ error: 'page is required' });
            const { id } = this.registry.createInstance(page);
            res.json({ created: true, id, page });
        });

        server.post('/api/instances/message', express.json(), (req, res) => {
            const { instanceId, channel, data } = req.body;
            if (instanceId) {
                this.registry.sendTo(instanceId, channel || 'instance-message', data);
            } else {
                this.registry.broadcastToAll(channel || 'instance-message', data);
            }
            res.json({ sent: true });
        });

        server.get('/api/instances/layout', (req, res) => {
            res.json({ layout: this.registry.saveLayout() });
        });

        server.post('/api/instances/layout', express.json(), (req, res) => {
            const { layout } = req.body;
            if (layout && Array.isArray(layout)) {
                this.registry.restoreLayout(layout);
                res.json({ restored: true, count: layout.length });
            } else {
                res.status(400).json({ error: 'layout array required' });
            }
        });
        
        // Start server
        terminalServer = server.listen(PORT, 'localhost', () => {
            console.log(`🌌 Quantum server running on http://localhost:${PORT}`);
        });
        
        // WebSocket server for real-time updates
        wsServer = new WebSocket.Server({ port: PORT + 1 });
        wsServer.on('connection', (ws) => {
            console.log('📡 WebSocket client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                position: this.quantumPosition,
                instances: this.registry.list(),
                ai: this.aiServices
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
    }

    createMainWindow() {
        // Main window is the Electron terminal UI
        const mainWin = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1000,
            minHeight: 600,
            title: APP_NAME,
            icon: path.join(PROJECT_ROOT, 'icons', 'icon-192.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: !isDev
            },
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#0d1117',
            show: false
        });

        // Load the quantum terminal interface
        if (isDev) {
            mainWin.loadFile(path.join(__dirname, 'src', 'index.html'));
            mainWin.webContents.openDevTools();
        } else {
            mainWin.loadFile(path.join(__dirname, 'src', 'index.html'));
        }

        mainWin.once('ready-to-show', () => {
            mainWin.show();
            this.showWelcomeMessage(mainWin);
        });

        mainWin.on('closed', () => {
            // Only cleanup server when all windows are gone
            if (BrowserWindow.getAllWindows().length === 0) {
                this.cleanup();
            }
        });

        // Handle external links
        mainWin.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http://localhost:' + PORT + '/web/')) {
                const pageName = url.split('/web/')[1];
                if (pageName) this.registry.createInstance(pageName);
                return { action: 'deny' };
            }
            shell.openExternal(url);
            return { action: 'deny' };
        });

        // Register main window in registry
        this.registry.windows.set('main', {
            window: mainWin,
            page: 'index.html',
            createdAt: Date.now()
        });
    }

    setupMenus() {
        const self = this;
        const template = [
            {
                label: 'UVspeed',
                submenu: [
                    {
                        label: 'About UVspeed',
                        click: () => this.showAbout()
                    },
                    { type: 'separator' },
                    {
                        label: 'Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => this.showPreferences()
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit UVspeed',
                        accelerator: 'CmdOrCtrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
                    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
                    { type: 'separator' },
                    { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
                    { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
                    { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
                    { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
                    { type: 'separator' },
                    {
                        label: 'Find',
                        accelerator: 'CmdOrCtrl+F',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('show-find');
                        }
                    }
                ]
            },
            {
                label: 'Quantum',
                submenu: [
                    {
                        label: 'Reset Position',
                        accelerator: 'CmdOrCtrl+0',
                        click: () => this.resetQuantumPosition()
                    },
                    {
                        label: 'Navigate +1 (Lines Up)',
                        accelerator: 'CmdOrCtrl+Up',
                        click: () => this.navigateQuantum('+1')
                    },
                    {
                        label: 'Navigate -1 (Lines Down)', 
                        accelerator: 'CmdOrCtrl+Down',
                        click: () => this.navigateQuantum('-1')
                    },
                    {
                        label: 'Navigate +0 (Dependencies Right)',
                        accelerator: 'CmdOrCtrl+Right',
                        click: () => this.navigateQuantum('+0')
                    },
                    {
                        label: 'Navigate -0 (Dependencies Left)',
                        accelerator: 'CmdOrCtrl+Left',
                        click: () => this.navigateQuantum('-0')
                    },
                    { type: 'separator' },
                    {
                        label: 'Show Quantum Position',
                        accelerator: 'CmdOrCtrl+P',
                        click: () => this.showQuantumPosition()
                    }
                ]
            },
            {
                label: 'Notes',
                submenu: [
                    {
                        label: 'New Note Cell',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('create-note-cell');
                        }
                    },
                    {
                        label: 'New AI Cell',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('create-ai-cell');
                        }
                    },
                    {
                        label: 'New Terminal Cell',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('create-terminal-cell');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Run All Cells',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('run-all-cells');
                        }
                    },
                    {
                        label: 'Save Notebook',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.send('save-notebook');
                        }
                    }
                ]
            },
            {
                label: 'Instances',
                submenu: [
                    {
                        label: 'New Notepad',
                        click: () => self.registry.createInstance('quantum-notepad.html')
                    },
                    {
                        label: 'New questcast',
                        click: () => self.registry.createInstance('questcast.html')
                    },
                    {
                        label: 'New archflow',
                        click: () => self.registry.createInstance('archflow.html')
                    },
                    {
                        label: 'New jawta audio',
                        click: () => self.registry.createInstance('jawta-audio.html')
                    },
                    {
                        label: 'New Blackwell Live',
                        click: () => self.registry.createInstance('blackwell.html')
                    },
                    {
                        label: 'New hexcast',
                        click: () => self.registry.createInstance('hexcast.html')
                    },
                    {
                        label: 'New kbatch',
                        click: () => self.registry.createInstance('kbatch.html')
                    },
                    {
                        label: 'New brotherNumsy',
                        click: () => self.registry.createInstance('brothernumsy.html')
                    },
                    {
                        label: 'New GitHub Dashboard',
                        click: () => self.registry.createInstance('github-dashboard.html')
                    },
                    { type: 'separator' },
                    {
                        label: 'List All Instances',
                        click: () => {
                            const instances = self.registry.list();
                            const detail = instances.map(i =>
                                `${i.focused ? '→ ' : '  '}${i.id}: ${i.page}`
                            ).join('\n');
                            dialog.showMessageBox({
                                type: 'info',
                                title: 'Active Instances',
                                message: `${instances.length} instance(s) running`,
                                detail: detail || '(none)'
                            });
                        }
                    },
                    {
                        label: 'Close All Instances',
                        click: () => self.registry.closeAll()
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Reload',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.reload();
                        }
                    },
                    {
                        label: 'Force Reload',
                        accelerator: 'CmdOrCtrl+Shift+R', 
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.reloadIgnoringCache();
                        }
                    },
                    {
                        label: 'Developer Tools',
                        accelerator: 'F12',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.webContents.openDevTools();
                        }
                    }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    {
                        label: 'Minimize',
                        accelerator: 'CmdOrCtrl+M',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.minimize();
                        }
                    },
                    {
                        label: 'Close',
                        accelerator: 'CmdOrCtrl+W',
                        click: () => {
                            const win = this.registry.getFocused();
                            if (win) win.close();
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupIPC() {
        // Handle quantum navigation from renderer
        ipcMain.handle('quantum-navigate', (event, direction, amount) => {
            return this.navigateQuantum(direction, amount);
        });

        // Handle terminal operations
        ipcMain.handle('create-terminal', (event, type) => {
            return this.createTerminalSession(type);
        });

        // Handle AI operations
        ipcMain.handle('ai-generate', (event, prompt, language) => {
            return this.generateWithAI(prompt, language);
        });

        // Handle file operations
        ipcMain.handle('convert-file', (event, filePath) => {
            return this.convertFileToQuantum(filePath);
        });

        // Handle system status
        ipcMain.handle('get-status', () => {
            return this.getSystemStatus();
        });

        // ── Instance IPC ──
        ipcMain.handle('instance-create', (event, page) => {
            const { id } = this.registry.createInstance(page);
            return { id, page };
        });

        ipcMain.handle('instance-list', () => {
            return this.registry.list();
        });

        ipcMain.handle('instance-message', (event, targetId, channel, data) => {
            if (targetId === '*') {
                this.registry.broadcastToAll(channel, data);
            } else {
                this.registry.sendTo(targetId, channel, data);
            }
            return { sent: true };
        });

        ipcMain.handle('instance-layout-save', () => {
            return this.registry.saveLayout();
        });

        ipcMain.handle('instance-layout-restore', (event, layout) => {
            this.registry.restoreLayout(layout);
            return { restored: true };
        });
    }

    navigateQuantum(direction, amount = 1) {
        switch(direction) {
            case '+1': this.quantumPosition[1] += amount; break;
            case '-1': this.quantumPosition[1] -= amount; break;
            case '+0': this.quantumPosition[0] += amount; break;
            case '-0': this.quantumPosition[0] -= amount; break;
            case '+n': this.quantumPosition[2] += amount; break;
            case '-n': this.quantumPosition[2] -= amount; break;
        }

        // Broadcast position change to all WS clients and all instances
        this.broadcastPositionChange();
        this.registry.broadcastToAll('quantum-position-changed', this.quantumPosition);

        console.log(`🌌 Quantum navigation: ${direction} → [${this.quantumPosition.join(', ')}]`);
        return this.quantumPosition;
    }

    resetQuantumPosition() {
        this.quantumPosition = [0, 0, 0];
        this.broadcastPositionChange();
        this.registry.broadcastToAll('quantum-position-changed', this.quantumPosition);
    }

    broadcastPositionChange() {
        if (wsServer) {
            wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'position-changed',
                        position: this.quantumPosition
                    }));
                }
            });
        }
    }

    showWelcomeMessage(win) {
        if (win && !win.isDestroyed()) {
            win.webContents.send('show-welcome', {
                title: 'Welcome to UVspeed Notes',
                message: 'Your quantum development environment is ready!',
                position: this.quantumPosition,
                instances: this.registry.list().length
            });
        }
    }

    showAbout() {
        const win = this.registry.getFocused();
        dialog.showMessageBox(win || undefined, {
            type: 'info',
            title: 'About UVspeed',
            message: 'UVspeed Notes',
            detail: `Version: ${app.getVersion()}\n\nQubesOS-style multi-instance architecture with quantum notebooks, AI integration, and 3D code navigation.\n\nInstances: ${this.registry.list().length}\nArchitecture: Zig → Rust → Semantic → Visual\nQuantum Position: [${this.quantumPosition.join(', ')}]`
        });
    }

    showPreferences() {
        const win = this.registry.getFocused();
        if (win) win.webContents.send('show-preferences');
    }

    showQuantumPosition() {
        const win = this.registry.getFocused();
        dialog.showMessageBox(win || undefined, {
            type: 'info',
            title: 'Quantum Position',
            message: `Current Position: [${this.quantumPosition.join(', ')}]`,
            detail: `X=${this.quantumPosition[0]} (Dependencies)\nY=${this.quantumPosition[1]} (Lines)\nZ=${this.quantumPosition[2]} (Complexity)`
        });
    }

    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'quantum-navigate':
                this.navigateQuantum(message.direction, message.amount);
                break;
            case 'get-status':
                ws.send(JSON.stringify({
                    type: 'status',
                    data: this.getSystemStatus()
                }));
                break;
            case 'instance-create':
                if (message.page) {
                    const { id } = this.registry.createInstance(message.page);
                    ws.send(JSON.stringify({ type: 'instance-created', id, page: message.page }));
                }
                break;
            case 'instance-list':
                ws.send(JSON.stringify({ type: 'instance-list', instances: this.registry.list() }));
                break;
            case 'instance-message':
                if (message.targetId === '*') {
                    this.registry.broadcastToAll(message.channel || 'instance-message', message.data);
                } else if (message.targetId) {
                    this.registry.sendTo(message.targetId, message.channel || 'instance-message', message.data);
                }
                break;
        }
    }

    getSystemStatus() {
        return {
            position: this.quantumPosition,
            terminals: this.activeTerminals.size,
            instances: this.registry.list(),
            ai: this.aiServices,
            server: `http://localhost:${PORT}`,
            version: app.getVersion(),
            platform: process.platform,
            arch: process.arch
        };
    }

    cleanup() {
        if (terminalServer) {
            terminalServer.close();
        }
        if (wsServer) {
            wsServer.close();
        }
        this.activeTerminals.forEach(terminal => {
            if (terminal.kill) terminal.kill();
        });
    }
}

// App event handlers
app.whenReady().then(async () => {
    const uvspeedApp = new UVspeedApp();
    await uvspeedApp.initialize();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const uvspeedApp = new UVspeedApp();
        await uvspeedApp.initialize();
    }
});

// Security
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
});

console.log(`🚀 UVspeed v${app.getVersion()} starting...`);