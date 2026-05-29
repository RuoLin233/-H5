// 给所有HTML注入清除旧SW的脚本（放在</body>前）
const fs = require('fs');
const path = require('path');

const HTML_FILES = [
  'index.html', 'record.html', 'budget.html',
  'chart.html', 'report.html', 'about.html'
];
const BASE = 'C:/Users/22204/Desktop/智财通H5';
const SCRIPT = '\n' +
  '  <!-- 清除旧版 Service Worker -->\n' +
  '  <script>\n' +
  '    if ("serviceWorker" in navigator) {\n' +
  '      navigator.serviceWorker.getRegistrations()\n' +
  '        .then(function(regs) { regs.forEach(r => r.unregister()); })\n' +
  '        .catch(function(){});\n' +
  '      caches && caches.keys && caches.keys()\n' +
  '        .then(function(keys) { keys.forEach(k => caches.delete(k)); })\n' +
  '        .catch(function(){});\n' +
  '    }\n' +
  '  </script>\n' +
  '</body>';

HTML_FILES.forEach(function(f) {
  const p = path.join(BASE, f);
  let html = fs.readFileSync(p, 'utf8');
  if (html.indexOf('serviceWorker.getRegistrations') === -1) {
    html = html.replace('</body>', SCRIPT);
    fs.writeFileSync(p, html, 'utf8');
    console.log('已注入: ' + f);
  } else {
    console.log('已存在: ' + f);
  }
});
console.log('完成！');
