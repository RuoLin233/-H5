// 智财通 - Service Worker (离线缓存)
const CACHE_NAME = 'zhicaitong-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/record.html',
  '/budget.html',
  '/chart.html',
  '/report.html',
  '/about.html',
  '/css/style.css',
  '/js/main.js',
  '/js/chart.js',
  '/data/finance.json',
  '/data/budget.json',
  '/images/logo.jpg',
  '/images/hero-bg.jpg',
  '/images/app-scene.jpg',
  '/manifest.json'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，失败时回退网络
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      });
    })
  );
});
