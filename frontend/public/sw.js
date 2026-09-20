const CACHE = "ai-astro-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
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
  
  // Только статика: _next/static, storage (картинки), icons
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/storage/") ||
    url.pathname.startsWith("/icons/")
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        });
      })
    );
  }
  // Всё остальное (API, навигация) — pass-through, SW не вмешивается
});
