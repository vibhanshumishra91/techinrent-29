/* Techinrent service worker — enables installable PWA (admin app + site).
   Network-first so content stays fresh; never touches the booking API. */
const CACHE = 'tir-app-v3';
const SHELL = ['/admin', '/crm/crm.css', '/crm/crm.js', '/assets/logo.png', '/assets/style.css', '/assets/main.js', '/'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never cache POST (bookings, login)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // leave cross-origin (fonts, analytics) alone
  if (url.pathname.startsWith('/api/')) return;     // never cache the API
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('/admin') : undefined)))
  );
});
