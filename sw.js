/* Klangwerkstatt: läuft auch ohne Internet. Version wird bei jedem Bau neu gesetzt. */
const CACHE = "klangwerkstatt-3490b832";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const isSound = url.hostname === "gleitz.github.io" || url.hostname === "oramics.github.io";   /* Instrument-Aufnahmen */
  if (url.origin !== location.origin && !isFont && !isSound) return;
  /* Erst aus dem Speicher, im Hintergrund aktualisieren */
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
