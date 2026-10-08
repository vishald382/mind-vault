/* MindVault offline support. Tries the network first so updates show up at once,
   and falls back to the saved copy when there is no connection. */
const CACHE = "mindvault-v10";
const FILES = ["./","index.html","manifest.webmanifest","css/styles.css","js/data-assets.js","js/data-content.js","js/data-india.js","js/data-wisdom.js","js/pack-maharashtra.js","js/pack-india.js","js/pack-money.js","js/pack-thinkers.js","js/data-daily.js","js/data-daily-2.js","js/pack-arts.js","js/pack-business.js","js/pack-economics.js","js/pack-geography.js","js/pack-health.js","js/pack-india-culture.js","js/pack-india-economy.js","js/pack-india-history.js","js/pack-india-modern.js","js/pack-india-nature.js","js/pack-india-science.js","js/pack-lives.js","js/pack-mh-culture.js","js/pack-mh-places.js","js/pack-models.js","js/pack-mumbai-places.js","js/pack-mumbai-works.js","js/pack-philosophy.js","js/pack-psychology.js","js/pack-science-life.js","js/pack-science-physics.js","js/pack-strategy.js","js/pack-technology.js","js/pack-world-history-1.js","js/pack-world-history-2.js","js/pack-now-india.js","js/pack-now-mumbai.js","js/pack-now-tech.js","js/pack-now-world.js","js/pack-nature-india.js","js/pack-nature-plants.js","js/pack-nature-world.js","js/engine.js","js/topics.js","js/coach.js","js/ui-core.js","js/media.js","js/session.js","js/views.js","js/feed.js","js/daily.js","js/sync.js","js/profile.js","js/share.js","js/app.js","js/install.js","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
