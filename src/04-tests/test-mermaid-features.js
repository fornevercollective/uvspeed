// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function testMermaidFeatures() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING MERMAID FEATURES ===\n');
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    console.log('1. LOADING PAGE:');
    await page.goto('http://localhost:8084/web/quantum-notepad.html', { 
        waitUntil: 'networkidle0',
        timeout: 15000
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (errors.length > 0) {
        console.log('   ⚠️  Page errors detected:');
        errors.forEach(err => console.log('      -', err));
    } else {
        console.log('   ✓ Page loaded without errors');
    }
    
    // Check third cell
    const thirdCellInfo = await page.evaluate(() => {
        const cells = document.querySelectorAll('.quantum-cell');
        if (cells.length < 3) return { exists: false, count: cells.length };
        
        const thirdCell = cells[2];
        const typeLabel = thirdCell.querySelector('.cell-type');
        const textarea = thirdCell.querySelector('.cell-textarea, textarea');
        
        return {
            exists: true,
            count: cells.length,
            type: typeLabel ? typeLabel.textContent.trim() : 'unknown',
            content: textarea ? textarea.value.substring(0, 200) : 'no content',
            hasMermaid: textarea ? textarea.value.toLowerCase().includes('mermaid') : false,
            hasZig: textarea ? textarea.value.includes('Zig') : false,
            hasRust: textarea ? textarea.value.includes('Rust') : false
        };
    });
    
    console.log('\n   Third cell check:');
    if (thirdCellInfo.exists) {
        console.log('   ✓ Third cell found');
        console.log('   Type:', thirdCellInfo.type);
        console.log('   Has "mermaid":', thirdCellInfo.hasMermaid ? '✓' : '✗');
        console.log('   Has "Zig":', thirdCellInfo.hasZig ? '✓' : '✗');
        console.log('   Has "Rust":', thirdCellInfo.hasRust ? '✓' : '✗');
        console.log('   Content preview:', thirdCellInfo.content.substring(0, 80) + '...');
    } else {
        console.log('   ✗ Third cell NOT FOUND (only', thirdCellInfo.count, 'cells)');
    }
    
    await page.screenshot({ path: 'mermaid-1-initial.png', fullPage: true });
    console.log('   Screenshot: mermaid-1-initial.png');
    
    // Test 2: Run the mermaid cell
    console.log('\n2. RUNNING MERMAID CELL:');
    if (thirdCellInfo.exists) {
        await page.evaluate(() => {
            const cells = document.querySelectorAll('.quantum-cell');
            const thirdCell = cells[2];
            const runBtn = thirdCell.querySelector('.btn, button');
            if (runBtn && runBtn.textContent.includes('Run')) {
                runBtn.click();
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const renderCheck = await page.evaluate(() => {
            const cells = document.querySelectorAll('.quantum-cell');
            const thirdCell = cells[2];
            const output = thirdCell.querySelector('.cell-output');
            
            if (!output || output.style.display === 'none') {
                return { visible: false };
            }
            
            const svg = output.querySelector('svg');
            const error = output.querySelector('.output-error, .error');
            
            return {
                visible: true,
                hasSVG: !!svg,
                svgWidth: svg ? svg.getAttribute('width') || svg.getBBox().width : 0,
                svgHeight: svg ? svg.getAttribute('height') || svg.getBBox().height : 0,
                hasError: !!error,
                errorText: error ? error.textContent : null,
                outputHTML: output.innerHTML.substring(0, 200)
            };
        });
        
        console.log('   Output visible:', renderCheck.visible ? '✓' : '✗');
        if (renderCheck.visible) {
            console.log('   SVG rendered:', renderCheck.hasSVG ? '✓' : '✗');
            if (renderCheck.hasSVG) {
                console.log('   SVG dimensions:', renderCheck.svgWidth, 'x', renderCheck.svgHeight);
            }
            console.log('   Has error:', renderCheck.hasError ? '✓' : '✗');
            if (renderCheck.hasError) {
                console.log('   Error:', renderCheck.errorText);
            }
        }
        
        await page.screenshot({ path: 'mermaid-2-rendered.png', fullPage: true });
        console.log('   Screenshot: mermaid-2-rendered.png');
    }
    
    // Test 3: Check header badges and buttons
    console.log('\n3. HEADER CHECK:');
    const headerInfo = await page.evaluate(() => {
        const header = document.querySelector('.notepad-header, header');
        const badges = Array.from(header.querySelectorAll('.status-indicator, [class*="badge"]'));
        const buttons = Array.from(header.querySelectorAll('.btn, button'));
        
        return {
            badges: badges.map(b => b.textContent.trim()),
            buttons: buttons.map(b => b.textContent.trim()),
            hasCharmVisual: badges.some(b => b.textContent.includes('Charm')),
            hasMermaid: badges.some(b => b.textContent.includes('Mermaid')),
            hasInfiniteScroll: badges.some(b => b.textContent.includes('Infinite')),
            hasCodeButton: buttons.some(b => b.textContent.includes('+ Code') || b.textContent.includes('+Code')),
            hasDiagramButton: buttons.some(b => b.textContent.includes('+ Diagram') || b.textContent.includes('+Diagram'))
        };
    });
    
    console.log('   Status badges:', headerInfo.badges.join(', '));
    console.log('   "Charm Visual":', headerInfo.hasCharmVisual ? '✓' : '✗');
    console.log('   "Mermaid":', headerInfo.hasMermaid ? '✓' : '✗');
    console.log('   "Infinite Scroll":', headerInfo.hasInfiniteScroll ? '✓' : '✗');
    console.log('   Buttons:', headerInfo.buttons.join(', '));
    console.log('   "+ Code" button:', headerInfo.hasCodeButton ? '✓' : '✗');
    console.log('   "+ Diagram" button:', headerInfo.hasDiagramButton ? '✓' : '✗');
    
    await page.screenshot({ path: 'mermaid-3-header.png', fullPage: true });
    console.log('   Screenshot: mermaid-3-header.png');
    
    // Test 4: Click "+ Diagram"
    console.log('\n4. ADDING NEW DIAGRAM CELL:');
    const initialCellCount = await page.$$eval('.quantum-cell', cells => cells.length);
    console.log('   Initial cell count:', initialCellCount);
    
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const diagramBtn = buttons.find(b => 
            b.textContent.includes('+ Diagram') || 
            b.textContent.includes('+Diagram') ||
            b.textContent.includes('Diagram')
        );
        if (diagramBtn) diagramBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newCellCheck = await page.evaluate(() => {
        const cells = document.querySelectorAll('.quantum-cell');
        const lastCell = cells[cells.length - 1];
        const textarea = lastCell.querySelector('.cell-textarea, textarea');
        const typeLabel = lastCell.querySelector('.cell-type');
        
        return {
            totalCells: cells.length,
            type: typeLabel ? typeLabel.textContent.trim() : 'unknown',
            content: textarea ? textarea.value : '',
            hasStart: textarea ? textarea.value.includes('Start') : false,
            hasDecision: textarea ? textarea.value.includes('Decision') : false,
            hasResultA: textarea ? textarea.value.includes('Result A') : false,
            hasResultB: textarea ? textarea.value.includes('Result B') : false
        };
    });
    
    console.log('   New cell count:', newCellCheck.totalCells);
    console.log('   Cell added:', newCellCheck.totalCells > initialCellCount ? '✓' : '✗');
    console.log('   New cell type:', newCellCheck.type);
    console.log('   Has "Start":', newCellCheck.hasStart ? '✓' : '✗');
    console.log('   Has "Decision":', newCellCheck.hasDecision ? '✓' : '✗');
    console.log('   Has "Result A":', newCellCheck.hasResultA ? '✓' : '✗');
    console.log('   Has "Result B":', newCellCheck.hasResultB ? '✓' : '✗');
    
    await page.screenshot({ path: 'mermaid-4-new-diagram.png', fullPage: true });
    console.log('   Screenshot: mermaid-4-new-diagram.png');
    
    // Test 5: Check Inspect table
    console.log('\n5. INSPECT TABLE CHECK:');
    
    // Click Inspect
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const inspectBtn = buttons.find(b => b.textContent.includes('🔍') || b.textContent.includes('Inspect'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Scroll to comparison table
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        if (panel) {
            const heading = Array.from(panel.querySelectorAll('h1, h2, h3, h4')).find(h => 
                h.textContent.toLowerCase().includes('trade-off') || 
                h.textContent.toLowerCase().includes('competitor')
            );
            if (heading) {
                heading.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tableCheck = await page.evaluate(() => {
        const scorecard = document.querySelector('.scorecard, [class*="score"]');
        const table = document.querySelector('table');
        
        if (!table) return { exists: false };
        
        const rows = Array.from(table.querySelectorAll('tr'));
        const capabilities = rows.slice(1).map(r => {
            const firstCell = r.querySelector('td');
            return firstCell ? firstCell.textContent.trim() : '';
        }).filter(c => c);
        
        return {
            exists: true,
            hasScorecard: !!scorecard,
            scorecardText: scorecard ? scorecard.textContent : null,
            has11Wins: scorecard ? scorecard.textContent.includes('11') : false,
            capabilities: capabilities,
            hasTerminalCharting: capabilities.some(c => c.toLowerCase().includes('terminal') && c.toLowerCase().includes('chart')),
            hasInBrowserDiagrams: capabilities.some(c => c.toLowerCase().includes('browser') && c.toLowerCase().includes('diagram')),
            charmGPU: capabilities.find(c => c.toLowerCase().includes('terminal') && c.toLowerCase().includes('chart')),
            mermaidNative: capabilities.find(c => c.toLowerCase().includes('browser') && c.toLowerCase().includes('diagram'))
        };
    });
    
    if (tableCheck.exists) {
        console.log('   ✓ Table found');
        console.log('   Scorecard:', tableCheck.hasScorecard ? '✓' : '✗');
        if (tableCheck.scorecardText) {
            console.log('   Scorecard text:', tableCheck.scorecardText.substring(0, 100));
        }
        console.log('   Shows "11 Outright wins":', tableCheck.has11Wins ? '✓' : '✗');
        console.log('   Has "Terminal charting" row:', tableCheck.hasTerminalCharting ? '✓' : '✗');
        console.log('   Has "In-browser diagrams" row:', tableCheck.hasInBrowserDiagrams ? '✓' : '✗');
        
        if (tableCheck.charmGPU) {
            console.log('   Terminal charting capability:', tableCheck.charmGPU);
        }
        if (tableCheck.mermaidNative) {
            console.log('   In-browser diagrams capability:', tableCheck.mermaidNative);
        }
    } else {
        console.log('   ✗ Table NOT FOUND');
    }
    
    await page.screenshot({ path: 'mermaid-5-inspect-table.png', fullPage: true });
    console.log('   Screenshot: mermaid-5-inspect-table.png');
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Total page errors:', errors.length);
    
    await browser.close();
}

testMermaidFeatures().catch(console.error);
