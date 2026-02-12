const puppeteer = require('puppeteer');

async function testGitHubPages() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING GITHUB PAGES DEPLOYMENT ===\n');
    
    // Collect console messages
    const consoleMessages = [];
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push({ type: msg.type(), text: text });
        
        if (msg.type() === 'error') {
            errors.push(text);
        } else if (msg.type() === 'warning') {
            warnings.push(text);
        }
    });
    
    page.on('pageerror', error => {
        errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
        errors.push(`FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('1. LOADING PAGE:');
    console.log('   URL: https://fornevercollective.github.io/uvspeed/web/quantum-notepad.html');
    
    try {
        await page.goto('https://fornevercollective.github.io/uvspeed/web/quantum-notepad.html', { 
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        console.log('   ✓ Page loaded\n');
    } catch (error) {
        console.log('   ✗ Page failed to load:', error.message, '\n');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'github-pages-screenshot.png', fullPage: true });
    console.log('2. SCREENSHOT: github-pages-screenshot.png\n');
    
    // Check for errors
    console.log('3. CONSOLE ERRORS:');
    if (errors.length > 0) {
        console.log(`   Found ${errors.length} error(s):`);
        errors.forEach((err, idx) => {
            console.log(`   ${idx + 1}. ${err}`);
        });
    } else {
        console.log('   ✓ No errors detected');
    }
    console.log('');
    
    // Check for warnings
    console.log('4. CONSOLE WARNINGS:');
    if (warnings.length > 0) {
        console.log(`   Found ${warnings.length} warning(s):`);
        warnings.forEach((warn, idx) => {
            console.log(`   ${idx + 1}. ${warn.substring(0, 100)}`);
        });
    } else {
        console.log('   ✓ No warnings');
    }
    console.log('');
    
    // Check page structure
    console.log('5. PAGE STRUCTURE CHECK:');
    const structure = await page.evaluate(() => {
        return {
            hasHeader: !!document.querySelector('.notepad-header, header'),
            hasTitle: !!document.querySelector('.notepad-title'),
            hasCells: !!document.querySelector('.quantum-cell'),
            cellCount: document.querySelectorAll('.quantum-cell').length,
            hasSidebar: !!document.querySelector('.quantum-sidebar'),
            hasFooter: !!document.querySelector('footer, .footer'),
            hasNavigation: !!document.querySelector('.quantum-nav-mini'),
            hasCellList: !!document.querySelector('.cell-list'),
            hasButtons: document.querySelectorAll('button, .btn').length,
            bodyContent: document.body.textContent.substring(0, 200),
            hasErrorMessage: document.body.textContent.includes('404') || 
                           document.body.textContent.includes('Not Found') ||
                           document.body.textContent.includes('error')
        };
    });
    
    console.log('   Header:', structure.hasHeader ? '✓' : '✗ MISSING');
    console.log('   Title:', structure.hasTitle ? '✓' : '✗ MISSING');
    console.log('   Cells:', structure.hasCells ? `✓ (${structure.cellCount} found)` : '✗ MISSING');
    console.log('   Sidebar:', structure.hasSidebar ? '✓' : '✗ MISSING');
    console.log('   Footer:', structure.hasFooter ? '✓' : '✗ MISSING');
    console.log('   Navigation:', structure.hasNavigation ? '✓' : '✗ MISSING');
    console.log('   Cell List:', structure.hasCellList ? '✓' : '✗ MISSING');
    console.log('   Buttons:', structure.hasButtons);
    console.log('   Has error message:', structure.hasErrorMessage ? '⚠️ YES' : 'No');
    
    if (structure.bodyContent) {
        console.log('\n   Page content preview:');
        console.log('   ', structure.bodyContent.substring(0, 150));
    }
    
    // Check specific elements
    console.log('\n6. DETAILED ELEMENT CHECK:');
    const elements = await page.evaluate(() => {
        const getElement = (selector) => {
            const el = document.querySelector(selector);
            return el ? {
                exists: true,
                visible: el.offsetParent !== null,
                text: el.textContent.substring(0, 50)
            } : { exists: false };
        };
        
        return {
            header: getElement('.notepad-header'),
            addCellBtn: getElement('#add-cell-btn, button[class*="add"]'),
            runAllBtn: getElement('#run-all-btn'),
            inspectBtn: getElement('button:has(🔍), [class*="inspect"]'),
            cellsContainer: getElement('.cells-container'),
            positionDisplay: getElement('#position-display'),
            performanceSection: getElement('[class*="performance"]')
        };
    });
    
    Object.entries(elements).forEach(([key, value]) => {
        if (value.exists) {
            console.log(`   ${key}: ✓ (visible: ${value.visible ? 'yes' : 'no'})`);
        } else {
            console.log(`   ${key}: ✗ MISSING`);
        }
    });
    
    // Check for CSS loading
    console.log('\n7. CSS/STYLING CHECK:');
    const styling = await page.evaluate(() => {
        const body = document.body;
        const header = document.querySelector('.notepad-header, header');
        
        return {
            bodyBg: window.getComputedStyle(body).backgroundColor,
            bodyColor: window.getComputedStyle(body).color,
            headerBg: header ? window.getComputedStyle(header).backgroundColor : 'N/A',
            hasStyles: window.getComputedStyle(body).backgroundColor !== 'rgba(0, 0, 0, 0)'
        };
    });
    
    console.log('   Styles loaded:', styling.hasStyles ? '✓' : '✗ MISSING');
    console.log('   Body background:', styling.bodyBg);
    console.log('   Body color:', styling.bodyColor);
    console.log('   Header background:', styling.headerBg);
    
    console.log('\n=== TEST COMPLETE ===');
    
    // Summary
    console.log('\nSUMMARY:');
    console.log('  Errors:', errors.length);
    console.log('  Warnings:', warnings.length);
    console.log('  Main interface renders:', structure.hasHeader && structure.hasCells ? 'YES ✓' : 'NO ✗');
    
    await browser.close();
}

testGitHubPages().catch(console.error);
