// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// History — Universal Timeline Search | Content Script
// Works on: Google, Bing, DuckDuckGo, Brave Search, Ecosia, Yahoo
// Browsers: Chrome, Edge, Brave, Opera, Firefox, Vivaldi, Arc
'use strict';

(function() {

const HISTORY_APP_URL = 'https://fornevercollective.github.io/uvspeed/web/history.html';
const SEARCH_PWA_URL = 'https://fornevercollective.github.io/uvspeed/web/search.html';
const VERSION = '1.1.0';

// Cross-browser storage API
const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : null;

const SRC_COLORS = {
    local: '#34d399', wikipedia: '#3b82f6', openlibrary: '#f97316',
    wayback: '#fb7185', 'sacred-texts': '#a78bfa', yale: '#fbbf24',
    arda: '#ef4444', arxiv: '#8b5cf6', pubchem: '#06b6d4',
    genbank: '#22d3ee', 'lgbtq-archives': '#d946ef', 'meta-research': '#6366f1',
    hathitrust: '#84cc16', 'internet-archive': '#f59e0b',
};

/* ══════════════════════════════════════════════════════
   CONNECTORS
   ══════════════════════════════════════════════════════ */
const CONNECTORS = [
    { name: 'Wikipedia', icon: 'W', enabled: true, search: q => fetch('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(q) + '&limit=6&format=json&origin=*').then(r => r.json()).then(d => (d[1] || []).map((t, i) => ({ title: t, source: 'wikipedia', url: d[3][i], snippet: d[2][i] }))).catch(() => []) },
    { name: 'Open Library', icon: 'OL', enabled: true, search: q => fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=5').then(r => r.json()).then(d => (d.docs || []).slice(0, 5).map(doc => ({ title: doc.title, source: 'openlibrary', snippet: (doc.author_name || []).join(', ') + (doc.first_publish_year ? ' (' + doc.first_publish_year + ')' : ''), url: 'https://openlibrary.org' + doc.key }))).catch(() => []) },
    { name: 'Wayback', icon: 'WB', enabled: true, search: q => fetch('https://web.archive.org/cdx/search/cdx?url=*' + encodeURIComponent(q) + '*&output=json&limit=5&fl=original,timestamp').then(r => r.json()).then(d => d.slice(1).map(r => ({ title: r[0], source: 'wayback', snippet: 'Archived: ' + r[1].substring(0, 4) + '-' + r[1].substring(4, 6) + '-' + r[1].substring(6, 8), url: 'https://web.archive.org/web/' + r[1] + '/' + r[0] }))).catch(() => []) },
    { name: 'Sacred Texts', icon: 'ST', enabled: true, search: q => Promise.resolve([{ title: 'Sacred Texts: ' + q, source: 'sacred-texts', snippet: 'All world traditions', url: 'https://www.sacred-texts.com/search.htm?q=' + encodeURIComponent(q) }]) },
    { name: 'Yale Archives', icon: 'YA', enabled: true, search: q => Promise.resolve([{ title: 'Yale Library: ' + q, source: 'yale', snippet: 'Beinecke + Yale digital collections', url: 'https://search.library.yale.edu/catalog?search_field=all_fields&q=' + encodeURIComponent(q) }]) },
    { name: 'ARDA', icon: 'AR', enabled: true, search: q => Promise.resolve([{ title: 'Religion Data: ' + q, source: 'arda', snippet: 'ARDA religious data archive', url: 'https://www.thearda.com/data-archive' }]) },
    { name: 'arXiv', icon: 'aX', enabled: true, search: q => fetch('https://export.arxiv.org/api/query?search_query=all:' + encodeURIComponent(q) + '&max_results=4').then(r => r.text()).then(xml => { const e = []; const re = /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<id>([\s\S]*?)<\/id>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<\/entry>/g; let m; while ((m = re.exec(xml)) !== null) e.push({ title: m[1].trim(), source: 'arxiv', url: m[2].trim(), snippet: m[3].trim().substring(0, 120) }); return e; }).catch(() => []) },
    { name: 'PubChem', icon: 'PC', enabled: true, search: q => fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(q) + '/property/MolecularFormula,MolecularWeight/JSON').then(r => r.json()).then(d => (d.PropertyTable?.Properties || []).map(p => ({ title: q + ' \u2014 ' + p.MolecularFormula + ' (' + p.MolecularWeight + ')', source: 'pubchem', snippet: 'Chemical compound', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/' + p.CID }))).catch(() => []) },
    { name: 'GenBank', icon: 'GB', enabled: true, search: q => Promise.resolve([{ title: 'GenBank: ' + q, source: 'genbank', snippet: 'NCBI nucleotide sequences', url: 'https://www.ncbi.nlm.nih.gov/nuccore/?term=' + encodeURIComponent(q) }]) },
    { name: 'LGBTQ Archives', icon: 'LQ', enabled: true, search: q => Promise.resolve([{ title: 'LGBTQ Religious Archives: ' + q, source: 'lgbtq-archives', snippet: 'LGBTQ Religious Archives Network', url: 'https://lgbtqreligiousarchives.org/resources' }]) },
    { name: 'Meta Research', icon: 'MR', enabled: true, search: q => Promise.resolve([{ title: 'Meta FAIR: ' + q, source: 'meta-research', snippet: 'Meta AI research', url: 'https://ai.meta.com/research/?q=' + encodeURIComponent(q) }]) },
    { name: 'HathiTrust', icon: 'HT', enabled: true, search: q => Promise.resolve([{ title: 'HathiTrust: ' + q, source: 'hathitrust', snippet: '17M+ digitized volumes', url: 'https://catalog.hathitrust.org/Search/Home?lookfor=' + encodeURIComponent(q) }]) },
    { name: 'Internet Archive', icon: 'IA', enabled: true, search: q => fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) + '&fl[]=identifier,title&rows=5&output=json').then(r => r.json()).then(d => (d.response?.docs || []).map(doc => ({ title: doc.title, source: 'internet-archive', snippet: 'Internet Archive', url: 'https://archive.org/details/' + doc.identifier }))).catch(() => []) },
];

const TL_SCALES = [
    { name: 'Sub-quantum', min: -44, max: -24, color: '#8b5cf6' },
    { name: 'Quantum', min: -24, max: -15, color: '#6366f1' },
    { name: 'Atomic', min: -15, max: -9, color: '#3b82f6' },
    { name: 'Photonic', min: -9, max: -6, color: '#06b6d4' },
    { name: 'Signal', min: -6, max: -2, color: '#22d3ee' },
    { name: 'Digital', min: -2, max: 2, color: '#34d399' },
    { name: 'Human', min: 2, max: 8, color: '#fbbf24' },
    { name: 'Historical', min: 8, max: 12, color: '#f97316' },
    { name: 'Geological', min: 12, max: 16, color: '#ef4444' },
    { name: 'Cosmic', min: 16, max: 18, color: '#84cc16' },
];

/* ══════════════════════════════════════════════════════
   DETECT SEARCH ENGINE & EXTRACT QUERY
   ══════════════════════════════════════════════════════ */
function getQuery() {
    const host = location.hostname;
    const params = new URLSearchParams(location.search);
    // Google, Bing, Yahoo, Ecosia, Brave
    if (params.has('q')) return params.get('q');
    // DuckDuckGo uses q in path or params
    if (host.includes('duckduckgo') && params.has('q')) return params.get('q');
    // Try to read from the search input directly
    const inputs = document.querySelectorAll('input[name="q"], input[type="search"], textarea[name="q"]');
    for (const inp of inputs) { if (inp.value) return inp.value; }
    return '';
}

function getSearchEngine() {
    const h = location.hostname;
    if (h.includes('google')) return 'Google';
    if (h.includes('bing')) return 'Bing';
    if (h.includes('duckduckgo')) return 'DuckDuckGo';
    if (h.includes('brave')) return 'Brave';
    if (h.includes('ecosia')) return 'Ecosia';
    if (h.includes('yahoo')) return 'Yahoo';
    return 'Search';
}

function getInsertTarget() {
    const engine = getSearchEngine();
    // Each search engine has different DOM structure
    if (engine === 'Google') return document.getElementById('search') || document.getElementById('main') || document.getElementById('rcnt');
    if (engine === 'Bing') return document.getElementById('b_content') || document.getElementById('b_results');
    if (engine === 'DuckDuckGo') return document.querySelector('.results--main') || document.querySelector('[data-testid="mainline"]') || document.getElementById('links');
    if (engine === 'Brave') return document.getElementById('results');
    if (engine === 'Ecosia') return document.querySelector('.mainline') || document.querySelector('main');
    if (engine === 'Yahoo') return document.getElementById('web') || document.getElementById('main');
    return document.body.firstElementChild;
}

/* ══════════════════════════════════════════════════════
   BUILD BAR UI
   ══════════════════════════════════════════════════════ */
function buildBar(query) {
    if (document.getElementById('uv-history-bar')) return;
    const engine = getSearchEngine();

    const bar = document.createElement('div');
    bar.id = 'uv-history-bar';
    bar.innerHTML = `
        <div id="uv-hb-controls">
            <span class="uv-logo">HISTORY</span>
            <span style="color:#1e2d4a;">|</span>
            <span style="color:#475569;font-family:monospace;font-size:9px;">${esc(engine)}</span>
            <span style="color:#1e2d4a;">|</span>
            <span class="uv-query">${esc(query)}</span>
            <span class="uv-pill active" id="uv-hb-count">searching...</span>
            <a class="uv-open-history" href="${HISTORY_APP_URL}?q=${encodeURIComponent(query)}" target="_blank">Open in History</a>
            <a class="uv-open-history" href="${SEARCH_PWA_URL}?q=${encodeURIComponent(query)}" target="_blank" style="background:linear-gradient(135deg,#06b6d4,#34d399);">Mobile PWA</a>
            <button class="uv-toggle" id="uv-hb-toggle" title="Collapse">\u25BC</button>
        </div>
        <div id="uv-hb-rainbow"><span class="uvr1"></span><span class="uvr2"></span><span class="uvr3"></span><span class="uvr4"></span><span class="uvr5"></span><span class="uvr6"></span></div>
        <div id="uv-hb-timeline"><canvas id="uv-hb-tl-canvas"></canvas></div>
        <div id="uv-hb-connectors"></div>
        <div id="uv-hb-results">
            <div class="uv-shimmer" style="width:80%;"></div>
            <div class="uv-shimmer" style="width:60%;"></div>
            <div class="uv-shimmer" style="width:70%;"></div>
        </div>
        <div id="uv-hb-status">
            <span>connectors: <span class="uv-st-val" id="uv-st-active">${CONNECTORS.filter(c=>c.enabled).length}</span></span>
            <span>results: <span class="uv-st-val" id="uv-st-results">0</span></span>
            <span>latency: <span class="uv-st-val" id="uv-st-latency">\u2014</span></span>
            <span class="uv-st-spacer"></span>
            <span style="color:#475569;">uvspeed history v${VERSION} | ${engine}</span>
        </div>`;

    const target = getInsertTarget();
    if (target && target.parentElement) target.parentElement.insertBefore(bar, target);
    else document.body.prepend(bar);

    document.getElementById('uv-hb-toggle').addEventListener('click', e => {
        e.stopPropagation();
        bar.classList.toggle('collapsed');
        document.getElementById('uv-hb-toggle').textContent = bar.classList.contains('collapsed') ? '\u25B6' : '\u25BC';
    });

    buildPills();
    drawTimeline();
    runSearch(query);
}

function buildPills() {
    const w = document.getElementById('uv-hb-connectors'); if (!w) return;
    w.innerHTML = '';
    CONNECTORS.forEach((c, i) => {
        const p = document.createElement('span');
        p.className = 'uv-conn-pill' + (c.enabled ? ' active' : '');
        p.textContent = c.icon; p.title = c.name; p.dataset.idx = i;
        p.addEventListener('click', () => { c.enabled = !c.enabled; p.classList.toggle('active'); if (storage?.local) storage.local.set({ connectors: CONNECTORS.map(x => x.enabled) }); });
        w.appendChild(p);
    });
}

function drawTimeline() {
    const cv = document.getElementById('uv-hb-tl-canvas'); if (!cv) return;
    cv.width = cv.parentElement.offsetWidth; cv.height = cv.parentElement.offsetHeight;
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const minL = -44, maxL = 18, range = maxL - minL;
    ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);
    TL_SCALES.forEach(s => {
        const x1 = ((s.min - minL) / range) * W, x2 = ((s.max - minL) / range) * W;
        ctx.fillStyle = s.color + '18'; ctx.fillRect(x1, 0, x2 - x1, H);
        ctx.strokeStyle = s.color + '40'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, H); ctx.stroke();
        const lx = (x1 + x2) / 2;
        if (lx > 8 && lx < W - 8) { ctx.fillStyle = s.color + 'cc'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText(s.name, lx, H / 2 + 3); }
    });
    ctx.textAlign = 'start';
}

async function runSearch(query) {
    const t0 = performance.now();
    const results = [], pills = document.querySelectorAll('.uv-conn-pill');
    pills.forEach(p => { if (CONNECTORS[+p.dataset.idx]?.enabled) p.classList.add('loading'); });
    const enabled = CONNECTORS.filter(c => c.enabled);

    await Promise.allSettled(enabled.map(async conn => {
        try {
            const r = await conn.search(query);
            const pill = document.querySelector(`.uv-conn-pill[data-idx="${CONNECTORS.indexOf(conn)}"]`);
            if (pill) { pill.classList.remove('loading'); if (r.length) pill.innerHTML = conn.icon + '<span class="uv-count">' + r.length + '</span>'; }
            r.forEach(item => results.push(item));
            render(results);
            const ce = document.getElementById('uv-hb-count'); if (ce) ce.textContent = results.length + ' results';
            const sr = document.getElementById('uv-st-results'); if (sr) sr.textContent = results.length;
        } catch(e) {
            const pill = document.querySelector(`.uv-conn-pill[data-idx="${CONNECTORS.indexOf(conn)}"]`);
            if (pill) pill.classList.remove('loading');
        }
    }));

    const lat = document.getElementById('uv-st-latency'); if (lat) lat.textContent = Math.round(performance.now() - t0) + 'ms';
    render(results);
}

function render(results) {
    const el = document.getElementById('uv-hb-results'); if (!el) return;
    el.innerHTML = '';
    if (!results.length) { el.innerHTML = '<div style="color:#64748b;font-size:11px;padding:8px;">No results from enabled connectors.</div>'; return; }
    results.forEach(item => {
        const a = document.createElement('a');
        a.className = 'uv-result'; a.href = item.url || '#'; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = `<div class="uv-r-source"><span class="uv-src-dot" style="background:${SRC_COLORS[item.source] || '#64748b'};"></span>${esc(item.source)}</div><div class="uv-r-title">${esc(item.title)}</div>${item.snippet ? '<div class="uv-r-snippet">' + esc(item.snippet) + '</div>' : ''}`;
        el.appendChild(a);
    });
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ══════════════════════════════════════════════════════
   INIT + SPA NAVIGATION OBSERVER
   ══════════════════════════════════════════════════════ */
let lastQ = '';
function check() {
    const q = getQuery(); if (!q || q === lastQ) return;
    lastQ = q;
    const old = document.getElementById('uv-history-bar'); if (old) old.remove();
    buildBar(q);
}

check();
new MutationObserver(() => check()).observe(document.body, { childList: true, subtree: true });
window.addEventListener('popstate', () => setTimeout(check, 100));

// Load saved connector states
if (storage?.local) {
    storage.local.get('connectors', data => {
        if (data?.connectors && Array.isArray(data.connectors)) {
            data.connectors.forEach((en, i) => { if (CONNECTORS[i]) CONNECTORS[i].enabled = en; });
            buildPills();
        }
    });
}

})();
