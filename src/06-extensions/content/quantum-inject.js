// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Quantum Fox Content Script - Injected into all pages
// Provides quantum development overlay on any website

let quantumEnabled = false;
let quantumPosition = [0, 0, 0];

// Initialize quantum overlay
function initializeQuantumOverlay() {
    if (document.getElementById('quantum-fox-overlay')) return;
    
    const overlay = createQuantumOverlay();
    document.body.appendChild(overlay);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'quantumPositionChanged':
                updateQuantumPosition(request.position);
                sendResponse({success: true});
                break;
                
            case 'toggleQuantumOverlay':
                toggleQuantumOverlay();
                sendResponse({success: true});
                break;
        }
    });
}

function createQuantumOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'quantum-fox-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 52, 96, 0.95));
        color: white;
        padding: 12px;
        border-radius: 8px;
        z-index: 999999;
        font-family: 'Monaco', monospace;
        font-size: 11px;
        border: 1px solid rgba(100, 181, 246, 0.3);
        backdrop-filter: blur(10px);
        min-width: 200px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: bold; background: linear-gradient(45deg, #64b5f6, #81c784); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                🌌 Quantum Fox
            </div>
            <button id="quantum-toggle" style="
                background: none;
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                border-radius: 3px;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 10px;
            ">Hide</button>
        </div>
        
        <div id="quantum-position-display" style="
            margin-bottom: 8px;
            padding: 5px;
            background: rgba(100, 181, 246, 0.1);
            border-radius: 4px;
        ">
            Position: [0, 0, 0]
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-bottom: 8px;">
            <button class="quantum-nav-btn" data-direction="+1" style="
                padding: 4px 2px;
                background: rgba(100, 181, 246, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">+1</button>
            <button class="quantum-nav-btn" data-direction="+0" style="
                padding: 4px 2px;
                background: rgba(129, 199, 132, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">+0</button>
            <button class="quantum-nav-btn" data-direction="+n" style="
                padding: 4px 2px;
                background: rgba(255, 183, 77, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">+n</button>
            <button class="quantum-nav-btn" data-direction="-1" style="
                padding: 4px 2px;
                background: rgba(244, 67, 54, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">-1</button>
            <button class="quantum-nav-btn" data-direction="-0" style="
                padding: 4px 2px;
                background: rgba(156, 39, 176, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">-0</button>
            <button class="quantum-nav-btn" data-direction="-n" style="
                padding: 4px 2px;
                background: rgba(255, 87, 34, 0.7);
                border: none;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            ">-n</button>
        </div>
        
        <div style="font-size: 9px; opacity: 0.7; text-align: center;">
            X=Dependencies | Y=Lines | Z=Complexity
        </div>
    `;
    
    // Add event listeners
    setupQuantumNavigation(overlay);
    
    return overlay;
}

function setupQuantumNavigation(overlay) {
    // Navigation buttons
    const navButtons = overlay.querySelectorAll('.quantum-nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const direction = this.dataset.direction;
            navigateQuantum(direction);
        });
    });
    
    // Toggle button
    const toggleBtn = overlay.querySelector('#quantum-toggle');
    let isVisible = false;
    
    toggleBtn.addEventListener('click', function() {
        isVisible = !isVisible;
        overlay.style.transform = isVisible ? 'translateX(0)' : 'translateX(100%)';
        this.textContent = isVisible ? 'Hide' : 'Show';
    });
    
    // Auto-show on hover
    overlay.addEventListener('mouseenter', function() {
        if (!isVisible) {
            this.style.transform = 'translateX(0)';
        }
    });
    
    overlay.addEventListener('mouseleave', function() {
        if (!isVisible) {
            this.style.transform = 'translateX(100%)';
        }
    });
}

function navigateQuantum(direction) {
    // Update position based on direction
    switch(direction) {
        case '+1': quantumPosition[1]++; break;
        case '-1': quantumPosition[1]--; break;
        case '+0': quantumPosition[0]++; break;
        case '-0': quantumPosition[0]--; break;
        case '+n': quantumPosition[2]++; break;
        case '-n': quantumPosition[2]--; break;
    }
    
    // Update display
    updateQuantumPosition(quantumPosition);
    
    // Send to background script
    chrome.runtime.sendMessage({
        action: 'updateQuantumPosition',
        position: quantumPosition
    });
    
    // Visual feedback
    showQuantumNavigationFeedback(direction);
}

function updateQuantumPosition(position) {
    quantumPosition = position;
    const display = document.getElementById('quantum-position-display');
    if (display) {
        display.textContent = `Position: [${position[0]}, ${position[1]}, ${position[2]}]`;
    }
}

function showQuantumNavigationFeedback(direction) {
    // Create temporary visual feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(100, 181, 246, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000000;
        font-family: monospace;
        font-size: 14px;
        pointer-events: none;
        animation: quantumFeedback 0.8s ease-out forwards;
    `;
    
    const directionMap = {
        '+1': '↑ Lines Up',
        '-1': '↓ Lines Down',
        '+0': '→ Dependencies Right',
        '-0': '← Dependencies Left',
        '+n': '↗ Complexity Forward',
        '-n': '↙ Complexity Back'
    };
    
    feedback.textContent = `🌌 ${directionMap[direction]}`;
    
    // Add CSS animation
    if (!document.getElementById('quantum-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'quantum-feedback-styles';
        style.textContent = `
            @keyframes quantumFeedback {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 800);
}

function toggleQuantumOverlay() {
    const overlay = document.getElementById('quantum-fox-overlay');
    if (overlay) {
        overlay.remove();
        quantumEnabled = false;
    } else {
        initializeQuantumOverlay();
        quantumEnabled = true;
    }
}

// Code selection analysis
function analyzeSelectedCode() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText.length > 5) {
        const analysis = {
            lines: selectedText.split('\n').length,
            characters: selectedText.length,
            complexity: Math.floor(selectedText.length / 20),
            type: detectCodeType(selectedText),
            quantumPosition: [...quantumPosition]
        };
        
        showCodeAnalysis(analysis, selectedText);
    }
}

function detectCodeType(text) {
    if (text.includes('function') || text.includes('def ')) return 'function';
    if (text.includes('class ')) return 'class';
    if (text.includes('import ') || text.includes('require(')) return 'import';
    if (text.includes('if ') || text.includes('while ') || text.includes('for ')) return 'control';
    return 'code';
}

function showCodeAnalysis(analysis, selectedText) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(15, 52, 96, 0.98));
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000000;
        font-family: 'Monaco', monospace;
        font-size: 11px;
        border: 1px solid rgba(100, 181, 246, 0.5);
        backdrop-filter: blur(10px);
        max-width: 400px;
    `;
    
    popup.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; background: linear-gradient(45deg, #64b5f6, #81c784); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            🌌 Quantum Code Analysis
        </div>
        
        <div style="margin-bottom: 8px;">
            <strong>Type:</strong> ${analysis.type}<br>
            <strong>Lines:</strong> ${analysis.lines}<br>
            <strong>Characters:</strong> ${analysis.characters}<br>
            <strong>Complexity:</strong> ${analysis.complexity}<br>
            <strong>Quantum Position:</strong> [${analysis.quantumPosition.join(', ')}]
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; font-size: 10px; max-height: 100px; overflow-y: auto; margin-bottom: 10px;">
            ${selectedText.substring(0, 200)}${selectedText.length > 200 ? '...' : ''}
        </div>
        
        <div style="text-align: center;">
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(100, 181, 246, 0.7);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            ">Close</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 8000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuantumOverlay);
} else {
    initializeQuantumOverlay();
}

// Listen for text selection
document.addEventListener('mouseup', function() {
    setTimeout(analyzeSelectedCode, 100);
});

// Keyboard shortcuts for quantum navigation
document.addEventListener('keydown', function(e) {
    // Only activate when Ctrl+Shift is held (to avoid interfering with normal usage)
    if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                navigateQuantum('+1');
                break;
            case 'ArrowDown':
                e.preventDefault();
                navigateQuantum('-1');
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateQuantum('+0');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                navigateQuantum('-0');
                break;
            case 'PageUp':
                e.preventDefault();
                navigateQuantum('+n');
                break;
            case 'PageDown':
                e.preventDefault();
                navigateQuantum('-n');
                break;
        }
    }
});

console.log('🌌 Quantum Fox content script loaded');