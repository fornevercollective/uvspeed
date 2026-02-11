// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Simple screenshot tool using Puppeteer
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshot() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to 1400px width as requested
    await page.setViewport({
        width: 1400,
        height: 1200,
        deviceScaleFactor: 2
    });
    
    console.log('Navigating to http://localhost:8082/quantum-notepad.html...');
    await page.goto('http://localhost:8082/quantum-notepad.html', {
        waitUntil: 'networkidle0',
        timeout: 10000
    });
    
    // Wait a bit for any animations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take full page screenshot
    const screenshotPath = path.join(__dirname, 'quantum-notepad-screenshot.png');
    await page.screenshot({
        path: screenshotPath,
        fullPage: true
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Also take viewport-only screenshot
    const viewportScreenshotPath = path.join(__dirname, 'quantum-notepad-viewport.png');
    await page.screenshot({
        path: viewportScreenshotPath,
        fullPage: false
    });
    
    console.log(`Viewport screenshot saved to: ${viewportScreenshotPath}`);
    
    // Get some layout information
    const layoutInfo = await page.evaluate(() => {
        const header = document.querySelector('.notepad-header');
        const content = document.querySelector('.notepad-content');
        const cellsContainer = document.querySelector('.cells-container');
        const sidebar = document.querySelector('.quantum-sidebar');
        const cells = document.querySelectorAll('.quantum-cell');
        
        return {
            header: header ? {
                height: header.offsetHeight,
                width: header.offsetWidth,
                visible: header.offsetParent !== null
            } : null,
            content: content ? {
                height: content.offsetHeight,
                width: content.offsetWidth,
                display: window.getComputedStyle(content).display
            } : null,
            cellsContainer: cellsContainer ? {
                height: cellsContainer.offsetHeight,
                width: cellsContainer.offsetWidth,
                scrollHeight: cellsContainer.scrollHeight,
                overflow: window.getComputedStyle(cellsContainer).overflow
            } : null,
            sidebar: sidebar ? {
                height: sidebar.offsetHeight,
                width: sidebar.offsetWidth,
                visible: sidebar.offsetParent !== null
            } : null,
            cellCount: cells.length,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth,
            documentHeight: document.documentElement.scrollHeight
        };
    });
    
    console.log('\nLayout Information:');
    console.log(JSON.stringify(layoutInfo, null, 2));
    
    // Save layout info to file
    fs.writeFileSync(
        path.join(__dirname, 'layout-info.json'),
        JSON.stringify(layoutInfo, null, 2)
    );
    
    await browser.close();
    console.log('\nDone!');
}

takeScreenshot().catch(err => {
    console.error('Error taking screenshot:', err);
    process.exit(1);
});
