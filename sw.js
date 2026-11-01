/* Klangwerkstatt: läuft auch ohne Internet. Version wird bei jedem Bau neu gesetzt. */
const CACHE = "klangwerkstatt-a95e5ea7";
const SOUNDS = "klangwerkstatt-sounds";   /* Instrument-Aufnahmen bleiben über Updates hinweg gespeichert */
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, {cache: "reload"}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== SOUNDS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const isSound = url.hostname === "gleitz.github.io" || url.hostname === "oramics.github.io";
  const same = url.origin === location.origin;
  if (!same && !isFont && !isSound) return;
  if (same && (req.mode === "navigate" || /\/$|\.html$|\.webmanifest$/.test(url.pathname))) {
    /* Die App selbst: immer zuerst aus dem Netz holen (damit Updates sofort ankommen), offline aus dem Speicher */
    e.respondWith(fetch(req, {cache: "no-store"}).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match("./index.html"))));
    return;
  }
  /* Klänge, Schriften, Symbole: einmal laden, dann aus dem Speicher */
  const store = isSound ? SOUNDS : CACHE;
  e.respondWith(caches.open(store).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    if (hit) return hit;
    const res = await fetch(req);
    if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
    return res;
  }));
});
