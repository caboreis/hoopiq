// Cache version — change automatiquement à chaque déploiement
const CACHE_VERSION = "hoopiq-" + Date.now();

// Installation immédiate sans mettre en cache quoi que ce soit
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activation — supprime TOUS les anciens caches sans exception
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch — Network First TOUJOURS (plus de blank page au déploiement)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET uniquement, pas les cross-origin (ESPN, Supabase, etc.)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache uniquement les assets statiques immuables (pas HTML ni JS/CSS du bundle)
        if (
          response.ok &&
          !url.pathname.startsWith("/api/") &&
          (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json")
        ) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
