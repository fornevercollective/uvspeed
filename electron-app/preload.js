// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// UV-Speed Quantum Terminal - Preload Script
// Secure communication bridge between main and renderer processes

const { contextBridge, ipcRenderer } = require('electron');

// Expose quantum API to renderer process
contextBridge.exposeInMainWorld('quantumAPI', {
    // Quantum navigation
    navigate: (direction, amount) => ipcRenderer.invoke('quantum-navigate', direction, amount),
    
    // Terminal operations
    createTerminal: (type) => ipcRenderer.invoke('create-terminal', type),
    
    // AI operations
    generateCode: (prompt, language) => ipcRenderer.invoke('ai-generate', prompt, language),
    
    // File operations
    convertFile: (filePath) => ipcRenderer.invoke('convert-file', filePath),
    
    // System status
    getStatus: () => ipcRenderer.invoke('get-status'),
    
    // Event listeners
    onPositionChanged: (callback) => {
        ipcRenderer.on('quantum-position-changed', (event, position) => callback(position));
    },
    
    onTerminalCreate: (callback) => {
        ipcRenderer.on('create-terminal', (event, type) => callback(type));
    },
    
    onWelcomeMessage: (callback) => {
        ipcRenderer.on('show-welcome', (event, data) => callback(data));
    },
    
    onShowPreferences: (callback) => {
        ipcRenderer.on('show-preferences', () => callback());
    },
    
    // Remove listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Expose version info
contextBridge.exposeInMainWorld('appInfo', {
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform,
    arch: process.arch
});

console.log('🌌 Quantum preload script loaded');