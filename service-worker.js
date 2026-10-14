const CACHE_NAME = 'finanzen-v2';
const urlsToCache = [
  './',
  './index.html',
  './financiamentos.html',
  './mercado.html',
  './economias.html',
  './login.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});