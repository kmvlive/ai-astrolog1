const CACHE = "ai-astro-v2";
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.png",
  "/manifest.webmanifest",
];

// Install: кэшируем критичные ресурсы + offline страницу
self.addEventListener("install", (e) => {
  console.log("[SW] install — precaching", PRECACHE.length, "files");
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: чистим старые кэши
self.addEventListener("activate", (e) => {
  console.log("[SW] activate — cleaning old caches");
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;

  // 1. Navigation запросы (страницы): сеть + fallback на offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // 2. Статика (_next/static, storage, icons, fonts) — кэш с сетевым fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/storage/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/moon/") ||
    /\.(png|jpg|jpeg|svg|woff2?|ttf)$/i.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => {
          // для картинок — прозрачный 1x1 пиксель чтобы не ломать layout
          if (/\.(png|jpg|jpeg)$/i.test(url.pathname)) {
            return new Response("", { headers: { "Content-Type": "image/png" } });
          }
        });
      })
    );
    return;
  }

  // 3. API и всё остальное — только сеть
});
