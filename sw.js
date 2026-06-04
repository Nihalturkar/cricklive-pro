/* ============ SERVICE WORKER - CrickLive Pro PWA ============ */
var CACHE_NAME = 'cricklive-v2';
var ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css',
    './css/components.css',
    './css/scorecard.css',
    './css/ticker.css',
    './css/animations.css',
    './css/responsive.css',
    './js/store.js',
    './js/api.js',
    './js/router.js',
    './js/app.js',
    './js/components/modal.js',
    './js/components/toast.js',
    './js/components/matchCard.js',
    './js/components/batsmanPanel.js',
    './js/components/bowlerPanel.js',
    './js/components/overTimeline.js',
    './js/components/commentary.js',
    './js/components/scoreTicker.js',
    './js/components/shareMatch.js',
    './js/views/dashboard.js',
    './js/views/matchCenter.js',
    './js/views/teamManager.js',
    './js/views/tournaments.js',
    './js/views/localScorer.js',
    './js/views/viewer.js',
    './icons/icon.svg'
];

// Install - cache all assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// Activate - clean old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (name) {
                    return name !== CACHE_NAME;
                }).map(function (name) {
                    return caches.delete(name);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Fetch - cache first, then network (for app assets)
// Network first for API calls
self.addEventListener('fetch', function (event) {
    var url = event.request.url;

    // API calls - network first, skip cache
    if (url.includes('cricapi.com') || url.includes('api.')) {
        event.respondWith(
            fetch(event.request).catch(function () {
                return new Response(JSON.stringify({ status: 'error', info: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // App assets - cache first, then network
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) {
                // Return cached, but also update cache in background
                fetch(event.request).then(function (response) {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, response);
                        });
                    }
                }).catch(function () { /* offline, ignore */ });
                return cached;
            }
            return fetch(event.request).then(function (response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
