// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function testInspectPanel() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING INSPECT PANEL FEATURE ===\n');
    
    // Navigate with hard reload
    await page.goto('http://localhost:8082/quantum-notepad.html', { 
        waitUntil: 'networkidle0'
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('1. CHECKING FOR INSPECT BUTTON:');
    const inspectButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn'));
        const inspectBtn = buttons.find(btn => btn.textContent.includes('🔍') || btn.textContent.includes('Inspect'));
        return inspectBtn ? {
            exists: true,
            text: inspectBtn.textContent.trim(),
            id: inspectBtn.id,
            visible: inspectBtn.offsetParent !== null
        } : { exists: false };
    });
    
    if (inspectButton.exists) {
        console.log('   ✓ Inspect button found!');
        console.log('   Text:', inspectButton.text);
        console.log('   Visible:', inspectButton.visible ? 'YES' : 'NO');
    } else {
        console.log('   ✗ Inspect button NOT FOUND');
    }
    
    await page.screenshot({ path: 'inspect-1-main-page.png', fullPage: true });
    console.log('   Screenshot: inspect-1-main-page.png\n');
    
    if (!inspectButton.exists) {
        console.log('Cannot proceed - Inspect button not found');
        await browser.close();
        return;
    }
    
    console.log('2. CLICKING INSPECT BUTTON:');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn'));
        const inspectBtn = buttons.find(btn => btn.textContent.includes('🔍') || btn.textContent.includes('Inspect'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const panelInfo = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel') || document.querySelector('[class*="inspect"]') || document.querySelector('.modal');
        const overlay = document.querySelector('.inspect-overlay') || document.querySelector('[class*="overlay"]');
        
        if (!panel) return { exists: false };
        
        const title = panel.querySelector('h2, h1, .title, [class*="title"]');
        
        return {
            exists: true,
            visible: panel.offsetParent !== null,
            title: title ? title.textContent.trim() : 'No title found',
            width: panel.offsetWidth,
            height: panel.offsetHeight,
            hasOverlay: !!overlay,
            overlayVisible: overlay ? overlay.offsetParent !== null : false
        };
    });
    
    if (panelInfo.exists) {
        console.log('   ✓ Panel opened!');
        console.log('   Title:', panelInfo.title);
        console.log('   Dimensions:', panelInfo.width + 'x' + panelInfo.height + 'px');
        console.log('   Has overlay:', panelInfo.hasOverlay ? 'YES' : 'NO');
    } else {
        console.log('   ✗ Panel did NOT open');
    }
    
    await page.screenshot({ path: 'inspect-2-panel-opened.png', fullPage: true });
    console.log('   Screenshot: inspect-2-panel-opened.png\n');
    
    console.log('3. CHECKING PANEL SECTIONS:');
    const sections = await page.evaluate(() => {
        const findSection = (keywords) => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .section-title, [class*="title"]'));
            return headings.find(h => keywords.some(k => h.textContent.toLowerCase().includes(k.toLowerCase())));
        };
        
        return {
            hardLimits: {
                exists: !!findSection(['Hard Limits', 'Limits']),
                title: findSection(['Hard Limits', 'Limits'])?.textContent.trim()
            },
            bestFor: {
                exists: !!findSection(['Best For']),
                title: findSection(['Best For'])?.textContent.trim()
            },
            keyAdvantages: {
                exists: !!findSection(['Key Advantages', 'Advantages']),
                title: findSection(['Key Advantages', 'Advantages'])?.textContent.trim()
            }
        };
    });
    
    console.log('   Hard Limits section:', sections.hardLimits.exists ? '✓ Found' : '✗ Not found');
    console.log('   Best For section:', sections.bestFor.exists ? '✓ Found' : '✗ Not found');
    console.log('   Key Advantages section:', sections.keyAdvantages.exists ? '✓ Found' : '✗ Not found');
    
    const cards = await page.evaluate(() => {
        const cardElements = document.querySelectorAll('.limit-card, .card, [class*="card"]');
        return Array.from(cardElements).slice(0, 10).map(card => ({
            text: card.textContent.trim().substring(0, 50),
            width: card.offsetWidth,
            height: card.offsetHeight
        }));
    });
    
    if (cards.length > 0) {
        console.log('   Found', cards.length, 'cards');
        console.log('   Sample cards:', cards.slice(0, 3).map(c => c.text).join(', '));
    }
    
    console.log('\n4. SCROLLING IN PANEL:');
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel') || document.querySelector('[class*="inspect"]') || document.querySelector('.modal');
        if (panel) {
            const scrollable = panel.querySelector('[class*="content"]') || panel;
            scrollable.scrollTop = scrollable.scrollHeight / 2;
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const tradeOffs = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        const tradeOffHeading = headings.find(h => h.textContent.toLowerCase().includes('trade-off'));
        return {
            exists: !!tradeOffHeading,
            title: tradeOffHeading ? tradeOffHeading.textContent.trim() : null
        };
    });
    
    console.log('   Trade-Offs section:', tradeOffs.exists ? '✓ Found' : '✗ Not found');
    if (tradeOffs.title) console.log('   Title:', tradeOffs.title);
    
    await page.screenshot({ path: 'inspect-3-scrolled.png', fullPage: true });
    console.log('   Screenshot: inspect-3-scrolled.png\n');
    
    console.log('5. CHECKING COMPARISON TABLE:');
    const tableInfo = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        if (tables.length === 0) return { exists: false };
        
        const table = tables[0];
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const rowCount = table.querySelectorAll('tr').length;
        
        return {
            exists: true,
            columnCount: headers.length,
            rowCount: rowCount,
            headers: headers,
            width: table.offsetWidth,
            scrollWidth: table.scrollWidth,
            hasOverflow: table.scrollWidth > table.offsetWidth
        };
    });
    
    if (tableInfo.exists) {
        console.log('   ✓ Table found!');
        console.log('   Columns:', tableInfo.columnCount);
        console.log('   Rows:', tableInfo.rowCount);
        console.log('   Headers:', tableInfo.headers.slice(0, 5).join(', '), '...');
        console.log('   Overflow:', tableInfo.hasOverflow ? 'YES (needs scroll)' : 'NO');
    } else {
        console.log('   ✗ Table NOT found');
    }
    
    await page.screenshot({ path: 'inspect-4-table-view.png', fullPage: true });
    console.log('   Screenshot: inspect-4-table-view.png\n');
    
    console.log('6. CLOSING PANEL:');
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const panelClosed = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel') || document.querySelector('[class*="inspect"]') || document.querySelector('.modal');
        return !panel || panel.offsetParent === null || window.getComputedStyle(panel).display === 'none';
    });
    
    console.log('   Panel closed:', panelClosed ? '✓ YES' : '✗ NO (still visible)');
    
    await page.screenshot({ path: 'inspect-5-panel-closed.png', fullPage: true });
    console.log('   Screenshot: inspect-5-panel-closed.png\n');
    
    console.log('=== TEST COMPLETE ===');
    await browser.close();
}

testInspectPanel().catch(console.error);
