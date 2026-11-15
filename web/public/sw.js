// MacroMap service worker: offline app shell + last-seen data.
// Bump VERSION when this file's caching rules change.
const VERSION = "v1";
const SHELL = `macromap-shell-${VERSION}`;
const DATA = `macromap-data-${VERSION}`;
const PRECACHE = ["/", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const networkFirst = async (request, cacheName, fallbackUrl) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(fallbackUrl ?? request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(fallbackUrl ?? request);
    if (cached) return cached;
    throw err;
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // map tiles, fonts: browser's own cache

  if (request.mode === "navigate") {
    // single-page app: any page falls back to the cached shell when offline
    event.respondWith(networkFirst(request, SHELL, "/"));
  } else if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request)); // file names are content-hashed
  } else if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DATA)); // fresh when online, last-seen when offline
  }
});
