// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// History Search Engine — shared module for extension + PWA + hexterm
// Usage: <script src="history-search-engine.js"></script> then window.HistorySearch.search(query)
'use strict';

(function(root) {

const VERSION = '2.0.0';

const SRC_COLORS = {
    local: '#34d399', wikipedia: '#3b82f6', openlibrary: '#f97316',
    wayback: '#fb7185', 'sacred-texts': '#a78bfa', yale: '#fbbf24',
    arda: '#ef4444', arxiv: '#8b5cf6', pubchem: '#06b6d4',
    genbank: '#22d3ee', 'lgbtq-archives': '#d946ef', 'meta-research': '#6366f1',
    hathitrust: '#84cc16', 'internet-archive': '#f59e0b',
    fred: '#e11d48', worldbank: '#0ea5e9', coingecko: '#10b981',
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
    // ── Economic / Monetary connectors ──
    {
        name: 'FRED', icon: 'FR', enabled: true,
        search: q => fetch('https://api.stlouisfed.org/fred/series/search?search_text=' + encodeURIComponent(q) + '&api_key=DEMO_KEY&file_type=json&limit=4')
            .then(r => r.json())
            .then(d => (d.seriess || []).map(s => ({
                title: s.title, source: 'fred',
                snippet: s.frequency + ' \u2014 ' + (s.observation_start || '') + ' to ' + (s.observation_end || '') + ' \u2014 ' + (s.notes || '').substring(0, 100),
                url: 'https://fred.stlouisfed.org/series/' + s.id
            }))).catch(() => [])
    },
    {
        name: 'World Bank', icon: 'WB$', enabled: true,
        search: q => fetch('https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=3&date=2020:2024')
            .then(r => r.json())
            .then(d => {
                var items = (d[1] || []).filter(i => i.value !== null);
                return items.slice(0, 4).map(i => ({
                    title: (i.country ? i.country.value : 'World') + ' GDP ' + i.date,
                    source: 'worldbank',
                    snippet: 'GDP: $' + (i.value ? (i.value / 1e9).toFixed(1) + 'B' : 'N/A') + ' \u2014 ' + (i.indicator ? i.indicator.value : ''),
                    url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=' + (i.countryiso3code || '')
                }));
            }).catch(() => [])
    },
    {
        name: 'CoinGecko', icon: 'CG', enabled: true,
        search: q => fetch('https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(q))
            .then(r => r.json())
            .then(d => (d.coins || []).slice(0, 4).map(c => ({
                title: c.name + ' (' + c.symbol.toUpperCase() + ')',
                source: 'coingecko',
                snippet: 'Market cap rank: #' + (c.market_cap_rank || 'N/A') + ' \u2014 ' + (c.id || ''),
                url: 'https://www.coingecko.com/en/coins/' + c.id
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
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    const minLog = -44, maxLog = 18, range = maxLog - minLog;
    const isLight = document.documentElement.classList.contains('light');
    ctx.fillStyle = isLight ? '#f1f5f9' : '#050810'; ctx.fillRect(0, 0, W, H);
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
   DOCUMENT FETCHER
   ══════════════════════════════════════════════════════ */
async function fetchDocument(url, source) {
    source = source || '';
    var doc = { title: '', content: '', source: source, url: url, wordCount: 0, language: 'en', fetchedAt: Date.now() };
    try {
        // Wikipedia: use parse API for full text
        if (source === 'wikipedia' || url.indexOf('wikipedia.org') !== -1) {
            var titleMatch = url.match(/\/wiki\/(.+?)(?:#|$)/);
            if (titleMatch) {
                var apiUrl = 'https://en.wikipedia.org/w/api.php?action=parse&page=' + titleMatch[1] + '&prop=text|categories&format=json&origin=*';
                var res = await fetch(apiUrl);
                var data = await res.json();
                if (data.parse) {
                    doc.title = data.parse.title || titleMatch[1].replace(/_/g, ' ');
                    var html = data.parse.text ? data.parse.text['*'] : '';
                    doc.content = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    doc.categories = (data.parse.categories || []).map(function(c) { return c['*']; });
                }
            }
        }
        // arXiv: already have abstract, fetch extended metadata
        else if (source === 'arxiv' || url.indexOf('arxiv.org') !== -1) {
            var idMatch = url.match(/abs\/(.+?)(?:#|$)/) || url.match(/(\d{4}\.\d{4,5})/);
            if (idMatch) {
                var res = await fetch('https://export.arxiv.org/api/query?id_list=' + idMatch[1]);
                var xml = await res.text();
                var tM = xml.match(/<title>([\s\S]*?)<\/title>/);
                var sM = xml.match(/<summary>([\s\S]*?)<\/summary>/);
                var aM = xml.match(/<name>([\s\S]*?)<\/name>/g);
                doc.title = tM ? tM[1].trim() : '';
                doc.content = sM ? sM[1].trim() : '';
                doc.authors = aM ? aM.map(function(a) { return a.replace(/<[^>]+>/g, '').trim(); }) : [];
            }
        }
        // Open Library: fetch work description + subjects
        else if (source === 'openlibrary' || url.indexOf('openlibrary.org') !== -1) {
            var keyMatch = url.match(/\/works\/(\w+)/);
            if (keyMatch) {
                var res = await fetch('https://openlibrary.org/works/' + keyMatch[1] + '.json');
                var data = await res.json();
                doc.title = data.title || '';
                doc.content = typeof data.description === 'string' ? data.description : (data.description ? data.description.value : '');
                doc.subjects = (data.subjects || []).slice(0, 20);
            }
        }
        // Internet Archive: metadata endpoint
        else if (source === 'internet-archive' || url.indexOf('archive.org') !== -1) {
            var idMatch = url.match(/\/details\/(.+?)(?:#|$)/);
            if (idMatch) {
                var res = await fetch('https://archive.org/metadata/' + idMatch[1]);
                var data = await res.json();
                var m = data.metadata || {};
                doc.title = m.title || idMatch[1];
                doc.content = m.description || '';
                doc.creator = m.creator;
                doc.date = m.date;
            }
        }
        // FRED: fetch series observations
        else if (source === 'fred' || url.indexOf('fred.stlouisfed.org') !== -1) {
            var sMatch = url.match(/\/series\/(\w+)/);
            if (sMatch) {
                var res = await fetch('https://api.stlouisfed.org/fred/series?series_id=' + sMatch[1] + '&api_key=DEMO_KEY&file_type=json');
                var data = await res.json();
                var s = (data.seriess || [])[0] || {};
                doc.title = s.title || sMatch[1];
                doc.content = (s.notes || '') + '\n\nFrequency: ' + (s.frequency || '') + '\nUnits: ' + (s.units || '') + '\nSeasonal adjustment: ' + (s.seasonal_adjustment || '');
            }
        }
        // Generic: try to fetch and extract text
        else {
            doc.title = url;
            doc.content = 'Document preview not available for this source. Open the URL directly.';
        }
    } catch (e) {
        doc.content = 'Fetch error: ' + e.message;
    }
    doc.wordCount = doc.content ? doc.content.split(/\s+/).length : 0;
    return doc;
}

/* ══════════════════════════════════════════════════════
   CONTEXT ANALYZER
   ══════════════════════════════════════════════════════ */

// Word lists for tone detection
var _TONE_ACADEMIC = ['hypothesis','methodology','empirical','furthermore','consequently','paradigm','theoretical','correlation','significance','parameter','systematic','quantitative','qualitative','longitudinal','peer-reviewed','citation','appendix','abstract','et al','respectively'];
var _TONE_MARKETING = ['exclusive','limited','free','guaranteed','revolutionary','amazing','incredible','unbelievable','act now','best ever','discount','premium','unlock','boost','maximize','skyrocket','transform','ultimate','breakthrough','game-changing'];
var _TONE_EDUCATIONAL = ['learn','understand','example','practice','exercise','chapter','lesson','concept','fundamental','introduction','definition','explanation','diagram','tutorial','demonstrate','illustrate','step-by-step','overview','summary','review'];
var _TONE_NARRATIVE = ['i ','my ','me ','we ','our ','felt','remembered','walked','looked','thought','heart','dream','love','fear','hope','believed','whispered','laughed','cried','journey'];
var _TONE_LEGAL = ['shall','whereas','herein','thereof','pursuant','notwithstanding','indemnify','liability','obligation','amendment','jurisdiction','arbitration','stipulate','covenant','warrant','provision','clause','binding','enforceable','waiver'];
var _TONE_CRISIS = ['war','conflict','attack','bomb','troops','invasion','siege','casualties','refugee','displaced','famine','epidemic','pandemic','collapse','bankruptcy','default','crisis','emergency','catastrophe','devastation'];

var _MONETARY_PATTERNS = /\$[\d,.]+|\d+%|GDP|inflation|debt|deficit|trade|tariff|stock|bond|treasury|currency|exchange rate|interest rate|fiscal|monetary|capital|investment|revenue|profit|loss|billion|trillion|economy|recession|depression|surplus|subsidy|tax|wage|income|wealth|poverty|inequality/gi;

var _SUBREFERENCE_PATTERNS = {
    urls: /https?:\/\/[^\s"'<>]+/g,
    dates: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}|\d{4}\s(?:BC|BCE|AD|CE))\b/gi,
    monetary: /\$[\d,.]+\s*(?:billion|trillion|million)?|\d+(?:\.\d+)?\s*(?:billion|trillion|million)\s*(?:dollars|USD|EUR|GBP)?/gi,
    quotes: /"([^"]{10,200})"/g,
    properNouns: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
};

function analyzeContext(doc) {
    var text = (doc && doc.content) ? doc.content : (typeof doc === 'string' ? doc : '');
    var words = text.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 0; });
    var totalWords = words.length;
    if (totalWords === 0) return { tone: {}, vocabulary: {}, subReferences: {}, monetarySignals: [], sentiment: 0, readabilityScore: 0, heartbeat: 0.5, aiPerspective: '' };

    // ── Vocabulary fingerprint ──
    var freq = {};
    words.forEach(function(w) { var clean = w.replace(/[^a-z'-]/g, ''); if (clean.length > 1) freq[clean] = (freq[clean] || 0) + 1; });
    var uniqueWords = Object.keys(freq);
    var hapaxCount = uniqueWords.filter(function(w) { return freq[w] === 1; }).length;
    var avgWordLen = words.reduce(function(s, w) { return s + w.length; }, 0) / totalWords;
    var sortedWords = uniqueWords.sort(function(a, b) { return freq[b] - freq[a]; });

    var vocabulary = {
        totalWords: totalWords,
        uniqueWords: uniqueWords.length,
        typeTokenRatio: uniqueWords.length / totalWords,
        hapaxRatio: hapaxCount / uniqueWords.length,
        avgWordLength: Math.round(avgWordLen * 10) / 10,
        top50: sortedWords.slice(0, 50).map(function(w) { return { word: w, count: freq[w] }; }),
    };

    // ── Writing tone classification ──
    var lower = text.toLowerCase();
    function countHits(wordList) {
        var hits = 0;
        wordList.forEach(function(term) { var idx = -1; while ((idx = lower.indexOf(term, idx + 1)) !== -1) hits++; });
        return hits;
    }

    var toneScores = {
        academic: countHits(_TONE_ACADEMIC),
        marketing: countHits(_TONE_MARKETING),
        educational: countHits(_TONE_EDUCATIONAL),
        narrative: countHits(_TONE_NARRATIVE),
        legal: countHits(_TONE_LEGAL),
        crisis: countHits(_TONE_CRISIS),
    };
    var toneTotal = Object.values(toneScores).reduce(function(a, b) { return a + b; }, 0) || 1;
    var tone = {};
    for (var t in toneScores) tone[t] = Math.round((toneScores[t] / toneTotal) * 100);

    // Determine dominant tone
    var dominant = 'neutral';
    var maxScore = 0;
    for (var t in tone) { if (tone[t] > maxScore) { maxScore = tone[t]; dominant = t; } }
    tone.dominant = dominant;

    // ── Sub-reference extraction ──
    var subReferences = {};
    for (var key in _SUBREFERENCE_PATTERNS) {
        var matches = text.match(_SUBREFERENCE_PATTERNS[key]);
        subReferences[key] = matches ? matches.slice(0, 20) : [];
    }

    // ── Monetary signals ──
    var monetaryMatches = text.match(_MONETARY_PATTERNS) || [];
    var monetarySignals = monetaryMatches.slice(0, 30);

    // ── Sentiment (simple positive/negative ratio) ──
    var posWords = ['good','great','excellent','wonderful','positive','success','benefit','improve','growth','progress','hope','opportunity','achieve','prosper','peace','health','love','create','build','thrive'];
    var negWords = ['bad','terrible','awful','negative','failure','harm','damage','decline','crisis','danger','threat','loss','destroy','suffer','pain','fear','hate','corrupt','exploit','collapse'];
    var posCount = countHits(posWords);
    var negCount = countHits(negWords);
    var sentiment = (posCount + negCount) > 0 ? (posCount - negCount) / (posCount + negCount) : 0;

    // ── Readability (Flesch-Kincaid approximation) ──
    var sentences = text.split(/[.!?]+/).filter(function(s) { return s.trim().length > 3; }).length || 1;
    var syllables = words.reduce(function(s, w) { var m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').match(/[aeiouy]{1,2}/g); return s + (m ? m.length : 1); }, 0);
    var readabilityScore = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (totalWords / sentences) - 84.6 * (syllables / totalWords))));

    // ── Heartbeat: humanity vs profit-attention ratio ──
    var humanitySignals = toneScores.educational + toneScores.narrative + posCount;
    var profitSignals = toneScores.marketing + toneScores.crisis + monetarySignals.length;
    var heartbeatTotal = humanitySignals + profitSignals || 1;
    var heartbeat = Math.round((humanitySignals / heartbeatTotal) * 100) / 100;

    // ── AI self-awareness ──
    var aiPerspective = 'This analysis was performed by a pattern-matching system (regex word lists, not semantic AI). ' +
        'Tone classifications are structural, not contextual \u2014 a crisis report about humanitarian aid scores high on both crisis and educational. ' +
        'The heartbeat metric (' + Math.round(heartbeat * 100) + '% humanity) distinguishes profit-oriented framing from human-oriented content, ' +
        'but this distinction is itself a value judgment encoded in word lists. The system does not understand meaning; it counts patterns.';

    return {
        tone: tone,
        vocabulary: vocabulary,
        subReferences: subReferences,
        monetarySignals: monetarySignals,
        sentiment: Math.round(sentiment * 100) / 100,
        readabilityScore: readabilityScore,
        heartbeat: heartbeat,
        aiPerspective: aiPerspective,
    };
}

/* ══════════════════════════════════════════════════════
   PATTERN RECOGNITION (cross-result analysis)
   ══════════════════════════════════════════════════════ */
function detectPatterns(results, documents) {
    documents = documents || [];
    var clusters = { economic: [], academic: [], crisis: [], educational: [], narrative: [] };
    var totalEconDensity = 0;
    var totalAttention = 0;
    var totalHeartbeat = 0;
    var shockwaves = [];
    var docCount = 0;

    documents.forEach(function(doc) {
        if (!doc || !doc._analysis) return;
        var a = doc._analysis;
        docCount++;

        // Cluster by dominant tone
        if (a.tone && a.tone.dominant && clusters[a.tone.dominant]) {
            clusters[a.tone.dominant].push({ title: doc.title, source: doc.source, heartbeat: a.heartbeat });
        }

        // Economic density
        var econDensity = a.monetarySignals ? a.monetarySignals.length / Math.max(1, a.vocabulary.totalWords) * 1000 : 0;
        totalEconDensity += econDensity;

        // Attention (marketing/crisis) vs heartbeat (educational/narrative)
        totalAttention += (a.tone.marketing || 0) + (a.tone.crisis || 0);
        totalHeartbeat += (a.tone.educational || 0) + (a.tone.narrative || 0);

        // Shockwave detection: high crisis + high monetary = shockwave
        if ((a.tone.crisis || 0) > 25 && a.monetarySignals && a.monetarySignals.length > 3) {
            shockwaves.push({
                title: doc.title,
                source: doc.source,
                crisisScore: a.tone.crisis,
                monetaryTerms: a.monetarySignals.length,
                sentiment: a.sentiment,
            });
        }
    });

    var attentionTotal = totalAttention + totalHeartbeat || 1;
    var attentionRatio = Math.round((totalAttention / attentionTotal) * 100);

    return {
        clusters: clusters,
        economicDensity: docCount > 0 ? Math.round((totalEconDensity / docCount) * 10) / 10 : 0,
        attentionRatio: attentionRatio,
        heartbeatRatio: 100 - attentionRatio,
        shockwaves: shockwaves,
        documentsAnalyzed: docCount,
        prediction: shockwaves.length > 2
            ? 'High volatility pattern: multiple crisis-economic intersections detected. Historical correlation suggests impact on housing, education, and community stability within 6-18 months.'
            : shockwaves.length > 0
                ? 'Moderate disruption signal: ' + shockwaves.length + ' crisis-economic intersection(s). Monitor for cascading effects.'
                : 'Stable pattern: no significant crisis-economic intersections in analyzed documents.',
    };
}

/* ══════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════ */
const HistorySearch = {
    VERSION: '2.0.0',
    search,
    getConnectors,
    setConnectorEnabled,
    getScales,
    getSourceColor,
    drawTimeline,
    fetchDocument,
    analyzeContext,
    detectPatterns,
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
