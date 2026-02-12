// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function testPrefixAndRoadmap() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 3500, deviceScaleFactor: 1.5 });
    
    console.log('=== TESTING PREFIX & ROADMAP SECTIONS ===\n');
    
    await page.goto('http://localhost:8084/web/quantum-notepad.html', { 
        waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open inspect
    console.log('1. Opening Inspect Panel...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const inspectBtn = buttons.find(b => b.textContent.includes('🔍'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✓ Panel opened\n');
    
    // Get all section headings
    const allHeadings = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const headings = Array.from(panel.querySelectorAll('h1, h2, h3, h4'));
        return headings.map(h => h.textContent.trim());
    });
    
    console.log('All section headings found:');
    allHeadings.forEach((h, idx) => console.log(`  ${idx + 1}. ${h}`));
    console.log('');
    
    // Check for PREFIX section
    console.log('2. PREFIX EVERYTHING SECTION:');
    const prefixInfo = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const headings = Array.from(panel.querySelectorAll('h1, h2, h3, h4'));
        const prefixHeading = headings.find(h => 
            h.textContent.includes('PREFIX EVERYTHING') || 
            h.textContent.includes('QUANTUM WEIGHTING')
        );
        
        if (!prefixHeading) return { exists: false };
        
        const section = prefixHeading.closest('section, div[class*="section"]') || prefixHeading.parentElement;
        const text = section.textContent;
        
        // Look for code demo
        const codeBlock = section.querySelector('pre, code, [class*="code"], [class*="demo"]');
        const hasHTML = text.includes('DOCTYPE') || text.includes('<!DOCTYPE');
        const hasN = text.includes('n:');
        const hasPlus1 = text.includes('+1:');
        const hasMinusN = text.includes('-n:');
        const hasPlus0 = text.includes('+0:');
        
        // Look for language tags
        const tags = Array.from(section.querySelectorAll('[class*="tag"], [class*="pill"], [class*="badge"]'));
        const tagTexts = tags.map(t => t.textContent.trim());
        
        return {
            exists: true,
            title: prefixHeading.textContent.trim(),
            hasCodeBlock: !!codeBlock,
            codeContent: codeBlock ? codeBlock.textContent.substring(0, 200) : null,
            hasHTML: hasHTML,
            hasPrefixes: hasN && hasPlus1 && hasMinusN && hasPlus0,
            tagCount: tags.length,
            tags: tagTexts,
            hasHTMLCSS: tagTexts.some(t => t.includes('HTML') || t.includes('CSS')),
            hasPython: tagTexts.some(t => t.includes('Python')),
            hasYAML: tagTexts.some(t => t.includes('YAML')),
            hasDocker: tagTexts.some(t => t.includes('Docker'))
        };
    });
    
    if (prefixInfo.exists) {
        console.log('   ✓ Section found');
        console.log('   Title:', prefixInfo.title);
        console.log('   Has code block:', prefixInfo.hasCodeBlock ? '✓' : '✗');
        console.log('   Has HTML demo:', prefixInfo.hasHTML ? '✓' : '✗');
        console.log('   Has quantum prefixes:', prefixInfo.hasPrefixes ? '✓' : '✗');
        console.log('   Tag count:', prefixInfo.tagCount);
        console.log('   Language tags:');
        console.log('     HTML/CSS/JS:', prefixInfo.hasHTMLCSS ? '✓' : '✗');
        console.log('     Python:', prefixInfo.hasPython ? '✓' : '✗');
        console.log('     YAML:', prefixInfo.hasYAML ? '✓' : '✗');
        console.log('     Docker:', prefixInfo.hasDocker ? '✓' : '✗');
        if (prefixInfo.codeContent) {
            console.log('   Code preview:', prefixInfo.codeContent.substring(0, 80) + '...');
        }
    } else {
        console.log('   ✗ Section NOT FOUND');
    }
    
    // Check for ROADMAP section
    console.log('\n3. UPGRADE ENHANCEMENT ROADMAP SECTION:');
    const roadmapInfo = await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        const headings = Array.from(panel.querySelectorAll('h1, h2, h3, h4'));
        const roadmapHeading = headings.find(h => 
            h.textContent.includes('UPGRADE') && h.textContent.includes('ROADMAP')
        );
        
        if (!roadmapHeading) return { exists: false };
        
        const section = roadmapHeading.closest('section, div[class*="section"]') || roadmapHeading.parentElement;
        
        // Find plan cards
        const cards = Array.from(section.querySelectorAll('[class*="card"], [class*="plan"]'));
        const cardInfo = cards.map(card => {
            const header = card.querySelector('[class*="header"], h3, h4');
            const body = card.querySelector('[class*="body"]');
            const footer = card.querySelector('[class*="footer"]');
            const tags = Array.from(card.querySelectorAll('[class*="tag"], [class*="pill"]'));
            
            return {
                title: header ? header.textContent.trim() : 'No title',
                hasEmoji: header ? /[\u{1F300}-\u{1F9FF}]/u.test(header.textContent) : false,
                hasBody: !!body,
                hasFooter: !!footer,
                tagCount: tags.length,
                isWide: card.offsetWidth > 600 // Check if it's a wide card
            };
        });
        
        const text = section.textContent;
        
        return {
            exists: true,
            title: roadmapHeading.textContent.trim(),
            cardCount: cards.length,
            cards: cardInfo,
            hasVisualization: text.includes('Visualization'),
            hasCodeExecution: text.includes('Code Execution'),
            hasQuantumHardware: text.includes('Quantum Hardware'),
            hasGPU: text.includes('GPU') || text.includes('TPU'),
            hasStorage: text.includes('Storage!'),
            hasCollab: text.includes('Collab') && text.includes('kognise'),
            hasPing: text.includes('Ping') || text.includes('Chat'),
            hasScraper: text.includes('Scraper')
        };
    });
    
    if (roadmapInfo.exists) {
        console.log('   ✓ Section found');
        console.log('   Title:', roadmapInfo.title);
        console.log('   Cards found:', roadmapInfo.cardCount);
        console.log('   Expected cards:');
        console.log('     📊 Visualization:', roadmapInfo.hasVisualization ? '✓' : '✗');
        console.log('     ⚡ Code Execution:', roadmapInfo.hasCodeExecution ? '✓' : '✗');
        console.log('     🌌 Quantum Hardware:', roadmapInfo.hasQuantumHardware ? '✓' : '✗');
        console.log('     🔥 GPU/TPU:', roadmapInfo.hasGPU ? '✓' : '✗');
        console.log('     💾 Storage!:', roadmapInfo.hasStorage ? '✓' : '✗');
        console.log('     👥 Collab (kognise):', roadmapInfo.hasCollab ? '✓' : '✗');
        console.log('     📡 Ping/Chat:', roadmapInfo.hasPing ? '✓' : '✗');
        console.log('     🌐 Scraper:', roadmapInfo.hasScraper ? '✓' : '✗');
        
        if (roadmapInfo.cards.length > 0) {
            console.log('\n   Card details:');
            roadmapInfo.cards.forEach((card, idx) => {
                console.log(`   ${idx + 1}. ${card.title}`);
                console.log(`      Emoji: ${card.hasEmoji ? '✓' : '✗'}`);
                console.log(`      Body: ${card.hasBody ? '✓' : '✗'}`);
                console.log(`      Footer: ${card.hasFooter ? '✓' : '✗'}`);
                console.log(`      Tags: ${card.tagCount}`);
                console.log(`      Wide card: ${card.isWide ? '✓' : '✗'}`);
            });
        }
    } else {
        console.log('   ✗ Section NOT FOUND');
    }
    
    // Take full screenshot
    await page.screenshot({ path: 'prefix-roadmap-full.png', fullPage: true });
    console.log('\n   Screenshot: prefix-roadmap-full.png');
    
    console.log('\n=== TEST COMPLETE ===');
    await browser.close();
}

testPrefixAndRoadmap().catch(console.error);
