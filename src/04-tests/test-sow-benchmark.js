// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
const puppeteer = require('puppeteer');

async function testSOWAndBenchmark() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
    
    console.log('=== TESTING SOW & AGENT-READY BENCHMARK ===\n');
    
    await page.goto('http://localhost:8084/web/quantum-notepad.html', { 
        waitUntil: 'networkidle0',
        timeout: 15000
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('1. Opening Inspect Panel:');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.btn, button'));
        const inspectBtn = buttons.find(b => b.textContent.includes('🔍') || b.textContent.includes('Inspect'));
        if (inspectBtn) inspectBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   ✓ Inspect panel opened');
    
    // Scroll to bottom
    console.log('\n2. Scrolling to Bottom:');
    await page.evaluate(() => {
        const panel = document.querySelector('.inspect-panel, .modal');
        if (panel) {
            const content = panel.querySelector('[class*="content"]') || panel;
            content.scrollTop = content.scrollHeight;
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('   ✓ Scrolled to bottom');
    
    await page.screenshot({ path: 'sow-1-bottom-view.png', fullPage: true });
    console.log('   Screenshot: sow-1-bottom-view.png');
    
    // Check SOW Section
    console.log('\n3. STATEMENT OF WORK SECTION:');
    const sowInfo = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .section-title'));
        const sowHeading = headings.find(h => 
            h.textContent.includes('STATEMENT OF WORK') || 
            h.textContent.includes('AGENT READY')
        );
        
        if (!sowHeading) return { exists: false };
        
        const section = sowHeading.closest('section, div[class*="section"]') || sowHeading.parentElement;
        const text = section.textContent;
        
        // Find phase elements
        const phaseElements = Array.from(section.querySelectorAll('*')).filter(el => 
            el.textContent.includes('Phase 1') || 
            el.textContent.includes('Phase 2') || 
            el.textContent.includes('Phase 3') || 
            el.textContent.includes('Phase 4')
        );
        
        const phases = phaseElements.map(el => ({
            text: el.textContent.trim().substring(0, 100),
            hasComplete: el.textContent.includes('Complete'),
            hasInProgress: el.textContent.includes('In Progress'),
            hasNext: el.textContent.includes('Next'),
            hasFuture: el.textContent.includes('Future'),
            hasDot: !!el.querySelector('[class*="dot"], .status-dot, [style*="border-radius"]')
        }));
        
        // Check for timeline visual elements
        const hasTimeline = !!section.querySelector('[class*="timeline"], [class*="vertical-line"]');
        const dots = section.querySelectorAll('[class*="dot"], .status-dot, [style*="border-radius: 50"]');
        
        return {
            exists: true,
            title: sowHeading.textContent.trim(),
            phaseCount: phases.length,
            phases: phases,
            hasTimeline: hasTimeline,
            dotCount: dots.length,
            hasPhase1: text.includes('Phase 1'),
            hasPhase2: text.includes('Phase 2'),
            hasPhase3: text.includes('Phase 3'),
            hasPhase4: text.includes('Phase 4'),
            hasStructural: text.includes('Structural'),
            hasExecution: text.includes('Execution'),
            hasAgent: text.includes('Agent'),
            hasProduction: text.includes('Production')
        };
    });
    
    if (sowInfo.exists) {
        console.log('   ✓ SOW section found');
        console.log('   Title:', sowInfo.title);
        console.log('   Phase elements found:', sowInfo.phaseCount);
        console.log('   Has Phase 1 (Structural):', sowInfo.hasPhase1 && sowInfo.hasStructural ? '✓' : '✗');
        console.log('   Has Phase 2 (Execution):', sowInfo.hasPhase2 && sowInfo.hasExecution ? '✓' : '✗');
        console.log('   Has Phase 3 (Agent):', sowInfo.hasPhase3 && sowInfo.hasAgent ? '✓' : '✗');
        console.log('   Has Phase 4 (Production):', sowInfo.hasPhase4 && sowInfo.hasProduction ? '✓' : '✗');
        console.log('   Timeline visual:', sowInfo.hasTimeline ? '✓' : '✗');
        console.log('   Status dots found:', sowInfo.dotCount);
        
        if (sowInfo.phases.length > 0) {
            console.log('\n   Phase details:');
            sowInfo.phases.forEach((phase, idx) => {
                console.log(`   ${idx + 1}. ${phase.text.substring(0, 60)}...`);
                if (phase.hasComplete) console.log('      Status: Complete ✓');
                if (phase.hasInProgress) console.log('      Status: In Progress ✓');
                if (phase.hasNext) console.log('      Status: Next ✓');
                if (phase.hasFuture) console.log('      Status: Future ✓');
            });
        }
    } else {
        console.log('   ✗ SOW section NOT FOUND');
    }
    
    // Check Agent-Ready Benchmark
    console.log('\n4. AGENT-READY BENCHMARK SECTION:');
    const benchmarkInfo = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .section-title'));
        const benchHeading = headings.find(h => 
            h.textContent.includes('AGENT-READY') && 
            h.textContent.includes('BENCHMARK')
        );
        
        if (!benchHeading) return { exists: false };
        
        const section = benchHeading.closest('section, div[class*="section"]') || benchHeading.parentElement;
        const text = section.textContent;
        
        // Find grid/matrix
        const grid = section.querySelector('[class*="grid"], [class*="matrix"], table');
        
        // Count dots
        const dots = section.querySelectorAll('[class*="dot"], [style*="border-radius: 50"], [style*="border-radius:50"]');
        
        // Check for competitors
        const competitors = [
            'Codeshaper', 'Atomic Obj', 'Goji Labs', 'Simform', 
            'Snyk', 'Aikido', 'BairesDev', 'CodeSee', 
            'Graphite', 'CodeRabbit', 'Codementor'
        ];
        
        const foundCompetitors = competitors.filter(comp => text.includes(comp));
        
        // Check for UV-Speed column highlight
        const uvSpeedElements = Array.from(section.querySelectorAll('*')).filter(el => 
            el.textContent.includes('UV-Speed') || el.textContent.includes('UV Speed')
        );
        
        const hasBlueHighlight = uvSpeedElements.some(el => {
            const style = window.getComputedStyle(el);
            return style.background.includes('blue') || style.backgroundColor.includes('blue');
        });
        
        return {
            exists: true,
            title: benchHeading.textContent.trim(),
            hasGrid: !!grid,
            dotCount: dots.length,
            competitorsFound: foundCompetitors,
            competitorCount: foundCompetitors.length,
            hasUVSpeed: text.includes('UV-Speed') || text.includes('UV Speed'),
            hasBlueHighlight: hasBlueHighlight
        };
    });
    
    if (benchmarkInfo.exists) {
        console.log('   ✓ Benchmark section found');
        console.log('   Title:', benchmarkInfo.title);
        console.log('   Has grid/matrix:', benchmarkInfo.hasGrid ? '✓' : '✗');
        console.log('   Colored dots found:', benchmarkInfo.dotCount);
        console.log('   Competitors found:', benchmarkInfo.competitorCount, 'of 10');
        console.log('   Competitors:', benchmarkInfo.competitorsFound.join(', '));
        console.log('   UV-Speed mentioned:', benchmarkInfo.hasUVSpeed ? '✓' : '✗');
        console.log('   UV-Speed blue highlight:', benchmarkInfo.hasBlueHighlight ? '✓' : '✗');
    } else {
        console.log('   ✗ Benchmark section NOT FOUND');
    }
    
    // Check bottom tags
    console.log('\n5. BOTTOM TAG PILLS:');
    const tagsInfo = await page.evaluate(() => {
        const tags = Array.from(document.querySelectorAll('[class*="tag"], [class*="pill"], [class*="badge"]'));
        const bottomTags = tags.slice(-10); // Get last 10 tags
        
        const tagTexts = bottomTags.map(t => t.textContent.trim());
        
        return {
            totalTags: tags.length,
            bottomTagCount: bottomTags.length,
            bottomTags: tagTexts,
            has5Wins: tagTexts.some(t => t.includes('5') && t.includes('win')),
            has4Roadmap: tagTexts.some(t => t.includes('4') && t.includes('roadmap')),
            hasAgentReady: tagTexts.some(t => t.includes('Agent-ready') && t.includes('Phase 3')),
            hasEnterprise: tagTexts.some(t => t.includes('Enterprise') && t.includes('Phase 4'))
        };
    });
    
    console.log('   Total tags on page:', tagsInfo.totalTags);
    console.log('   Bottom tags:', tagsInfo.bottomTagCount);
    console.log('   "5 unique wins today":', tagsInfo.has5Wins ? '✓' : '✗');
    console.log('   "4 roadmap capabilities":', tagsInfo.has4Roadmap ? '✓' : '✗');
    console.log('   "Agent-ready by Phase 3":', tagsInfo.hasAgentReady ? '✓' : '✗');
    console.log('   "Enterprise-scale by Phase 4":', tagsInfo.hasEnterprise ? '✓' : '✗');
    
    if (tagsInfo.bottomTags.length > 0) {
        console.log('\n   Bottom tag texts:');
        tagsInfo.bottomTags.forEach((tag, idx) => {
            console.log(`   ${idx + 1}. ${tag}`);
        });
    }
    
    await page.screenshot({ path: 'sow-2-final-view.png', fullPage: true });
    console.log('\n   Screenshot: sow-2-final-view.png');
    
    console.log('\n=== TEST COMPLETE ===');
    await browser.close();
}

testSOWAndBenchmark().catch(console.error);
