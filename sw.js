// 智财通 - Service Worker (离线缓存)
const CACHE_NAME = 'zhicaitong-v2';

// 安装：跳过预缓存（避免首次加载卡死）
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败时回退缓存
self.addEventListener('fetch', function(e) {
  // 只缓存同源请求，不缓存CDN
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});
