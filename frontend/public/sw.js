const CACHE = "ai-astro-v3";

self.addEventListener("install", (e) => {
  console.log("[SW] install");
  // Не блокируем install если precache падает — SW всё равно запустится
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      const urls = [
        "/offline.html",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/favicon.png",
        "/manifest.webmanifest",
      ];
      // Precache по одному — если один упал, пишем ошибку и продолжаем
      for (const url of urls) {
        try {
          await c.add(url);
          console.log("[SW] precached:", url);
        } catch (err) {
          console.warn("[SW] precache failed for", url, err);
        }
      }
    }).catch(err => console.warn("[SW] install cache error:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("[SW] activate");
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE).map((n) => {
          console.log("[SW] deleting old cache:", n);
          return caches.delete(n);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;

  // Навигация: сеть + fallback на offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy).catch(() => {}));
          return res;
        })
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Статика: кэш с сетевым fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/storage/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/moon/") ||
    /\.(png|jpg|jpeg|svg|woff2?|ttf|mp4)$/i.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy).catch(() => {}));
          }
          return res;
        }).catch(() => {
          if (/\.(png|jpg|jpeg)$/i.test(url.pathname)) {
            return new Response("", { headers: { "Content-Type": "image/png" } });
          }
        });
      })
    );
    return;
  }
});
