// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function verifyFixes() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== VERIFYING QUANTUM NOTEPAD FIXES ===\n');
    
    // Hard reload to get fresh version
    await page.goto('http://localhost:8082/quantum-notepad.html', { 
        waitUntil: 'networkidle0',
        timeout: 10000
    });
    
    // Force reload
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('1. HEADER HEIGHT CHECK:');
    const headerCheck = await page.evaluate(() => {
        const header = document.querySelector('.notepad-header');
        return {
            height: header.offsetHeight,
            padding: window.getComputedStyle(header).padding,
            paddingTop: window.getComputedStyle(header).paddingTop,
            paddingBottom: window.getComputedStyle(header).paddingBottom
        };
    });
    console.log('   Height:', headerCheck.height + 'px', headerCheck.height >= 52 ? '✓' : '✗');
    console.log('   Padding:', headerCheck.padding);
    
    console.log('\n2. CELL BUTTONS CHECK:');
    const cellsCheck = await page.evaluate(() => {
        const cells = document.querySelectorAll('.quantum-cell');
        return Array.from(cells).map((cell, idx) => {
            const header = cell.querySelector('.cell-header');
            const type = cell.querySelector('.cell-type').textContent.trim();
            const buttons = header.querySelectorAll('.btn');
            return {
                index: idx + 1,
                type: type,
                buttonCount: buttons.length,
                buttonTexts: Array.from(buttons).map(b => b.textContent.trim()),
                hasRun: Array.from(buttons).some(b => b.textContent.includes('Run')),
                hasDelete: Array.from(buttons).some(b => b.textContent.includes('🗑'))
            };
        });
    });
    
    cellsCheck.forEach(cell => {
        console.log(`   Cell ${cell.index} (${cell.type}):`);
        console.log(`      Run button: ${cell.hasRun ? '✓' : '✗ MISSING'}`);
        console.log(`      Delete button: ${cell.hasDelete ? '✓' : '✗ MISSING'}`);
        console.log(`      Buttons: ${cell.buttonTexts.join(', ')}`);
    });
    
    console.log('\n3. SIDEBAR CELL LIST CHECK:');
    const sidebarCheck = await page.evaluate(() => {
        const items = document.querySelectorAll('.cell-list-item');
        return Array.from(items).map(item => ({
            text: item.textContent.trim(),
            hasPlaceholder: item.textContent.includes('Line —'),
            hasPreview: item.textContent.includes('🌌') || item.textContent.includes('#')
        }));
    });
    
    sidebarCheck.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}: ${item.text.substring(0, 50)}...`);
        if (item.hasPlaceholder) {
            console.log('      ✗ Still shows "Line —" placeholder');
        } else if (item.hasPreview) {
            console.log('      ✓ Shows content preview');
        }
    });
    
    console.log('\n4. QUANTUM NAVIGATION GRID CHECK:');
    const navCheck = await page.evaluate(() => {
        const grid = document.querySelector('.quantum-nav-mini');
        const gridStyle = window.getComputedStyle(grid);
        return {
            gap: gridStyle.gap,
            background: gridStyle.background,
            padding: gridStyle.padding,
            border: gridStyle.border
        };
    });
    console.log('   Grid gap:', navCheck.gap);
    console.log('   Background:', navCheck.background !== 'rgba(0, 0, 0, 0)' ? '✓ Has background' : '✗ Transparent');
    console.log('   Padding:', navCheck.padding);
    
    await page.screenshot({ path: 'verify-1-initial.png', fullPage: true });
    console.log('\n   Screenshot saved: verify-1-initial.png');
    
    console.log('\n5. RUNNING FIRST CELL (MARKDOWN):');
    const firstRunBtn = await page.$('.quantum-cell .btn');
    if (firstRunBtn) {
        await firstRunBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const outputCheck = await page.evaluate(() => {
            const firstCell = document.querySelector('.quantum-cell');
            const output = firstCell.querySelector('.cell-output');
            return {
                visible: output && output.style.display !== 'none',
                content: output ? output.textContent.substring(0, 100) : null,
                hasHTML: output && output.innerHTML.includes('<h1>')
            };
        });
        
        console.log('   Output visible:', outputCheck.visible ? '✓' : '✗');
        console.log('   Has HTML rendering:', outputCheck.hasHTML ? '✓' : '✗');
        if (outputCheck.content) {
            console.log('   Preview:', outputCheck.content);
        }
        
        await page.screenshot({ path: 'verify-2-after-run.png', fullPage: true });
        console.log('   Screenshot saved: verify-2-after-run.png');
    }
    
    console.log('\n6. ADDING NEW CELL:');
    await page.click('#add-cell-btn');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newCellCheck = await page.evaluate(() => {
        const cells = document.querySelectorAll('.quantum-cell');
        const lastCell = cells[cells.length - 1];
        const textarea = lastCell.querySelector('.cell-textarea');
        return {
            totalCells: cells.length,
            isEmpty: textarea && textarea.value === '',
            placeholder: textarea ? textarea.placeholder : null
        };
    });
    
    console.log('   Total cells:', newCellCheck.totalCells, newCellCheck.totalCells === 4 ? '✓' : '✗');
    console.log('   New cell empty:', newCellCheck.isEmpty ? '✓' : '✗');
    console.log('   Placeholder:', newCellCheck.placeholder);
    
    await page.screenshot({ path: 'verify-3-after-add-cell.png', fullPage: true });
    console.log('   Screenshot saved: verify-3-after-add-cell.png');
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    await browser.close();
}

verifyFixes().catch(console.error);
