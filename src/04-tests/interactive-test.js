// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Interactive testing script for Quantum Notepad
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testQuantumNotepad() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== QUANTUM NOTEPAD INTERACTIVE TEST ===\n');
    await page.goto('http://localhost:8082/quantum-notepad.html', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('--- INITIAL STATE INSPECTION ---\n');
    
    // 1. CHECK HEADER
    console.log('1. HEADER INSPECTION:');
    const headerInfo = await page.evaluate(() => {
        const header = document.querySelector('.notepad-header');
        const title = document.querySelector('.notepad-title');
        const statusIndicators = document.querySelectorAll('.status-indicator');
        const buttons = header.querySelectorAll('.btn');
        
        return {
            header: {
                height: header.offsetHeight,
                width: header.offsetWidth,
                padding: window.getComputedStyle(header).padding
            },
            title: { text: title.textContent.trim() },
            statusCount: statusIndicators.length,
            buttons: Array.from(buttons).map(btn => btn.textContent.trim()),
            overflow: header.scrollWidth > header.offsetWidth
        };
    });
    
    console.log('   Height:', headerInfo.header.height + 'px');
    console.log('   Padding:', headerInfo.header.padding);
    console.log('   Buttons:', headerInfo.buttons.join(', '));
    console.log('   Overflow:', headerInfo.overflow ? 'YES ⚠️' : 'NO ✓');
    
    // 2. CHECK CELLS
    console.log('\n2. CELLS INSPECTION:');
    const cellsInfo = await page.evaluate(() => {
        const cells = document.querySelectorAll('.quantum-cell');
        return Array.from(cells).map(cell => {
            const header = cell.querySelector('.cell-header');
            const typeLabel = cell.querySelector('.cell-type');
            const buttons = header.querySelectorAll('.btn');
            
            return {
                type: typeLabel.textContent.trim(),
                buttonCount: buttons.length,
                buttons: Array.from(buttons).map(b => b.textContent.trim())
            };
        });
    });
    
    cellsInfo.forEach((cell, idx) => {
        console.log(`   Cell ${idx + 1} (${cell.type}):`);
        console.log(`      Buttons: ${cell.buttons.join(', ') || 'NONE ✗'}`);
    });
    
    // 3. CHECK SIDEBAR
    console.log('\n3. SIDEBAR INSPECTION:');
    const sidebarInfo = await page.evaluate(() => {
        const navButtons = document.querySelectorAll('.nav-btn');
        const cellListItems = document.querySelectorAll('.cell-list-item');
        const navGrid = document.querySelector('.quantum-nav-mini');
        
        return {
            navButtonCount: navButtons.length,
            gridGap: window.getComputedStyle(navGrid).gap,
            activeButton: Array.from(navButtons).find(b => b.classList.contains('active'))?.textContent.trim(),
            cellListItems: Array.from(cellListItems).map(item => item.textContent.trim())
        };
    });
    
    console.log('   Nav buttons:', sidebarInfo.navButtonCount);
    console.log('   Grid gap:', sidebarInfo.gridGap);
    console.log('   Active:', sidebarInfo.activeButton);
    console.log('   Cell list:');
    sidebarInfo.cellListItems.forEach(item => {
        console.log(`      - ${item}`);
        if (item.includes('Line —')) console.log('        ⚠️  Placeholder text');
    });
    
    await page.screenshot({ path: 'test-1-initial.png', fullPage: true });
    console.log('\n   Screenshot: test-1-initial.png');
    
    // 4. ADD CELL
    console.log('\n4. ADDING NEW CELL:');
    await page.click('#add-cell-btn');
    await new Promise(resolve => setTimeout(resolve, 500));
    const newCount = await page.$$eval('.quantum-cell', cells => cells.length);
    console.log('   Total cells:', newCount);
    await page.screenshot({ path: 'test-2-after-add-cell.png', fullPage: true });
    console.log('   Screenshot: test-2-after-add-cell.png');
    
    // 5. RUN FIRST CELL
    console.log('\n5. RUNNING FIRST CELL:');
    await page.click('.quantum-cell .btn');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const hasOutput = await page.$eval('.quantum-cell .cell-output', el => el.style.display !== 'none');
    console.log('   Output visible:', hasOutput ? 'YES ✓' : 'NO ✗');
    await page.screenshot({ path: 'test-3-after-run-cell.png', fullPage: true });
    console.log('   Screenshot: test-3-after-run-cell.png');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testQuantumNotepad().catch(console.error);
