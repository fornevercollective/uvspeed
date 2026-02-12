// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
/**
 * Enhanced P2P Claude Terminal
 * Integrated P2P networking with productivity sync and AI assistance
 */

class EnhancedP2PTerminal {
    constructor() {
        this.mode = 'p2p'; // 'p2p', 'classical', 'quantum'
        this.selectedModel = 'claude-3.5-sonnet';
        this.networkConfig = {
            peerId: this.generatePeerId(),
            networkActive: false,
            peers: new Map(),
            transfers: new Map(),
            syncEnabled: true
        };
        
        this.productivitySync = {
            enabled: true,
            lastSync: Date.now(),
            syncedData: {
                tasks: 24,
                projects: 3,
                artifacts: 12
            }
        };
        
        this.commandHistory = [];
        this.historyIndex = -1;
        this.isP2PActive = false;
        
        // Usage tracking
        this.usage = {
            p2pBandwidth: 45,
            aiTokens: 65,
            syncStorage: 30
        };
        
        // Initialize components
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeP2PComponents();
        this.initializeResponsiveHandlers();
        this.updateInterface();
        this.startP2PSimulation();
    }
    
    generatePeerId() {
        return 'peer_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeElements() {
        // Core elements
        this.commandInput = document.getElementById('command-input');
        this.sendBtn = document.getElementById('send-btn');
        this.modeIcon = document.getElementById('mode-icon');
        this.modeText = document.getElementById('mode-text');
        
        // P2P controls
        this.networkControls = {
            startNetwork: document.getElementById('start-network'),
            joinNetwork: document.getElementById('join-network'),
            shareConnection: document.getElementById('share-connection'),
            discoverPeers: document.getElementById('discover-peers')
        };
        
        // Productivity sync controls
        this.syncControls = {
            syncTasks: document.getElementById('sync-tasks'),
            syncArtifacts: document.getElementById('sync-artifacts'),
            syncProjects: document.getElementById('sync-projects'),
            syncAll: document.getElementById('sync-all')
        };
        
        // Status elements
        this.statusElements = {
            networkStatus: document.getElementById('network-status'),
            networkStatusText: document.getElementById('network-status-text'),
            networkStatusIndicator: document.getElementById('network-status-indicator'),
            peerCount: document.getElementById('peer-count'),
            productivityStatus: document.getElementById('productivity-status'),
            productivityIndicator: document.getElementById('productivity-indicator')
        };
        
        // Content areas
        this.peerList = document.getElementById('peer-list');
        this.activityContent = document.getElementById('activity-content');
        this.transferList = document.getElementById('transfer-list');
        
        // File drop zone
        this.fileDropZone = document.getElementById('file-drop-zone');
        
        // Modals
        this.connectionModal = document.getElementById('connection-modal');
        this.shareModal = document.getElementById('share-modal');
        
        // Network visualization
        this.networkVisualization = document.getElementById('network-visualization');
    }
    
    initializeEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });
        
        // Model selection
        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectModel(btn.dataset.model));
        });
        
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });
        
        // P2P network controls
        Object.keys(this.networkControls).forEach(key => {
            const btn = this.networkControls[key];
            if (btn) {
                btn.addEventListener('click', () => this.executeNetworkAction(key));
            }
        });
        
        // Productivity sync controls
        Object.keys(this.syncControls).forEach(key => {
            const btn = this.syncControls[key];
            if (btn) {
                btn.addEventListener('click', () => this.executeSyncAction(key));
            }
        });
        
        // Command input
        this.sendBtn.addEventListener('click', () => this.handleCommand());
        this.commandInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // File drop zone
        if (this.fileDropZone) {
            this.fileDropZone.addEventListener('click', () => this.selectFile());
            this.fileDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.fileDropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        }
        
        // Quick actions
        document.getElementById('quick-screenshot')?.addEventListener('click', () => this.takeScreenshot());
        document.getElementById('quick-clipboard')?.addEventListener('click', () => this.shareClipboard());
        document.getElementById('quick-voice')?.addEventListener('click', () => this.recordVoiceNote());
        
        // Network visualization controls
        document.getElementById('network-graph')?.addEventListener('click', () => this.showNetworkGraph());
        document.getElementById('network-list')?.addEventListener('click', () => this.showNetworkList());
        document.getElementById('network-metrics')?.addEventListener('click', () => this.showNetworkMetrics());
        
        // Input actions
        document.getElementById('voice-input')?.addEventListener('click', () => this.activateVoiceInput());
        document.getElementById('file-share')?.addEventListener('click', () => this.openFileShare());
        document.getElementById('quick-sync')?.addEventListener('click', () => this.quickSync());
        
        // Modal controls
        document.getElementById('close-connection-modal')?.addEventListener('click', () => this.closeConnectionModal());
        document.getElementById('close-share-modal')?.addEventListener('click', () => this.closeShareModal());
        document.getElementById('connect-by-id')?.addEventListener('click', () => this.connectById());
        document.getElementById('start-camera')?.addEventListener('click', () => this.startQRScanner());
        document.getElementById('copy-id')?.addEventListener('click', () => this.copyPeerId());
        
        // Column toggles
        document.querySelectorAll('.column-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggleColumn(btn.id));
        });
    }
    
    initializeP2PComponents() {
        // Initialize P2P network simulation
        this.initializeNetworkSimulation();
        
        // Initialize productivity sync
        this.initializeProductivitySync();
        
        // Initialize transfer management
        this.initializeTransferManager();
        
        // Initialize network visualization
        this.initializeNetworkVisualization();
    }
    
    initializeNetworkSimulation() {
        // Simulate default productivity peers
        this.addPeer({
            id: 'desktop_app',
            name: 'Desktop App',
            type: 'MacBook Pro',
            status: 'connected',
            productivity: true,
            lastSeen: Date.now()
        });
        
        this.addPeer({
            id: 'mobile_app',
            name: 'Mobile App',
            type: 'iPhone 15',
            status: 'connected',
            productivity: true,
            lastSeen: Date.now()
        });
        
        this.updatePeerDisplay();
    }
    
    initializeProductivitySync() {
        // Start productivity sync loop
        setInterval(() => {
            if (this.productivitySync.enabled) {
                this.performProductivitySync();
            }
        }, 30000); // Sync every 30 seconds
        
        // Update sync status
        this.updateProductivityStatus();
    }
    
    initializeTransferManager() {
        // Add sample transfers
        this.addTransfer({
            id: 'transfer_1',
            name: 'tasks.json',
            peer: 'Desktop App',
            size: '2.3 KB',
            progress: 100,
            status: 'completed'
        });
        
        this.addTransfer({
            id: 'transfer_2',
            name: 'presentation.pptx',
            peer: 'Mobile App',
            size: '15.7 MB',
            progress: 67,
            status: 'sending'
        });
        
        this.updateTransferDisplay();
    }
    
    initializeNetworkVisualization() {
        // Create network topology visualization
        this.updateNetworkVisualization();
    }
    
    switchMode(mode) {
        this.mode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update body class
        document.body.className = `${mode}-mode`;
        
        // Update interface
        this.updateInterface();
        
        // Update mode indicator
        const modeConfig = {
            'p2p': { icon: '🔗', text: 'P2P Mode', placeholder: 'Enter P2P command, sync message, or AI query...' },
            'classical': { icon: '🤖', text: 'Classical Mode', placeholder: 'Enter command or question...' },
            'quantum': { icon: '⚛️', text: 'Quantum Mode', placeholder: 'Enter quantum command...' }
        };
        
        const config = modeConfig[mode];
        if (config) {
            this.modeIcon.textContent = config.icon;
            this.modeText.textContent = config.text;
            this.commandInput.placeholder = config.placeholder;
        }
        
        this.addActivity(`Switched to ${mode} mode`);
    }
    
    selectModel(model) {
        this.selectedModel = model;
        
        // Update model buttons
        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.model === model);
        });
        
        this.addActivity(`Selected AI model: ${model}`);
    }
    
    selectTool(tool) {
        this.addActivity(`Activated tool: ${tool}`);
        
        // Simulate tool activation
        setTimeout(() => {
            this.addActivity(`Tool ${tool} ready`);
        }, 1000);
    }
    
    executeNetworkAction(action) {
        this.addActivity(`Executing network action: ${action}`);
        
        switch (action) {
            case 'startNetwork':
                this.startP2PNetwork();
                break;
            case 'joinNetwork':
                this.openConnectionModal();
                break;
            case 'shareConnection':
                this.openShareModal();
                break;
            case 'discoverPeers':
                this.discoverPeers();
                break;
        }
    }
    
    executeSyncAction(action) {
        this.addActivity(`Executing sync action: ${action}`);
        
        // Update sync button states
        document.querySelectorAll('.sync-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btn = document.getElementById(action.replace('sync', 'sync-').toLowerCase());
        if (btn) {
            btn.classList.add('active');
        }
        
        switch (action) {
            case 'syncTasks':
                this.syncTasks();
                break;
            case 'syncArtifacts':
                this.syncArtifacts();
                break;
            case 'syncProjects':
                this.syncProjects();
                break;
            case 'syncAll':
                this.syncAll();
                break;
        }
    }
    
    startP2PNetwork() {
        this.networkConfig.networkActive = true;
        this.isP2PActive = true;
        
        // Update network status
        this.updateNetworkStatus('connected', 'Network Active');
        
        // Simulate network startup
        setTimeout(() => {
            this.addActivity('P2P network started successfully');
            this.updateUsage('p2pBandwidth', 5);
        }, 2000);
    }
    
    openConnectionModal() {
        this.connectionModal.style.display = 'block';
        document.getElementById('peer-id-input').value = '';
    }
    
    closeConnectionModal() {
        this.connectionModal.style.display = 'none';
    }
    
    openShareModal() {
        this.shareModal.style.display = 'block';
        document.getElementById('my-peer-id').value = this.networkConfig.peerId;
        this.generateQRCode();
    }
    
    closeShareModal() {
        this.shareModal.style.display = 'none';
    }
    
    connectById() {
        const peerId = document.getElementById('peer-id-input').value.trim();
        if (peerId) {
            this.addActivity(`Connecting to peer: ${peerId}`);
            
            // Simulate connection
            setTimeout(() => {
                this.addPeer({
                    id: peerId,
                    name: 'External Peer',
                    type: 'Unknown Device',
                    status: 'connected',
                    productivity: false,
                    lastSeen: Date.now()
                });
                
                this.addActivity(`Connected to peer: ${peerId}`);
                this.closeConnectionModal();
                this.updatePeerDisplay();
            }, 3000);
        }
    }
    
    generateQRCode() {
        const canvas = document.getElementById('qr-canvas');
        if (canvas && window.QRCode) {
            QRCode.toCanvas(canvas, this.networkConfig.peerId, (error) => {
                if (error) {
                    console.error('QR code generation failed:', error);
                }
            });
        }
    }
    
    copyPeerId() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.networkConfig.peerId);
            this.addActivity('Peer ID copied to clipboard');
        }
    }
    
    discoverPeers() {
        this.addActivity('Discovering peers...');
        
        // Simulate peer discovery
        setTimeout(() => {
            const discoveredPeers = [
                { name: 'Laptop-John', type: 'Windows 11', distance: '2.1m' },
                { name: 'Phone-Sarah', type: 'Android 14', distance: '5.3m' },
                { name: 'Tablet-Mike', type: 'iPad Pro', distance: '8.7m' }
            ];
            
            discoveredPeers.forEach(peer => {
                this.addActivity(`Found peer: ${peer.name} (${peer.type}) - ${peer.distance}`);
            });
            
            this.updateUsage('p2pBandwidth', 2);
        }, 4000);
    }
    
    syncTasks() {
        this.addActivity('Syncing tasks across devices...');
        
        setTimeout(() => {
            this.productivitySync.syncedData.tasks += 3;
            this.addActivity(`Task sync completed: ${this.productivitySync.syncedData.tasks} tasks synced`);
            this.updateSyncMetrics();
        }, 2000);
    }
    
    syncArtifacts() {
        this.addActivity('Syncing artifacts...');
        
        setTimeout(() => {
            this.productivitySync.syncedData.artifacts += 2;
            this.addActivity(`Artifact sync completed: ${this.productivitySync.syncedData.artifacts} artifacts synced`);
            this.updateSyncMetrics();
        }, 1500);
    }
    
    syncProjects() {
        this.addActivity('Syncing projects...');
        
        setTimeout(() => {
            this.productivitySync.syncedData.projects += 1;
            this.addActivity(`Project sync completed: ${this.productivitySync.syncedData.projects} projects synced`);
            this.updateSyncMetrics();
        }, 3000);
    }
    
    syncAll() {
        this.addActivity('Performing full sync...');
        
        setTimeout(() => {
            this.productivitySync.syncedData.tasks += 5;
            this.productivitySync.syncedData.artifacts += 3;
            this.productivitySync.syncedData.projects += 1;
            this.addActivity('Full sync completed successfully');
            this.updateSyncMetrics();
            this.updateUsage('syncStorage', 8);
        }, 4000);
    }
    
    handleCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;
        
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        
        // Process command based on mode
        if (this.mode === 'p2p') {
            this.processP2PCommand(command);
        } else if (this.mode === 'quantum') {
            this.processQuantumCommand(command);
        } else {
            this.processClassicalCommand(command);
        }
        
        this.commandInput.value = '';
        this.commandInput.focus();
    }
    
    processP2PCommand(command) {
        this.addActivity(`P2P command: ${command}`);
        
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('start') || lowerCommand.includes('network')) {
            this.startP2PNetwork();
        } else if (lowerCommand.includes('sync')) {
            this.quickSync();
        } else if (lowerCommand.includes('share') || lowerCommand.includes('send')) {
            this.openFileShare();
        } else if (lowerCommand.includes('connect') || lowerCommand.includes('join')) {
            this.openConnectionModal();
        } else if (lowerCommand.includes('discover') || lowerCommand.includes('find')) {
            this.discoverPeers();
        } else if (lowerCommand.includes('ping')) {
            const match = command.match(/ping\s+(\w+)/i);
            if (match) {
                this.pingPeer(match[1]);
            }
        } else {
            // Generic P2P/AI processing
            setTimeout(() => {
                this.addActivity(`P2P processing result for: ${command}`);
                this.updateUsage('aiTokens', 3);
            }, 1500);
        }
    }
    
    processQuantumCommand(command) {
        this.addActivity(`Quantum command: ${command}`);
        
        // Simulate quantum processing
        setTimeout(() => {
            this.addActivity(`Quantum processing completed for: ${command}`);
            this.updateUsage('aiTokens', 5);
        }, 2000);
    }
    
    processClassicalCommand(command) {
        this.addActivity(`Classical command: ${command}`);
        
        // Simulate classical AI processing
        setTimeout(() => {
            const responses = [
                'Analysis completed successfully',
                'Code refactoring suggestions generated',
                'Documentation updated',
                'Tests passed',
                'Build completed'
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addActivity(response);
            this.updateUsage('aiTokens', 2);
        }, 1000);
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.handleCommand();
        } else if (e.key === 'ArrowUp') {
            this.navigateHistory(-1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            this.navigateHistory(1);
            e.preventDefault();
        } else if (e.key === 'Tab') {
            this.autoComplete();
            e.preventDefault();
        }
    }
    
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex += direction;
        
        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.commandInput.value = '';
            return;
        }
        
        this.commandInput.value = this.commandHistory[this.historyIndex];
    }
    
    autoComplete() {
        const value = this.commandInput.value.toLowerCase();
        const suggestions = this.mode === 'p2p' 
            ? ['start network', 'sync all', 'share file', 'connect to', 'discover peers', 'ping peer']
            : this.mode === 'quantum'
            ? ['run quantum', 'optimize circuit', 'benchmark frameworks']
            : ['analyze code', 'generate tests', 'refactor', 'build project'];
        
        const match = suggestions.find(s => s.startsWith(value));
        if (match) {
            this.commandInput.value = match;
        }
    }
    
    addPeer(peer) {
        this.networkConfig.peers.set(peer.id, peer);
        this.updatePeerCount();
    }
    
    addTransfer(transfer) {
        this.networkConfig.transfers.set(transfer.id, transfer);
    }
    
    addActivity(text, type = 'p2p') {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const metrics = type === 'transfer' ? 
            `<div class="activity-metrics">
                <span class="metric">${text.size || 'N/A'}</span>
                <span class="metric">${text.time || 'N/A'}</span>
            </div>` : 
            type === 'peer' ?
            `<div class="activity-metrics">
                <span class="metric">${text.connection || 'Direct'}</span>
            </div>` :
            '';
        
        activityItem.innerHTML = `
            <div class="activity-timestamp">${timestamp}</div>
            <div class="activity-text">${typeof text === 'string' ? text : text.message}</div>
            ${metrics}
        `;
        
        // Add to appropriate activity section
        const activitySection = document.querySelector('.p2p-activity');
        if (activitySection) {
            activitySection.appendChild(activityItem);
            
            // Keep only last 20 items
            const items = activitySection.querySelectorAll('.activity-item');
            if (items.length > 20) {
                activitySection.removeChild(items[0]);
            }
        }
        
        // Auto-scroll to bottom
        if (this.activityContent) {
            this.activityContent.scrollTop = this.activityContent.scrollHeight;
        }
    }
    
    updatePeerDisplay() {
        if (!this.peerList) return;
        
        // Clear existing peer items except productivity peers
        const existingItems = this.peerList.querySelectorAll('.peer-item:not(.productivity-peer)');
        existingItems.forEach(item => item.remove());
        
        // Add new peers
        this.networkConfig.peers.forEach(peer => {
            if (!peer.productivity) {
                const peerItem = document.createElement('div');
                peerItem.className = 'peer-item';
                peerItem.innerHTML = `
                    <div class="peer-info">
                        <div class="peer-name">${peer.name}</div>
                        <div class="peer-type">${peer.type}</div>
                        <div class="peer-status">
                            <div class="status-indicator ${peer.status}"></div>
                            <span>${peer.status}</span>
                        </div>
                    </div>
                    <div class="peer-actions">
                        <button class="peer-btn" onclick="terminal.pingPeer('${peer.id}')">Ping</button>
                        <button class="peer-btn" onclick="terminal.sendFileTo('${peer.id}')">Send</button>
                    </div>
                `;
                
                this.peerList.appendChild(peerItem);
            }
        });
    }
    
    updatePeerCount() {
        const peerCount = this.networkConfig.peers.size;
        if (this.statusElements.peerCount) {
            this.statusElements.peerCount.textContent = `${peerCount} peers connected`;
        }
    }
    
    updateTransferDisplay() {
        if (!this.transferList) return;
        
        this.transferList.innerHTML = '';
        
        this.networkConfig.transfers.forEach(transfer => {
            const transferItem = document.createElement('div');
            transferItem.className = `transfer-item ${transfer.status}`;
            transferItem.innerHTML = `
                <div class="transfer-info">
                    <div class="transfer-name">${transfer.name}</div>
                    <div class="transfer-peer">→ ${transfer.peer}</div>
                    <div class="transfer-size">${transfer.size}</div>
                </div>
                <div class="transfer-progress">
                    <div class="transfer-progress-fill" style="width: ${transfer.progress}%"></div>
                </div>
                <div class="transfer-status">${transfer.status === 'completed' ? 'Completed' : `${transfer.status}... ${transfer.progress}%`}</div>
            `;
            
            this.transferList.appendChild(transferItem);
        });
    }
    
    updateNetworkStatus(status, text) {
        if (this.statusElements.networkStatusIndicator) {
            this.statusElements.networkStatusIndicator.className = `network-indicator ${status}`;
        }
        
        if (this.statusElements.networkStatus) {
            this.statusElements.networkStatus.textContent = text;
        }
        
        // Update header status
        const headerNetworkStatus = document.getElementById('network-status');
        if (headerNetworkStatus) {
            headerNetworkStatus.textContent = text;
        }
    }
    
    updateProductivityStatus() {
        const status = this.productivitySync.enabled ? 'Active' : 'Inactive';
        const productivityStatus = document.getElementById('productivity-status');
        if (productivityStatus) {
            productivityStatus.textContent = status;
        }
    }
    
    updateSyncMetrics() {
        // Update sync metrics display
        const metricsElements = {
            tasks: document.querySelector('.sync-metric:nth-child(1) .metric-value'),
            projects: document.querySelector('.sync-metric:nth-child(2) .metric-value'),
            lastSync: document.querySelector('.sync-metric:nth-child(3) .metric-value')
        };
        
        if (metricsElements.tasks) {
            metricsElements.tasks.textContent = this.productivitySync.syncedData.tasks;
        }
        
        if (metricsElements.projects) {
            metricsElements.projects.textContent = this.productivitySync.syncedData.projects;
        }
        
        if (metricsElements.lastSync) {
            metricsElements.lastSync.textContent = 'Just now';
        }
    }
    
    updateUsage(type, increment) {
        this.usage[type] = Math.min(100, this.usage[type] + increment);
        
        // Update usage bars
        const usageItems = document.querySelectorAll('.usage-item');
        usageItems.forEach(item => {
            const label = item.querySelector('.usage-label').textContent;
            const fill = item.querySelector('.usage-fill');
            const text = item.querySelector('.usage-text');
            
            if (label.includes('P2P') && type === 'p2pBandwidth') {
                fill.style.width = `${this.usage.p2pBandwidth}%`;
                text.textContent = `${this.usage.p2pBandwidth}/100 MB`;
            } else if (label.includes('AI') && type === 'aiTokens') {
                fill.style.width = `${this.usage.aiTokens}%`;
                text.textContent = `${this.usage.aiTokens}/100`;
            } else if (label.includes('Sync') && type === 'syncStorage') {
                fill.style.width = `${this.usage.syncStorage}%`;
                text.textContent = `${this.usage.syncStorage}/100 GB`;
            }
        });
    }
    
    updateNetworkVisualization() {
        // Update network connections based on peer count
        if (this.networkVisualization) {
            const svg = this.networkVisualization.querySelector('.network-connections');
            if (svg) {
                // Update connection lines based on active peers
                const lines = svg.querySelectorAll('line');
                lines.forEach(line => {
                    line.style.stroke = this.isP2PActive ? '#00ffff' : '#666';
                    line.style.strokeWidth = this.isP2PActive ? '2' : '1';
                });
            }
        }
    }
    
    performProductivitySync() {
        this.addActivity('Performing automatic productivity sync...');
        
        // Simulate sync process
        setTimeout(() => {
            this.productivitySync.lastSync = Date.now();
            this.productivitySync.syncedData.tasks += Math.floor(Math.random() * 3);
            this.addActivity('Automatic productivity sync completed');
            this.updateSyncMetrics();
        }, 2000);
    }
    
    pingPeer(peerId) {
        this.addActivity(`Pinging peer: ${peerId}`);
        
        setTimeout(() => {
            const latency = Math.floor(Math.random() * 100) + 10;
            this.addActivity(`Ping response from ${peerId}: ${latency}ms`);
        }, 1000);
    }
    
    sendFileTo(peerId) {
        this.addActivity(`Initiating file transfer to: ${peerId}`);
        
        // Simulate file transfer
        const transferId = 'transfer_' + Date.now();
        this.addTransfer({
            id: transferId,
            name: 'shared_file.txt',
            peer: peerId,
            size: '1.2 MB',
            progress: 0,
            status: 'sending'
        });
        
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                this.addActivity(`File transfer completed to ${peerId}`);
            }
            
            const transfer = this.networkConfig.transfers.get(transferId);
            if (transfer) {
                transfer.progress = progress;
                transfer.status = progress === 100 ? 'completed' : 'sending';
                this.updateTransferDisplay();
            }
        }, 500);
    }
    
    syncProductivity(peerId) {
        this.addActivity(`Syncing productivity data with: ${peerId}`);
        
        setTimeout(() => {
            this.addActivity(`Productivity sync completed with ${peerId}`);
            this.updateUsage('syncStorage', 2);
        }, 1500);
    }
    
    selectFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => {
                this.shareFile(file);
            });
        });
        input.click();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.fileDropZone.style.background = 'rgba(0, 255, 255, 0.1)';
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.fileDropZone.style.background = 'rgba(255, 255, 255, 0.02)';
        
        Array.from(e.dataTransfer.files).forEach(file => {
            this.shareFile(file);
        });
    }
    
    shareFile(file) {
        this.addActivity(`Sharing file: ${file.name} (${this.formatFileSize(file.size)})`);
        
        // Add to transfer list
        const transferId = 'transfer_' + Date.now();
        this.addTransfer({
            id: transferId,
            name: file.name,
            peer: 'All Peers',
            size: this.formatFileSize(file.size),
            progress: 0,
            status: 'preparing'
        });
        
        this.updateTransferDisplay();
        this.updateUsage('p2pBandwidth', 10);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    takeScreenshot() {
        this.addActivity('Taking screenshot...');
        
        setTimeout(() => {
            this.addActivity('Screenshot captured and shared');
            this.updateUsage('p2pBandwidth', 3);
        }, 1000);
    }
    
    shareClipboard() {
        this.addActivity('Sharing clipboard content...');
        
        setTimeout(() => {
            this.addActivity('Clipboard content shared with peers');
            this.updateUsage('p2pBandwidth', 1);
        }, 500);
    }
    
    recordVoiceNote() {
        this.addActivity('Recording voice note...');
        
        setTimeout(() => {
            this.addActivity('Voice note recorded and shared');
            this.updateUsage('p2pBandwidth', 2);
        }, 3000);
    }
    
    showNetworkGraph() {
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === 'network-graph');
        });
        
        this.updateNetworkVisualization();
    }
    
    showNetworkList() {
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === 'network-list');
        });
        
        // Show network list view
        this.addActivity('Switched to network list view');
    }
    
    showNetworkMetrics() {
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === 'network-metrics');
        });
        
        // Show network metrics view
        this.addActivity('Switched to network metrics view');
    }
    
    activateVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.commandInput.value = transcript;
                this.addActivity(`Voice input: ${transcript}`);
            };
            
            recognition.onerror = (event) => {
                this.addActivity(`Voice recognition error: ${event.error}`);
            };
            
            recognition.start();
            this.addActivity('Voice recognition activated...');
        } else {
            this.addActivity('Voice recognition not supported');
        }
    }
    
    openFileShare() {
        this.selectFile();
    }
    
    quickSync() {
        this.addActivity('Performing quick sync...');
        
        setTimeout(() => {
            this.addActivity('Quick sync completed');
            this.updateUsage('syncStorage', 3);
        }, 2000);
    }
    
    startQRScanner() {
        this.addActivity('Starting QR code scanner...');
        
        setTimeout(() => {
            this.addActivity('QR scanner ready');
        }, 1000);
    }
    
    toggleColumn(toggleId) {
        const button = document.getElementById(toggleId);
        const column = button.closest('.column');
        const content = column.querySelector('.column-content');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            button.style.opacity = '1';
        } else {
            content.style.display = 'none';
            button.style.opacity = '0.5';
        }
    }
    
    updateInterface() {
        // Update visibility based on mode
        const p2pElements = document.querySelectorAll('.p2p-only');
        const quantumElements = document.querySelectorAll('.quantum-only');
        const classicalElements = document.querySelectorAll('.classical-only');
        
        if (this.mode === 'p2p') {
            p2pElements.forEach(el => el.style.display = 'block');
            quantumElements.forEach(el => el.style.display = 'none');
            classicalElements.forEach(el => el.style.display = 'block');
        } else if (this.mode === 'quantum') {
            p2pElements.forEach(el => el.style.display = 'none');
            quantumElements.forEach(el => el.style.display = 'block');
            classicalElements.forEach(el => el.style.display = 'none');
        } else {
            p2pElements.forEach(el => el.style.display = 'none');
            quantumElements.forEach(el => el.style.display = 'none');
            classicalElements.forEach(el => el.style.display = 'block');
        }
    }
    
    initializeResponsiveHandlers() {
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Initial resize check
        this.handleResize();
    }
    
    handleResize() {
        const width = window.innerWidth;
        
        // Update layout based on screen size
        if (width <= 480) {
            this.optimizeForMobile();
        } else if (width <= 800) {
            this.optimizeForTablet();
        } else {
            this.optimizeForDesktop();
        }
        
        // Update network visualization
        this.updateNetworkVisualization();
    }
    
    optimizeForMobile() {
        // Reduce update frequency on mobile
        clearInterval(this.p2pUpdateInterval);
        this.p2pUpdateInterval = setInterval(() => {
            this.updateNetworkVisualization();
        }, 10000);
    }
    
    optimizeForTablet() {
        // Medium update frequency for tablets
        clearInterval(this.p2pUpdateInterval);
        this.p2pUpdateInterval = setInterval(() => {
            this.updateNetworkVisualization();
        }, 5000);
    }
    
    optimizeForDesktop() {
        // Full update frequency for desktop
        clearInterval(this.p2pUpdateInterval);
        this.p2pUpdateInterval = setInterval(() => {
            this.updateNetworkVisualization();
        }, 3000);
    }
    
    startP2PSimulation() {
        // Continuous P2P simulation updates
        setInterval(() => {
            if (this.isP2PActive) {
                // Simulate network activity
                if (Math.random() > 0.95) {
                    const activities = [
                        'Peer heartbeat received',
                        'Network topology updated',
                        'File chunk transferred',
                        'Productivity sync triggered'
                    ];
                    
                    const activity = activities[Math.floor(Math.random() * activities.length)];
                    this.addActivity(activity);
                }
                
                // Update performance metrics
                this.updatePerformanceMetrics();
            }
        }, 5000);
    }
    
    updatePerformanceMetrics() {
        const performanceItems = document.querySelectorAll('.performance-item');
        performanceItems.forEach(item => {
            const label = item.querySelector('.performance-label').textContent;
            const fill = item.querySelector('.performance-fill');
            const value = item.querySelector('.performance-value');
            
            if (label.includes('Latency')) {
                const latency = Math.floor(Math.random() * 50) + 10;
                fill.style.width = `${100 - latency}%`;
                value.textContent = `${latency}ms`;
            } else if (label.includes('Throughput')) {
                const throughput = Math.floor(Math.random() * 40) + 60;
                fill.style.width = `${throughput}%`;
                value.textContent = `${throughput} MB/s`;
            } else if (label.includes('Reliability')) {
                const reliability = Math.floor(Math.random() * 10) + 90;
                fill.style.width = `${reliability}%`;
                value.textContent = `${reliability}%`;
            }
        });
    }
}

// Initialize the Enhanced P2P Terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new EnhancedP2PTerminal();
    
    // Make terminal globally accessible
    window.terminal = terminal;
    
    // Initial setup
    terminal.addActivity('Enhanced P2P Claude Terminal initialized');
    terminal.addActivity('Productivity sync active');
    terminal.addActivity('P2P network ready');
    
    // Focus on input
    terminal.commandInput.focus();
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});