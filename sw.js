const CACHE = 'cashflow-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/dashboard.css',
  './css/transactions.css',
  './css/charts.css',
  './css/goals.css',
  './css/calculator.css',
  './css/settings.css',
  './css/modal.css',
  './css/animations.css',
  './js/storage.js',
  './js/categories.js',
  './js/transactions.js',
  './js/goals.js',
  './js/charts.js',
  './js/calculator.js',
  './js/insights.js',
  './js/settings.js',
  './js/modal.js',
  './js/dashboard.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
