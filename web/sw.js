// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Service Worker — Offline-first PWA cache for quantum notepad
// Phase 4.0 · Caches all 20 web apps + shared modules for full offline operation

const CACHE_NAME = 'uvspeed-v4.9';
const OFFLINE_URLS = [
    './',
    'quantum-notepad.html',
    'terminal.html',
    'terminal-manifest.json',
    'feed.html',
    'grid.html',
    'launcher.html',
    'sponsor.html',
    'brothernumsy.html',
    'hexcast.html',
    'hexcast-send.html',
    'hexcast-manifest.json',
    'kbatch.html',
    'blackwell.html',
    'questcast.html',
    'archflow.html',
    'jawta-audio.html',
    'github-dashboard.html',
    'research-lab.html',
    'hexbench.html',
    'numsy.html',
    'quantum-gutter.html',
    'freya.html',
    'quantum-prefixes.js',
    'manifest.json',
    '../icons/nyan-banner.png',
    '../icons/favicon.png',
    '../icons/favicon.ico',
    '../icons/icon-192.png',
    '../icons/hexterm-192.png',
    '../icons/hexterm-512.png',
    '../icons/hexterm-favicon.png',
];

// Install — pre-cache core shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(OFFLINE_URLS).catch(() => {
                // Individual failures are OK — cache what we can
                return Promise.allSettled(OFFLINE_URLS.map(url =>
                    cache.add(url).catch(() => console.log('SW: skip cache', url))
                ));
            });
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Skip non-GET, API calls, and cross-origin except CDN
    if (e.request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Clone and cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(e.request).then(cached => {
                    if (cached) return cached;
                    // For navigation requests, return the cached notepad
                    if (e.request.mode === 'navigate') {
                        return caches.match('quantum-notepad.html');
                    }
                    return new Response('Offline — cached version not available', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});

// Listen for skip-waiting message from clients (used by pull-to-refresh)
self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting') self.skipWaiting();
});
