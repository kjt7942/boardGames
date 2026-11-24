// 보드게임즈 서비스 워커: 네트워크 우선(항상 최신), 오프라인이면 저장본 사용
const CACHE = "boardgames-v4";
const FILES = ["./", "index.html", "manifest.json", "net.js", "firebase-config.js",
  "magic-labyrinth/", "magic-labyrinth/index.html", "wall-go/", "wall-go/index.html",
  "janggi/", "janggi/index.html", "janggi/engine.js", "baduk/", "baduk/index.html", "baduk/engine.js", "omok/", "omok/index.html", "omok/engine.js", "chess/", "chess/index.html", "chess/engine.js",
  "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true })));
});
