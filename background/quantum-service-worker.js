// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Quantum Fox Background Service Worker
// Handles extension lifecycle and quantum environment management

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // First time installation
        initializeQuantumEnvironment();
        showWelcomeNotification();
    } else if (details.reason === 'update') {
        // Extension updated
        checkQuantumEnvironmentCompatibility();
    }
});

// Extension icon click handler
chrome.action.onClicked.addListener((tab) => {
    // Open popup (this is automatically handled by manifest)
});

// Context menu integration
chrome.runtime.onInstalled.addListener(() => {
    // Add context menu for quantum code analysis
    chrome.contextMenus.create({
        id: "quantum-analyze",
        title: "🌌 Analyze with Quantum Fox",
        contexts: ["selection", "page"]
    });
    
    chrome.contextMenus.create({
        id: "quantum-convert",
        title: "🔄 Convert to Quantum Numbering",
        contexts: ["selection"]
    });
    
    chrome.contextMenus.create({
        id: "quantum-navigate",
        title: "📍 Navigate in Quantum Space",
        contexts: ["page"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "quantum-analyze":
            analyzeWithQuantumFox(info, tab);
            break;
        case "quantum-convert":
            convertToQuantumNumbering(info, tab);
            break;
        case "quantum-navigate":
            navigateInQuantumSpace(info, tab);
            break;
    }
});

// Message handling from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getQuantumPosition':
            getQuantumPosition().then(sendResponse);
            return true;
            
        case 'updateQuantumPosition':
            updateQuantumPosition(request.position).then(sendResponse);
            return true;
            
        case 'launchQuantumTerminal':
            launchQuantumTerminal(request.version).then(sendResponse);
            return true;
            
        case 'checkSystemStatus':
            checkSystemStatus().then(sendResponse);
            return true;
    }
});

async function initializeQuantumEnvironment() {
    // Set default quantum position
    await chrome.storage.local.set({
        quantumPosition: [0, 0, 0],
        quantumVersion: 'v2',
        quantumEnabled: true,
        lastLaunch: Date.now()
    });
    
    console.log('🌌 Quantum Fox environment initialized');
}

async function getQuantumPosition() {
    const data = await chrome.storage.local.get('quantumPosition');
    return data.quantumPosition || [0, 0, 0];
}

async function updateQuantumPosition(position) {
    await chrome.storage.local.set({ 
        quantumPosition: position,
        lastUpdate: Date.now()
    });
    
    // Notify all tabs of position update
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
            action: 'quantumPositionChanged',
            position: position
        }).catch(() => {}); // Ignore if content script not loaded
    });
    
    return true;
}

async function analyzeWithQuantumFox(info, tab) {
    const selectedText = info.selectionText || '';
    
    // Inject quantum analysis into the page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectQuantumAnalysis,
        args: [selectedText]
    });
}

async function convertToQuantumNumbering(info, tab) {
    const selectedText = info.selectionText || '';
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectQuantumConverter,
        args: [selectedText]
    });
}

async function navigateInQuantumSpace(info, tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectQuantumNavigator
    });
}

async function launchQuantumTerminal(version = 'v2') {
    // Create new tab with terminal launch instructions
    const command = getTerminalCommand(version);
    const instructionURL = createInstructionURL(command);
    
    await chrome.tabs.create({ url: instructionURL });
    
    return { success: true, command };
}

function getTerminalCommand(version) {
    const commands = {
        'v1': 'cd /Users/tref/quantum-fox && python3 quantum_prototype.py',
        'v2': 'cd /Users/tref/quantum-fox && ./launch-progressive.sh v2 quantum',
        'v3': 'cd /Users/tref/quantum-fox && ./launch-progressive.sh v3'
    };
    
    return commands[version] || commands.v2;
}

function createInstructionURL(command) {
    const html = `
        <html>
        <head>
            <title>Quantum Fox Terminal</title>
            <style>
                body { 
                    font-family: 'Monaco', monospace; 
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    color: white; 
                    padding: 30px; 
                    margin: 0;
                }
                .container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .title { 
                    font-size: 24px; 
                    background: linear-gradient(45deg, #64b5f6, #81c784, #ffb74d);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }
                .command-box { 
                    background: rgba(255, 255, 255, 0.1); 
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    position: relative;
                }
                .command { 
                    user-select: all; 
                    background: #0f3460;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #64b5f6;
                }
                .copy-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #64b5f6;
                    border: none;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .status { 
                    background: rgba(76, 175, 80, 0.2); 
                    padding: 10px; 
                    border-radius: 4px; 
                    margin-top: 20px;
                    border-left: 4px solid #4caf50;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">🌌 Quantum Fox Terminal</h1>
                    <p>Copy and run this command in your terminal:</p>
                </div>
                
                <div class="command-box">
                    <button class="copy-btn" onclick="copyCommand()">Copy</button>
                    <div class="command" id="command">${command}</div>
                </div>
                
                <div class="command-box">
                    <h3>Alternative: Use Complete Launcher</h3>
                    <div class="command">cd /Users/tref/quantum-fox && ./launch-complete.sh</div>
                </div>
                
                <div id="status" class="status" style="display: none;">
                    ✅ Command copied to clipboard!
                </div>
            </div>
            
            <script>
                function copyCommand() {
                    const command = document.getElementById('command').textContent;
                    navigator.clipboard.writeText(command).then(() => {
                        document.getElementById('status').style.display = 'block';
                        setTimeout(() => {
                            document.getElementById('status').style.display = 'none';
                        }, 3000);
                    });
                }
                
                // Auto-copy on page load
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        copyCommand();
                    }, 500);
                });
            </script>
        </body>
        </html>
    `;
    
    return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

async function checkSystemStatus() {
    // Simulate system checks (in real implementation, these would be actual checks)
    return {
        python: true,
        uv: true,
        opencode: false,
        quantum: true,
        position: await getQuantumPosition()
    };
}

function showWelcomeNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/quantum-48.png',
        title: '🌌 Quantum Fox Installed!',
        message: 'AI Development Environment ready. Click the extension icon to get started.'
    });
}

async function checkQuantumEnvironmentCompatibility() {
    const data = await chrome.storage.local.get(['quantumVersion', 'lastLaunch']);
    
    // Check if environment needs updates
    const daysSinceLastLaunch = (Date.now() - (data.lastLaunch || 0)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastLaunch > 7) {
        // Show update notification if haven't used in a week
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/quantum-48.png',
            title: '🌌 Quantum Fox Update',
            message: 'Your quantum development environment may need updates. Check the latest version!'
        });
    }
}

// Content script injection functions
function injectQuantumAnalysis(selectedText) {
    // This function runs in the page context
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #1a1a2e, #0f3460);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-family: monospace;
        border: 1px solid rgba(100, 181, 246, 0.5);
        max-width: 300px;
    `;
    
    overlay.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">🌌 Quantum Analysis</div>
        <div style="font-size: 12px; margin-bottom: 5px;">Selected: ${selectedText.substring(0, 50)}...</div>
        <div style="font-size: 11px; color: #64b5f6;">
            Lines: ${selectedText.split('\n').length}<br>
            Complexity: ${Math.floor(selectedText.length / 10)}<br>
            Quantum Position: [${Math.floor(Math.random() * 10)}, ${Math.floor(Math.random() * 10)}, ${Math.floor(Math.random() * 10)}]
        </div>
        <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
        ">×</button>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.remove(), 10000);
}

function injectQuantumConverter(selectedText) {
    // Convert selected text to quantum numbering
    const lines = selectedText.split('\n');
    const quantumLines = lines.map((line, i) => {
        const prefix = detectLineType(line);
        return `${prefix}:${(i + 1).toString().padStart(3)} ${line}`;
    });
    
    const convertedText = quantumLines.join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(convertedText);
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e, #0f3460);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
        border: 1px solid rgba(100, 181, 246, 0.5);
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">🔄 Quantum Conversion Complete</div>
        <div style="font-size: 12px;">Text converted to quantum numbering and copied to clipboard!</div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function detectLineType(line) {
    const stripped = line.trim();
    if (stripped.startsWith('#!')) return '  n';
    if (stripped.startsWith('#')) return ' +1';
    if (stripped.startsWith('import ') || stripped.startsWith('from ')) return ' -n';
    if (stripped.startsWith('class ')) return ' +0';
    if (stripped.startsWith('def ') || stripped.startsWith('function ')) return '  0';
    if (stripped.includes('try:') || stripped.includes('except:')) return ' -1';
    if (stripped.startsWith('if ') || stripped.startsWith('elif ')) return ' +n';
    if (stripped.startsWith('for ') || stripped.startsWith('while ')) return ' +2';
    if (stripped.startsWith('return ')) return ' -0';
    if (stripped.startsWith('print(') || stripped.includes('console.log')) return ' +3';
    return '   ';
}

function injectQuantumNavigator() {
    // Inject quantum navigation overlay
    const navigator = document.createElement('div');
    navigator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, #1a1a2e, #0f3460);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-family: monospace;
        border: 1px solid rgba(100, 181, 246, 0.5);
    `;
    
    navigator.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">📍 Quantum Navigation</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 10px;">
            <button onclick="quantumMove('+1')" style="padding: 5px; background: #64b5f6; border: none; color: white; border-radius: 3px;">+1</button>
            <button onclick="quantumMove('+0')" style="padding: 5px; background: #81c784; border: none; color: white; border-radius: 3px;">+0</button>
            <button onclick="quantumMove('+n')" style="padding: 5px; background: #ffb74d; border: none; color: white; border-radius: 3px;">+n</button>
            <button onclick="quantumMove('-1')" style="padding: 5px; background: #f44336; border: none; color: white; border-radius: 3px;">-1</button>
            <button onclick="quantumMove('-0')" style="padding: 5px; background: #9c27b0; border: none; color: white; border-radius: 3px;">-0</button>
            <button onclick="quantumMove('-n')" style="padding: 5px; background: #ff5722; border: none; color: white; border-radius: 3px;">-n</button>
        </div>
        <div id="quantum-position" style="font-size: 11px; color: #64b5f6;">Position: [0, 0, 0]</div>
        <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
        ">×</button>
    `;
    
    // Add navigation functions to global scope
    window.quantumPosition = [0, 0, 0];
    window.quantumMove = function(direction) {
        const pos = window.quantumPosition;
        switch(direction) {
            case '+1': pos[1]++; break;
            case '-1': pos[1]--; break;
            case '+0': pos[0]++; break;
            case '-0': pos[0]--; break;
            case '+n': pos[2]++; break;
            case '-n': pos[2]--; break;
        }
        document.getElementById('quantum-position').textContent = `Position: [${pos[0]}, ${pos[1]}, ${pos[2]}]`;
    };
    
    document.body.appendChild(navigator);
}