// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function test4Features() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING 4 KEY FEATURES ===\n');
    
    await page.goto('http://localhost:8084/web/quantum-notepad.html', { 
        waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ===== TEST 1: FOOTER =====
    console.log('1. FOOTER TEST:');
    const footerInfo = await page.evaluate(() => {
        const footer = document.querySelector('footer, .footer, [class*="footer"]');
        if (!footer) return { exists: false };
        
        const aiInput = footer.querySelector('input[placeholder*="Ask AI"], input[placeholder*="AI"]');
        const cmdInput = footer.querySelector('input[placeholder*="uv run"], input[placeholder*="command"]');
        const executeBtn = footer.querySelector('button');
        const quickBtns = footer.querySelectorAll('button');
        
        return {
            exists: true,
            hasAiInput: !!aiInput,
            aiPlaceholder: aiInput?.placeholder,
            hasCmdInput: !!cmdInput,
            cmdPlaceholder: cmdInput?.placeholder,
            hasExecuteBtn: !!executeBtn,
            quickButtonCount: quickBtns.length,
            quickButtonTexts: Array.from(quickBtns).map(b => b.textContent.trim())
        };
    });
    
    if (footerInfo.exists) {
        console.log('   ✓ Footer found');
        console.log('   AI Input:', footerInfo.hasAiInput ? `✓ (${footerInfo.aiPlaceholder})` : '✗ NOT FOUND');
        console.log('   Command Input:', footerInfo.hasCmdInput ? `✓ (${footerInfo.cmdPlaceholder})` : '✗ NOT FOUND');
        console.log('   Execute Button:', footerInfo.hasExecuteBtn ? '✓' : '✗');
        console.log('   Quick buttons:', footerInfo.quickButtonTexts.join(', '));
        
        // Type "qstatus" and press Enter
        console.log('\n   Testing qstatus command...');
        const cmdInput = await page.$('input[placeholder*="uv run"], input[placeholder*="command"]');
        if (cmdInput) {
            await cmdInput.type('qstatus');
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const cellCount = await page.$$eval('.quantum-cell', cells => cells.length);
            console.log('   Cell count after qstatus:', cellCount, '(should be 4 if new cell added)');
        }
    } else {
        console.log('   ✗ Footer NOT FOUND');
    }
    
    await page.screenshot({ path: 'feature-1-footer.png', fullPage: true });
    console.log('   Screenshot: feature-1-footer.png\n');
    
    // ===== TEST 2: LAYER NAV =====
    console.log('2. LAYER NAVIGATION TEST:');
    const layerInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.quantum-sidebar');
        const layerSection = Array.from(sidebar.querySelectorAll('*')).find(el => 
            el.textContent.includes('Layer') && el.textContent.includes('Z')
        );
        
        if (!layerSection) return { exists: false };
        
        const upBtn = sidebar.querySelector('button[title*="up"], button:has(▲)') || 
                     Array.from(sidebar.querySelectorAll('button')).find(b => b.textContent.includes('▲'));
        const downBtn = sidebar.querySelector('button[title*="down"], button:has(▼)') ||
                       Array.from(sidebar.querySelectorAll('button')).find(b => b.textContent.includes('▼'));
        
        return {
            exists: true,
            text: layerSection.textContent.trim(),
            hasUpBtn: !!upBtn,
            hasDownBtn: !!downBtn
        };
    });
    
    if (layerInfo.exists) {
        console.log('   ✓ Layer component found');
        console.log('   Text:', layerInfo.text);
        console.log('   Up button:', layerInfo.hasUpBtn ? '✓' : '✗');
        console.log('   Down button:', layerInfo.hasDownBtn ? '✓' : '✗');
        
        // Click up button twice
        console.log('\n   Clicking ▲ twice...');
        const upBtn = await page.evaluateHandle(() => {
            const sidebar = document.querySelector('.quantum-sidebar');
            return Array.from(sidebar.querySelectorAll('button')).find(b => b.textContent.includes('▲'));
        });
        
        if (upBtn) {
            await upBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));
            await upBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const positionCheck = await page.evaluate(() => {
                const posDisplay = document.getElementById('position-display') || 
                                 document.querySelector('[class*="position"]');
                const layerText = Array.from(document.querySelectorAll('*')).find(el => 
                    el.textContent.includes('Layer') && el.textContent.includes('Z')
                );
                
                return {
                    position: posDisplay?.textContent.trim(),
                    layer: layerText?.textContent.trim()
                };
            });
            
            console.log('   Position display:', positionCheck.position);
            console.log('   Layer display:', positionCheck.layer);
            console.log('   Expected: [0, 0, 2] and Layer 2 Z');
        }
    } else {
        console.log('   ✗ Layer component NOT FOUND');
    }
    
    await page.screenshot({ path: 'feature-2-layer-nav.png', fullPage: true });
    console.log('   Screenshot: feature-2-layer-nav.png\n');
    
    // ===== TEST 3: CELL EXPAND =====
    console.log('3. CELL EXPAND TEST:');
    const cellButtons = await page.evaluate(() => {
        const firstCell = document.querySelector('.quantum-cell');
        if (!firstCell) return { exists: false };
        
        const header = firstCell.querySelector('.cell-header');
        const buttons = Array.from(header.querySelectorAll('.btn, button'));
        
        return {
            exists: true,
            buttonCount: buttons.length,
            buttonTexts: buttons.map(b => b.textContent.trim()),
            hasExpand: buttons.some(b => b.textContent.includes('⧉'))
        };
    });
    
    if (cellButtons.exists) {
        console.log('   ✓ First cell found');
        console.log('   Buttons:', cellButtons.buttonTexts.join(', '));
        console.log('   Has expand (⧉):', cellButtons.hasExpand ? '✓' : '✗');
        
        if (cellButtons.hasExpand) {
            console.log('\n   Clicking ⧉ expand button...');
            await page.evaluate(() => {
                const firstCell = document.querySelector('.quantum-cell');
                const header = firstCell.querySelector('.cell-header');
                const expandBtn = Array.from(header.querySelectorAll('.btn, button')).find(b => 
                    b.textContent.includes('⧉')
                );
                if (expandBtn) expandBtn.click();
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const overlayCheck = await page.evaluate(() => {
                const overlay = document.querySelector('.cell-overlay, .expand-overlay, [class*="overlay"]');
                const modal = document.querySelector('.modal, [class*="expand"]');
                
                return {
                    hasOverlay: !!(overlay || modal),
                    visible: overlay ? overlay.offsetParent !== null : (modal ? modal.offsetParent !== null : false)
                };
            });
            
            console.log('   Overlay opened:', overlayCheck.hasOverlay && overlayCheck.visible ? '✓' : '✗');
            
            await page.screenshot({ path: 'feature-3a-cell-expanded.png', fullPage: true });
            console.log('   Screenshot: feature-3a-cell-expanded.png');
            
            // Press Escape to close
            console.log('   Pressing Escape to close...');
            await page.keyboard.press('Escape');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const closedCheck = await page.evaluate(() => {
                const overlay = document.querySelector('.cell-overlay, .expand-overlay, [class*="overlay"]');
                const modal = document.querySelector('.modal, [class*="expand"]');
                return !overlay || overlay.offsetParent === null || !modal || modal.offsetParent === null;
            });
            
            console.log('   Overlay closed:', closedCheck ? '✓' : '✗');
        }
    } else {
        console.log('   ✗ First cell NOT FOUND');
    }
    
    await page.screenshot({ path: 'feature-3b-cell-closed.png', fullPage: true });
    console.log('   Screenshot: feature-3b-cell-closed.png\n');
    
    // ===== TEST 4: INSPECT TABLE =====
    console.log('4. INSPECT TABLE TEST:');
    
    // Click Inspect button
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const inspectBtn = buttons.find(b => b.textContent.includes('🔍') || b.textContent.includes('Inspect'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Scroll to Trade-Offs section
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        if (panel) {
            const tradeOffHeading = Array.from(panel.querySelectorAll('h1, h2, h3, h4')).find(h => 
                h.textContent.toLowerCase().includes('trade-off')
            );
            if (tradeOffHeading) {
                tradeOffHeading.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const inspectTableInfo = await page.evaluate(() => {
        const scorecard = document.querySelector('.scorecard, [class*="score"]');
        const table = document.querySelector('table');
        
        if (!table) return { exists: false };
        
        const rows = Array.from(table.querySelectorAll('tr'));
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const firstDataRow = rows.find(r => r.querySelector('td'));
        const capabilities = rows.slice(1).map(r => {
            const firstCell = r.querySelector('td');
            return firstCell ? firstCell.textContent.trim() : '';
        }).filter(c => c);
        
        const quantumCol = table.querySelector('th:nth-child(2), td:nth-child(2)');
        const hasGlow = quantumCol ? window.getComputedStyle(quantumCol).boxShadow !== 'none' : false;
        
        return {
            exists: true,
            hasScorecard: !!scorecard,
            scorecardText: scorecard?.textContent.trim(),
            rowCount: rows.length,
            columnCount: headers.length,
            firstCapabilities: capabilities.slice(0, 10),
            hasQuantumGlow: hasGlow || (quantumCol && window.getComputedStyle(quantumCol).background.includes('blue'))
        };
    });
    
    if (inspectTableInfo.exists) {
        console.log('   ✓ Table found');
        console.log('   Scorecard:', inspectTableInfo.hasScorecard ? '✓' : '✗');
        if (inspectTableInfo.scorecardText) {
            console.log('   Scorecard text:', inspectTableInfo.scorecardText.substring(0, 100));
        }
        console.log('   Rows:', inspectTableInfo.rowCount);
        console.log('   Columns:', inspectTableInfo.columnCount);
        console.log('   First capabilities:', inspectTableInfo.firstCapabilities.slice(0, 5).join(', '));
        console.log('   Quantum column glow:', inspectTableInfo.hasQuantumGlow ? '✓' : '✗');
    } else {
        console.log('   ✗ Table NOT FOUND');
    }
    
    await page.screenshot({ path: 'feature-4-inspect-table.png', fullPage: true });
    console.log('   Screenshot: feature-4-inspect-table.png\n');
    
    console.log('=== TEST COMPLETE ===');
    await browser.close();
}

test4Features().catch(console.error);
