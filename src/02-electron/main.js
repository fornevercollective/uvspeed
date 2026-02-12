// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// UVspeed - Advanced Notes & Terminal Environment
// Desktop app with quantum navigation and infinite notebooks
// v3.0.0 — restructured from src/02-electron/

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const WebSocket = require('ws');

let mainWindow;
let terminalServer;
let wsServer;

// App configuration
const isDev = process.argv.includes('--dev');
const APP_NAME = 'UVspeed';
const PORT = 3847; // UFFO in phone keypad

// Project root is two levels up from src/02-electron/
const PROJECT_ROOT = path.join(__dirname, '..', '..');

class UVspeedApp {
    constructor() {
        this.quantumPosition = [0, 0, 0];
        this.activeTerminals = new Map();
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
        mainWindow = new BrowserWindow({
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
            backgroundColor: '#1a1a2e',
            show: false
        });

        // Load the quantum terminal interface
        if (isDev) {
            mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
            mainWindow.webContents.openDevTools();
        } else {
            mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
        }

        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
            
            // Show welcome notification
            this.showWelcomeMessage();
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
            this.cleanup();
        });

        // Handle external links
        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    setupMenus() {
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
                    {
                        label: 'Undo',
                        accelerator: 'CmdOrCtrl+Z',
                        selector: 'undo:'
                    },
                    {
                        label: 'Redo',
                        accelerator: 'Shift+CmdOrCtrl+Z',
                        selector: 'redo:'
                    },
                    { type: 'separator' },
                    {
                        label: 'Cut',
                        accelerator: 'CmdOrCtrl+X',
                        selector: 'cut:'
                    },
                    {
                        label: 'Copy',
                        accelerator: 'CmdOrCtrl+C',
                        selector: 'copy:'
                    },
                    {
                        label: 'Paste',
                        accelerator: 'CmdOrCtrl+V',
                        selector: 'paste:'
                    },
                    {
                        label: 'Select All',
                        accelerator: 'CmdOrCtrl+A',
                        selector: 'selectAll:'
                    },
                    { type: 'separator' },
                    {
                        label: 'Find',
                        accelerator: 'CmdOrCtrl+F',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('show-find');
                            }
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
                            if (mainWindow) {
                                mainWindow.webContents.send('create-note-cell');
                            }
                        }
                    },
                    {
                        label: 'New AI Cell',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('create-ai-cell');
                            }
                        }
                    },
                    {
                        label: 'New Terminal Cell',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('create-terminal-cell');
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Run All Cells',
                        accelerator: 'CmdOrCtrl+Shift+R',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('run-all-cells');
                            }
                        }
                    },
                    {
                        label: 'Clear All Outputs',
                        accelerator: 'CmdOrCtrl+Shift+C',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('clear-all-outputs');
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Save Notebook',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('save-notebook');
                            }
                        }
                    },
                    {
                        label: 'Export Notebook',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.send('export-notebook');
                            }
                        }
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Quantum Notepad',
                        click: () => this.openQuantumNotepad()
                    },
                    {
                        label: 'brotherNumsy Game',
                        click: () => this.openBrotherNumsy()
                    },
                    {
                        label: 'kbatch Keyboard Analyzer',
                        click: () => this.openKbatch()
                    },
                    {
                        label: 'hexcast Video Broadcast',
                        click: () => this.openHexcast()
                    },
                    { type: 'separator' },
                    {
                        label: 'Legacy Terminal',
                        click: () => this.openLegacyTerminal()
                    },
                    { type: 'separator' },
                    {
                        label: 'Reload',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => mainWindow.reload()
                    },
                    {
                        label: 'Force Reload',
                        accelerator: 'CmdOrCtrl+Shift+R', 
                        click: () => mainWindow.webContents.reloadIgnoringCache()
                    },
                    {
                        label: 'Developer Tools',
                        accelerator: 'F12',
                        click: () => mainWindow.webContents.openDevTools()
                    }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    {
                        label: 'Minimize',
                        accelerator: 'CmdOrCtrl+M',
                        click: () => mainWindow.minimize()
                    },
                    {
                        label: 'Close',
                        accelerator: 'CmdOrCtrl+W',
                        click: () => mainWindow.close()
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
    }

    navigateQuantum(direction, amount = 1) {
        const oldPosition = [...this.quantumPosition];
        
        switch(direction) {
            case '+1': this.quantumPosition[1] += amount; break;
            case '-1': this.quantumPosition[1] -= amount; break;
            case '+0': this.quantumPosition[0] += amount; break;
            case '-0': this.quantumPosition[0] -= amount; break;
            case '+n': this.quantumPosition[2] += amount; break;
            case '-n': this.quantumPosition[2] -= amount; break;
        }

        // Broadcast position change to all clients
        this.broadcastPositionChange();
        
        // Send to main window
        if (mainWindow) {
            mainWindow.webContents.send('quantum-position-changed', this.quantumPosition);
        }

        console.log(`🌌 Quantum navigation: ${direction} → [${this.quantumPosition.join(', ')}]`);
        return this.quantumPosition;
    }

    resetQuantumPosition() {
        this.quantumPosition = [0, 0, 0];
        this.broadcastPositionChange();
        if (mainWindow) {
            mainWindow.webContents.send('quantum-position-changed', this.quantumPosition);
        }
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

    createNewTerminal() {
        if (mainWindow) {
            mainWindow.webContents.send('create-terminal', 'quantum');
        }
    }

    createAITerminal() {
        if (mainWindow) {
            mainWindow.webContents.send('create-terminal', 'ai');
        }
    }

    launchProgressive(version) {
        const script = path.join(PROJECT_ROOT, 'src', '03-tools', 'launch-progressive.sh');
        const terminal = spawn('bash', [script, version], {
            cwd: path.dirname(script),
            stdio: 'inherit'
        });
        
        terminal.on('error', (error) => {
            console.error(`Failed to launch progressive ${version}:`, error);
            dialog.showErrorBox('Launch Error', `Failed to launch progressive ${version}: ${error.message}`);
        });
    }

    openQuantumNotepad() {
        const url = `http://localhost:${PORT}/web/quantum-notepad.html`;
        shell.openExternal(url);
    }

    openBrotherNumsy() {
        const url = `http://localhost:${PORT}/web/brothernumsy.html`;
        shell.openExternal(url);
    }

    openKbatch() {
        const url = `http://localhost:${PORT}/web/kbatch.html`;
        shell.openExternal(url);
    }

    openHexcast() {
        const url = `http://localhost:${PORT}/web/hexcast.html`;
        shell.openExternal(url);
    }

    openLegacyTerminal() {
        const url = `http://localhost:${PORT}/web/legacy/quantum-claude-terminal.html`;
        shell.openExternal(url);
    }

    showWelcomeMessage() {
        if (mainWindow) {
            mainWindow.webContents.send('show-welcome', {
                title: 'Welcome to UVspeed Notes',
                message: 'Your quantum development environment is ready!',
                position: this.quantumPosition
            });
        }
    }

    showAbout() {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About UVspeed',
            message: 'UVspeed Notes',
            detail: `Version: ${app.getVersion()}\n\nAdvanced notes and terminal environment with infinite quantum notebooks, AI integration, and 3D code navigation.\n\nArchitecture: Zig → Rust → Semantic → Visual\nQuantum Position: [${this.quantumPosition.join(', ')}]`
        });
    }

    showPreferences() {
        // TODO: Implement preferences window
        if (mainWindow) {
            mainWindow.webContents.send('show-preferences');
        }
    }

    showQuantumPosition() {
        dialog.showMessageBox(mainWindow, {
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
        }
    }

    getSystemStatus() {
        return {
            position: this.quantumPosition,
            terminals: this.activeTerminals.size,
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
        // Kill any active terminals
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