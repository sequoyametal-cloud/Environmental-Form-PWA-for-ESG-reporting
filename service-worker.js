const CACHE_NAME = "environmental-form-pwa-v4";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./db.js",
    "./logo-CMOC-Odin.png"
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(
                FILES_TO_CACHE.map(function(file) {
                    return cache.add(file).catch(function(error) {
                        console.warn("No se pudo cachear:", file, error);
                    });
                })
            );
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.map(function(key) {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function(event) {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then(function(response) {
                return response || fetch(event.request);
            })
    );
});
