const CACHE_NAME = "rock-tools-v1";

const urlsToCache = [
  "/sujeet-tools/",
  "/sujeet-tools/index.html",
  "/sujeet-tools/tools.html",
  "/sujeet-tools/about.html",
  "/sujeet-tools/contact.html",
  "/sujeet-tools/style.css",
  "/sujeet-tools/logo.png"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch (offline support)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
