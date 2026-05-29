// 此文件已废弃，仅用于注销旧版 Service Worker
self.addEventListener('install', function() {
  self.skipWaiting();
});
self.addEventListener('activate', function() {
  self.clients.claim();
  // 注销自己
  self.registration.unregister();
});
