const CACHE = "maichles-codebook-v1";
const PRECACHE = [
  "/book",
  "/book-manifest.webmanifest",
  "/favicon.svg",
  "/__grok/icon-180.png",
  "/samples/codes-plumbing.csv",
  "/samples/codes-hvac.csv",
  "/samples/codes-invoice.csv",
  "/samples/codes-all.csv",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isBook =
    path === "/book" ||
    path.startsWith("/book") ||
    path.startsWith("/samples/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/__grok/") ||
    path === "/favicon.svg" ||
    path.includes("book-manifest") ||
    path.includes("book-sw");

  if (!isBook) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networked = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networked;
    }),
  );
});
