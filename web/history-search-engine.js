// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// History Search Engine — shared module for extension + PWA + hexterm
// Usage: <script src="history-search-engine.js"></script> then window.HistorySearch.search(query)
'use strict';

(function(root) {

const VERSION = '1.0.0';

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
    {
        name: 'Wikipedia', icon: 'W', enabled: true,
        search: q => fetch('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(q) + '&limit=6&format=json&origin=*')
            .then(r => r.json())
            .then(d => (d[1] || []).map((t, i) => ({ title: t, source: 'wikipedia', url: d[3][i], snippet: d[2][i] })))
            .catch(() => [])
    },
    {
        name: 'Open Library', icon: 'OL', enabled: true,
        search: q => fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=5')
            .then(r => r.json())
            .then(d => (d.docs || []).slice(0, 5).map(doc => ({
                title: doc.title, source: 'openlibrary',
                snippet: (doc.author_name || []).join(', ') + (doc.first_publish_year ? ' (' + doc.first_publish_year + ')' : ''),
                url: 'https://openlibrary.org' + doc.key
            }))).catch(() => [])
    },
    {
        name: 'Wayback Machine', icon: 'WB', enabled: true,
        search: q => fetch('https://web.archive.org/cdx/search/cdx?url=*' + encodeURIComponent(q) + '*&output=json&limit=5&fl=original,timestamp')
            .then(r => r.json())
            .then(d => d.slice(1).map(r => ({
                title: r[0], source: 'wayback',
                snippet: 'Archived: ' + r[1].substring(0, 4) + '-' + r[1].substring(4, 6) + '-' + r[1].substring(6, 8),
                url: 'https://web.archive.org/web/' + r[1] + '/' + r[0]
            }))).catch(() => [])
    },
    {
        name: 'Sacred Texts', icon: 'ST', enabled: true,
        search: q => Promise.resolve([{
            title: 'Sacred Texts: ' + q, source: 'sacred-texts',
            snippet: 'All world traditions — sacred-texts.com',
            url: 'https://www.sacred-texts.com/search.htm?q=' + encodeURIComponent(q)
        }])
    },
    {
        name: 'Yale Archives', icon: 'YA', enabled: true,
        search: q => Promise.resolve([{
            title: 'Yale Library: ' + q, source: 'yale',
            snippet: 'Beinecke Library + Yale digital collections',
            url: 'https://search.library.yale.edu/catalog?search_field=all_fields&q=' + encodeURIComponent(q)
        }])
    },
    {
        name: 'ARDA', icon: 'AR', enabled: true,
        search: q => Promise.resolve([{
            title: 'Religion Data Archives: ' + q, source: 'arda',
            snippet: 'Association of Religion Data Archives',
            url: 'https://www.thearda.com/data-archive'
        }])
    },
    {
        name: 'arXiv', icon: 'aX', enabled: true,
        search: q => fetch('https://export.arxiv.org/api/query?search_query=all:' + encodeURIComponent(q) + '&max_results=4')
            .then(r => r.text())
            .then(xml => {
                const entries = [];
                const re = /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<id>([\s\S]*?)<\/id>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<\/entry>/g;
                let m; while ((m = re.exec(xml)) !== null) entries.push({
                    title: m[1].trim(), source: 'arxiv', url: m[2].trim(),
                    snippet: m[3].trim().substring(0, 150)
                });
                return entries;
            }).catch(() => [])
    },
    {
        name: 'PubChem', icon: 'PC', enabled: true,
        search: q => fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(q) + '/property/MolecularFormula,MolecularWeight/JSON')
            .then(r => r.json())
            .then(d => (d.PropertyTable?.Properties || []).map(p => ({
                title: q + ' \u2014 ' + p.MolecularFormula + ' (' + p.MolecularWeight + ' g/mol)',
                source: 'pubchem', snippet: 'Chemical compound data',
                url: 'https://pubchem.ncbi.nlm.nih.gov/compound/' + p.CID
            }))).catch(() => [])
    },
    {
        name: 'GenBank', icon: 'GB', enabled: true,
        search: q => Promise.resolve([{
            title: 'NCBI GenBank: ' + q, source: 'genbank',
            snippet: 'Nucleotide sequence database',
            url: 'https://www.ncbi.nlm.nih.gov/nuccore/?term=' + encodeURIComponent(q)
        }])
    },
    {
        name: 'LGBTQ Archives', icon: 'LQ', enabled: true,
        search: q => Promise.resolve([{
            title: 'LGBTQ Religious Archives: ' + q, source: 'lgbtq-archives',
            snippet: 'LGBTQ Religious Archives Network',
            url: 'https://lgbtqreligiousarchives.org/resources'
        }])
    },
    {
        name: 'Meta Research', icon: 'MR', enabled: true,
        search: q => Promise.resolve([{
            title: 'Meta FAIR: ' + q, source: 'meta-research',
            snippet: 'Meta AI research publications',
            url: 'https://ai.meta.com/research/?q=' + encodeURIComponent(q)
        }])
    },
    {
        name: 'HathiTrust', icon: 'HT', enabled: true,
        search: q => Promise.resolve([{
            title: 'HathiTrust: ' + q, source: 'hathitrust',
            snippet: 'HathiTrust Digital Library \u2014 17M+ volumes',
            url: 'https://catalog.hathitrust.org/Search/Home?lookfor=' + encodeURIComponent(q)
        }])
    },
    {
        name: 'Internet Archive', icon: 'IA', enabled: true,
        search: q => fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) + '&fl[]=identifier,title&rows=5&output=json')
            .then(r => r.json())
            .then(d => (d.response?.docs || []).map(doc => ({
                title: doc.title, source: 'internet-archive',
                snippet: 'Internet Archive collection',
                url: 'https://archive.org/details/' + doc.identifier
            }))).catch(() => [])
    },
];

/* ══════════════════════════════════════════════════════
   TIMELINE SCALES
   ══════════════════════════════════════════════════════ */
const TL_SCALES = [
    { name: 'Sub-quantum', min: -44, max: -24, color: '#8b5cf6' },
    { name: 'Quantum',     min: -24, max: -15, color: '#6366f1' },
    { name: 'Atomic',      min: -15, max: -9,  color: '#3b82f6' },
    { name: 'Photonic',    min: -9,  max: -6,  color: '#06b6d4' },
    { name: 'Signal',      min: -6,  max: -2,  color: '#22d3ee' },
    { name: 'Digital',     min: -2,  max: 2,   color: '#34d399' },
    { name: 'Human',       min: 2,   max: 8,   color: '#fbbf24' },
    { name: 'Historical',  min: 8,   max: 12,  color: '#f97316' },
    { name: 'Geological',  min: 12,  max: 16,  color: '#ef4444' },
    { name: 'Cosmic',      min: 16,  max: 18,  color: '#84cc16' },
];

/* ══════════════════════════════════════════════════════
   SEARCH ENGINE API
   ══════════════════════════════════════════════════════ */
async function search(query, opts = {}) {
    const t0 = performance.now();
    const onProgress = opts.onProgress || (() => {});
    const enabledConnectors = CONNECTORS.filter(c => c.enabled);
    const allResults = [];
    let completed = 0;

    await Promise.allSettled(enabledConnectors.map(async (conn) => {
        try {
            const results = await conn.search(query);
            results.forEach(r => allResults.push(r));
            completed++;
            onProgress({ results: allResults.slice(), completed, total: enabledConnectors.length, connector: conn.name, latestBatch: results });
        } catch (e) {
            completed++;
            onProgress({ results: allResults.slice(), completed, total: enabledConnectors.length, connector: conn.name, error: e.message, latestBatch: [] });
        }
    }));

    return {
        query,
        results: allResults,
        latencyMs: Math.round(performance.now() - t0),
        connectorsUsed: enabledConnectors.length,
        totalResults: allResults.length,
    };
}

function setConnectorEnabled(nameOrIndex, enabled) {
    const conn = typeof nameOrIndex === 'number' ? CONNECTORS[nameOrIndex] : CONNECTORS.find(c => c.name === nameOrIndex || c.icon === nameOrIndex);
    if (conn) conn.enabled = enabled;
}

function getConnectors() { return CONNECTORS.map(c => ({ name: c.name, icon: c.icon, enabled: c.enabled })); }
function getScales() { return TL_SCALES; }
function getSourceColor(source) { return SRC_COLORS[source] || '#64748b'; }

/* ══════════════════════════════════════════════════════
   MINI TIMELINE RENDERER
   ══════════════════════════════════════════════════════ */
function drawTimeline(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const minLog = -44, maxLog = 18, range = maxLog - minLog;
    ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);
    TL_SCALES.forEach(s => {
        const x1 = ((s.min - minLog) / range) * W;
        const x2 = ((s.max - minLog) / range) * W;
        ctx.fillStyle = s.color + '18'; ctx.fillRect(x1, 0, x2 - x1, H);
        ctx.strokeStyle = s.color + '40'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, H); ctx.stroke();
        const lx = (x1 + x2) / 2;
        if (lx > 10 && lx < W - 10) {
            ctx.fillStyle = s.color + 'cc'; ctx.font = 'bold ' + Math.max(7, H * 0.2) + 'px monospace';
            ctx.textAlign = 'center'; ctx.fillText(s.name, lx, H / 2 + 3);
        }
    });
    ctx.textAlign = 'start';
}

/* ══════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════ */
const HistorySearch = {
    VERSION,
    search,
    getConnectors,
    setConnectorEnabled,
    getScales,
    getSourceColor,
    drawTimeline,
    SRC_COLORS,
    CONNECTORS,
    TL_SCALES,
};

root.HistorySearch = HistorySearch;

// Also broadcast availability
if (typeof BroadcastChannel !== 'undefined') {
    try {
        const bc = new BroadcastChannel('history-search');
        bc.postMessage({ type: 'engine-ready', version: VERSION });
    } catch(e) {}
}

})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
