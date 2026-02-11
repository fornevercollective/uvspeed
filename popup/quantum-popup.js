// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Quantum Fox Extension Popup Controller
// Handles launching quantum development environments

document.addEventListener('DOMContentLoaded', function() {
    // Version selection handling
    const versionButtons = document.querySelectorAll('.version-btn');
    let currentVersion = 'v1';
    
    versionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            versionButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentVersion = this.dataset.version;
            updateLaunchCommands();
        });
    });
    
    // Launch button handlers
    document.getElementById('launch-terminal').addEventListener('click', function() {
        launchQuantumTerminal();
    });
    
    document.getElementById('launch-web').addEventListener('click', function() {
        launchWebInterface();
    });
    
    document.getElementById('launch-viewer').addEventListener('click', function() {
        launch3DViewer();
    });
    
    document.getElementById('launch-chat').addEventListener('click', function() {
        launchAIChat();
    });
    
    document.getElementById('launch-converter').addEventListener('click', function() {
        launchConverter();
    });
    
    document.getElementById('launch-status').addEventListener('click', function() {
        launchStatus();
    });
    
    // Check system status on load
    checkSystemStatus();
    
    function updateLaunchCommands() {
        // Update button states based on selected version
        const buttons = document.querySelectorAll('.launch-btn');
        buttons.forEach(btn => {
            btn.classList.remove('version-v1', 'version-v2', 'version-v3');
            btn.classList.add(`version-${currentVersion}`);
        });
    }
    
    function launchQuantumTerminal() {
        const commands = {
            'v1': 'cd /Users/tref/quantum-fox && python3 quantum_prototype.py',
            'v2': 'cd /Users/tref/quantum-fox && ./launch-progressive.sh v2 quantum',
            'v3': 'cd /Users/tref/quantum-fox && ./launch-progressive.sh v3'
        };
        
        executeTerminalCommand(commands[currentVersion]);
        showNotification('🌌 Quantum Terminal Launching...');
    }
    
    function launchWebInterface() {
        const webPages = {
            'v1': '/Users/tref/quantum-claude-terminal.html',
            'v2': '/Users/tref/enhanced-p2p-terminal.html', 
            'v3': '/Users/tref/quantum-fox/web/quantum-claude-terminal.html'
        };
        
        chrome.tabs.create({ url: `file://${webPages[currentVersion]}` });
        showNotification('🌐 Web Interface Opening...');
    }
    
    function launch3DViewer() {
        executeTerminalCommand('cd /Users/tref/quantum-fox/quantum && python3 quantum_code_space.py');
        showNotification('🔍 3D Code Viewer Starting...');
    }
    
    function launchAIChat() {
        executeTerminalCommand('cd /Users/tref/quantum-fox/quantum && python3 opencode_quantum_terminal_clean.py');
        showNotification('💬 AI Chat Terminal Loading...');
    }
    
    function launchConverter() {
        executeTerminalCommand('cd /Users/tref/quantum-fox && python3 quantum_prototype.py');
        showNotification('🔄 Code Converter Ready...');
    }
    
    function launchStatus() {
        executeTerminalCommand('cd /Users/tref/quantum-fox/quantum && python3 quantum_status_clean.py');
        showNotification('⚙️ System Status Checking...');
    }
    
    function executeTerminalCommand(command) {
        // For Firefox extension, we'll open a new tab with instructions
        const instructionPage = createInstructionPage(command);
        chrome.tabs.create({ url: instructionPage });
    }
    
    function createInstructionPage(command) {
        const html = `
            data:text/html,
            <html>
            <head><title>Quantum Fox - Terminal Command</title></head>
            <body style="font-family: monospace; background: #1a1a2e; color: white; padding: 20px;">
                <h2>🌌 Quantum Fox Terminal Command</h2>
                <p>Copy and paste this command into your terminal:</p>
                <div style="background: #0f3460; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <code style="user-select: all;">${command}</code>
                </div>
                <p>Or use the Quantum Fox launcher:</p>
                <div style="background: #0f3460; padding: 15px; border-radius: 5px;">
                    <code>cd /Users/tref/quantum-fox && ./launch-complete.sh</code>
                </div>
                <script>
                    // Auto-copy to clipboard
                    navigator.clipboard.writeText('${command}').then(() => {
                        document.body.innerHTML += '<p style="color: #4caf50;">✅ Command copied to clipboard!</p>';
                    });
                </script>
            </body>
            </html>
        `;
        return html.replace(/\n\s+/g, '');
    }
    
    function checkSystemStatus() {
        // Simulate status checks (in real extension, these would be actual checks)
        setTimeout(() => {
            document.getElementById('python-status').className = 'status-indicator indicator-online';
            document.getElementById('uv-status').className = 'status-indicator indicator-online';
            document.getElementById('ai-status').className = 'status-indicator indicator-pending';
        }, 1000);
    }
    
    function showNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(100, 181, 246, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 1000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    // Initialize
    updateLaunchCommands();
});