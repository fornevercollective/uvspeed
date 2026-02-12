// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function testSOWBottom() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING SOW BOTTOM SECTIONS ===\n');
    
    await page.goto('http://localhost:8084/web/quantum-notepad.html', { 
        waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open inspect
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const inspectBtn = buttons.find(b => b.textContent.includes('🔍'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get full content height and scroll multiple times
    const scrollInfo = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const content = panel.querySelector('[class*="content"]') || panel;
        return {
            scrollHeight: content.scrollHeight,
            clientHeight: content.clientHeight,
            initialScroll: content.scrollTop
        };
    });
    
    console.log('Panel dimensions:');
    console.log('  Scroll height:', scrollInfo.scrollHeight);
    console.log('  Client height:', scrollInfo.clientHeight);
    console.log('  Scrollable distance:', scrollInfo.scrollHeight - scrollInfo.clientHeight);
    
    // Scroll to absolute bottom
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const content = panel.querySelector('[class*="content"]') || panel;
        content.scrollTop = content.scrollHeight;
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take screenshot of bottom
    await page.screenshot({ path: 'sow-bottom-1.png', fullPage: false });
    console.log('\nScreenshot 1: sow-bottom-1.png (bottom of panel)');
    
    // Check what's at the bottom
    const bottomContent = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const content = panel.querySelector('[class*="content"]') || panel;
        
        // Get all headings
        const allHeadings = Array.from(panel.querySelectorAll('h1, h2, h3, h4'));
        const headingTexts = allHeadings.map(h => h.textContent.trim());
        
        // Get last few sections
        const lastSections = allHeadings.slice(-5).map(h => ({
            text: h.textContent.trim(),
            tagName: h.tagName
        }));
        
        // Look for SOW specifically
        const sowHeading = allHeadings.find(h => h.textContent.includes('STATEMENT OF WORK'));
        const benchmarkHeading = allHeadings.find(h => h.textContent.includes('BENCHMARK'));
        
        // Get all text content from bottom 2000px
        const allElements = Array.from(panel.querySelectorAll('*'));
        const bottomElements = allElements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.top > -2000; // Elements in view or near bottom
        });
        
        const bottomText = bottomElements.map(el => el.textContent).join(' ').substring(0, 1000);
        
        return {
            totalHeadings: allHeadings.length,
            headingTexts: headingTexts,
            lastSections: lastSections,
            hasSOW: !!sowHeading,
            hasBenchmark: !!benchmarkHeading,
            bottomText: bottomText,
            currentScroll: content.scrollTop,
            maxScroll: content.scrollHeight - content.clientHeight
        };
    });
    
    console.log('\nContent analysis:');
    console.log('  Total headings:', bottomContent.totalHeadings);
    console.log('  Current scroll position:', bottomContent.currentScroll);
    console.log('  Max scroll:', bottomContent.maxScroll);
    console.log('  Has SOW heading:', bottomContent.hasSOW ? '✓' : '✗');
    console.log('  Has Benchmark heading:', bottomContent.hasBenchmark ? '✓' : '✗');
    
    console.log('\nLast 5 section headings:');
    bottomContent.lastSections.forEach((section, idx) => {
        console.log(`  ${idx + 1}. ${section.text}`);
    });
    
    console.log('\nAll headings in panel:');
    bottomContent.headingTexts.forEach((heading, idx) => {
        console.log(`  ${idx + 1}. ${heading.substring(0, 80)}`);
    });
    
    // Scroll up a bit to see if SOW is just above
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const content = panel.querySelector('[class*="content"]') || panel;
        content.scrollTop -= 400;
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'sow-bottom-2.png', fullPage: false });
    console.log('\nScreenshot 2: sow-bottom-2.png (scrolled up 400px)');
    
    // Scroll up more
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const content = panel.querySelector('[class*="content"]') || panel;
        content.scrollTop -= 600;
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'sow-bottom-3.png', fullPage: false });
    console.log('Screenshot 3: sow-bottom-3.png (scrolled up 1000px total)');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testSOWBottom().catch(console.error);
