// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function captureFullPanel() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 3000, deviceScaleFactor: 1.5 });
    
    console.log('Opening page and inspect panel...');
    
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
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take full page screenshot
    await page.screenshot({ path: 'full-panel.png', fullPage: true });
    console.log('Screenshot saved: full-panel.png');
    
    await browser.close();
}

captureFullPanel().catch(console.error);
