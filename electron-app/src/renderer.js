// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// UV-Speed Quantum Terminal - Renderer Process
// Handles UI interactions and quantum navigation

class QuantumTerminalUI {
    constructor() {
        this.currentPosition = [0, 0, 0];
        this.activeTerminals = new Map();
        this.currentVersion = 'v2';
        this.wsConnection = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupWebSocket();
        await this.updateStatus();
        this.showWelcome();
    }

    setupEventListeners() {
        // Quantum navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.navigateQuantum(direction);
            });
        });

        // Version selection
        document.querySelectorAll('.version-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.version-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentVersion = btn.dataset.version;
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleAction(btn.dataset.action);
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleAction(btn.dataset.action);
            });
        });

        // New tab button
        document.getElementById('new-tab').addEventListener('click', () => {
            this.createNewTerminal();
        });

        // Listen for electron events
        if (window.quantumAPI) {
            window.quantumAPI.onPositionChanged((position) => {
                this.updatePosition(position);
            });

            window.quantumAPI.onTerminalCreate((type) => {
                this.createTerminalTab(type);
            });

            window.quantumAPI.onWelcomeMessage((data) => {
                this.showWelcomeMessage(data);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    setupWebSocket() {
        // Connect to the quantum server WebSocket
        try {
            this.wsConnection = new WebSocket('ws://localhost:3848');
            
            this.wsConnection.onopen = () => {
                console.log('🌌 Connected to Quantum Server');
                this.updateServerStatus('Connected');
            };

            this.wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.wsConnection.onclose = () => {
                console.log('📡 Disconnected from Quantum Server');
                this.updateServerStatus('Disconnected');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupWebSocket(), 5000);
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateServerStatus('Error');
            };
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.updateServerStatus('Failed');
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'init':
                this.updatePosition(data.position);
                this.updateAIStatus(data.ai);
                break;
            case 'position-changed':
                this.updatePosition(data.position);
                break;
            case 'status':
                this.updateSystemStatus(data.data);
                break;
        }
    }

    async navigateQuantum(direction, amount = 1) {
        // Animate button
        const btn = document.querySelector(`[data-direction="${direction}"]`);
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }

        // Send navigation command
        if (window.quantumAPI) {
            try {
                const newPosition = await window.quantumAPI.navigate(direction, amount);
                this.updatePosition(newPosition);
                this.showNavigationFeedback(direction);
            } catch (error) {
                console.error('Navigation error:', error);
            }
        }
    }

    updatePosition(position) {
        this.currentPosition = position;
        
        // Update position displays
        const positionText = `[${position.join(', ')}]`;
        document.getElementById('quantum-position').textContent = positionText;
        document.getElementById('status-position').textContent = positionText;
        
        // Add pulse animation
        const posElement = document.getElementById('quantum-position');
        posElement.classList.add('active');
        setTimeout(() => {
            posElement.classList.remove('active');
        }, 2000);
    }

    showNavigationFeedback(direction) {
        const directionMap = {
            '+1': '↑ Lines Up',
            '-1': '↓ Lines Down',
            '+0': '→ Dependencies Right',
            '-0': '← Dependencies Left',
            '+n': '↗ Complexity Forward',
            '-n': '↙ Complexity Back'
        };

        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(100, 181, 246, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 10000;
            font-family: monospace;
            font-size: 16px;
            pointer-events: none;
            animation: feedbackAnimation 1s ease-out forwards;
        `;

        // Add CSS animation
        if (!document.getElementById('feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'feedback-styles';
            style.textContent = `
                @keyframes feedbackAnimation {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        feedback.textContent = `🌌 ${directionMap[direction]}`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    handleAction(action) {
        switch (action) {
            case 'new-terminal':
                this.createNewTerminal();
                break;
            case 'ai-terminal':
                this.createAITerminal();
                break;
            case 'web-interface':
                this.openWebInterface();
                break;
            case 'code-viewer':
                this.open3DViewer();
                break;
            case 'launch-v1':
                this.launchVersion('v1');
                break;
            case 'launch-v2':
                this.launchVersion('v2');
                break;
            case 'launch-v3':
                this.launchVersion('v3');
                break;
            case 'prototype':
                this.launchPrototype();
                break;
        }
    }

    createNewTerminal() {
        if (window.quantumAPI) {
            window.quantumAPI.createTerminal('quantum');
        }
        this.createTerminalTab('quantum');
    }

    createAITerminal() {
        if (window.quantumAPI) {
            window.quantumAPI.createTerminal('ai');
        }
        this.createTerminalTab('ai');
    }

    createTerminalTab(type) {
        const tabsContainer = document.querySelector('.terminal-tabs');
        const newTabBtn = document.getElementById('new-tab');
        
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.textContent = type === 'ai' ? '🤖 AI Terminal' : '🌌 Quantum Terminal';
        tab.dataset.tab = type;
        
        // Remove active from other tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Insert before new tab button
        tabsContainer.insertBefore(tab, newTabBtn);
        
        // Create terminal content
        this.createTerminalContent(type);
        
        // Update terminal count
        this.activeTerminals.set(type + Date.now(), { type, element: tab });
        document.getElementById('status-terminals').textContent = this.activeTerminals.size;
    }

    createTerminalContent(type) {
        const terminalContent = document.getElementById('terminal-content');
        terminalContent.innerHTML = `
            <div style="padding: 20px; font-family: monospace;">
                <div style="color: #64b5f6; margin-bottom: 15px;">
                    ${type === 'ai' ? '🤖 AI Terminal' : '🌌 Quantum Terminal'} - Ready
                </div>
                <div style="margin-bottom: 10px;">
                    Position: [${this.currentPosition.join(', ')}]
                </div>
                <div style="color: #81c784;">
                    Type commands or use quantum navigation...
                </div>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                    <div style="color: #ffb74d; margin-bottom: 8px;">Available Commands:</div>
                    <div style="font-size: 12px; line-height: 1.4;">
                        • +1/-1/+0/-0/+n/-n - Quantum navigation<br>
                        • gen python &lt;prompt&gt; - Generate code<br>
                        • convert &lt;file&gt; - Add quantum numbering<br>
                        • status - System status<br>
                        • help - Show all commands
                    </div>
                </div>
            </div>
        `;
        
        // Hide welcome screen
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }

    openWebInterface() {
        // Open quantum web interface in external browser
        const url = 'http://localhost:3847/web/quantum-claude-terminal.html';
        if (window.electronAPI) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    }

    open3DViewer() {
        // Launch 3D code viewer
        if (window.quantumAPI) {
            // This would trigger the 3D viewer through the main process
            console.log('Launching 3D Code Viewer...');
        }
    }

    launchVersion(version) {
        // Update version selection
        document.querySelectorAll('.version-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.version === version) {
                btn.classList.add('active');
            }
        });
        this.currentVersion = version;
        
        // Show launch feedback
        this.showLaunchFeedback(version);
    }

    launchPrototype() {
        // Launch standalone prototype
        this.showLaunchFeedback('prototype');
    }

    showLaunchFeedback(type) {
        const messages = {
            'v1': '🟢 Launching v1-core (Basic UV + Quantum)',
            'v2': '🔵 Launching v2-terminal (+ AI Integration)',
            'v3': '🟣 Launching v3-complete (+ Full Copilot)',
            'prototype': '🛠️ Launching Standalone Prototype'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, rgba(100, 181, 246, 0.9), rgba(129, 199, 132, 0.9));
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: monospace;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.5s ease-out;
        `;

        if (!document.getElementById('launch-styles')) {
            const style = document.createElement('style');
            style.id = 'launch-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        notification.textContent = messages[type];
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    handleKeyboard(e) {
        // Quantum navigation shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateQuantum('+1');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateQuantum('-1');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateQuantum('+0');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateQuantum('-0');
                    break;
            }
        }
    }

    async updateStatus() {
        if (window.quantumAPI) {
            try {
                const status = await window.quantumAPI.getStatus();
                this.updateSystemStatus(status);
            } catch (error) {
                console.error('Failed to get status:', error);
            }
        }
    }

    updateSystemStatus(status) {
        if (status.position) {
            this.updatePosition(status.position);
        }
        
        if (status.terminals !== undefined) {
            document.getElementById('status-terminals').textContent = status.terminals;
        }
        
        if (status.server) {
            this.updateServerStatus(status.server);
        }
        
        if (status.ai) {
            this.updateAIStatus(status.ai);
        }
    }

    updateServerStatus(status) {
        document.getElementById('status-server').textContent = 
            typeof status === 'string' ? status : status.replace('http://localhost:', 'Port ');
    }

    updateAIStatus(aiServices) {
        if (aiServices.opencode !== undefined) {
            const indicator = document.getElementById('ai-opencode');
            indicator.className = `status-indicator ${aiServices.opencode ? '' : 'offline'}`;
        }
        
        if (aiServices.copilot !== undefined) {
            const indicator = document.getElementById('ai-copilot');
            indicator.className = `status-indicator ${aiServices.copilot ? '' : 'offline'}`;
        }
        
        if (aiServices.quantum !== undefined) {
            const indicator = document.getElementById('ai-quantum');
            indicator.className = `status-indicator ${aiServices.quantum ? '' : 'offline'}`;
        }
    }

    showWelcome() {
        console.log('🌌 UV-Speed Quantum Terminal UI initialized');
        
        // Auto-update status every 10 seconds
        setInterval(() => {
            this.updateStatus();
        }, 10000);
    }

    showWelcomeMessage(data) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 52, 96, 0.95));
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            border: 1px solid rgba(100, 181, 246, 0.5);
            backdrop-filter: blur(10px);
            max-width: 400px;
        `;

        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">${data.title}</div>
            <div style="margin-bottom: 10px;">${data.message}</div>
            <div style="font-size: 12px; color: #64b5f6;">Position: [${data.position.join(', ')}]</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuantumTerminalUI();
});

console.log('🌌 UV-Speed Quantum Terminal renderer loaded');