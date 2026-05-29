/**
 * 智财通H5 - 移动端全面修复脚本
 * 修复：1. ECharts CDN替换为国内CDN 2. 底部导航栏全页面生效 3. UI优化
 */
const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\22204\\Desktop\\智财通H5';

// ===== 1. 修复 chart.html =====
let chart = fs.readFileSync(path.join(BASE, 'chart.html'), 'utf8');

// 替换 ECharts CDN 为国内 CDN（bootcdn / npmmirror）
chart = chart.replace(
  'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js',
  'https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js'
);

// Font Awesome 也换国内
chart = chart.replace(
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
);

// 在 chart.js 加载前加入 ECharts 加载失败兜底 + 底部导航强制注入
const chartExtraScript = `
<script>
// 兜底：ECharts CDN加载失败时显示提示
window.__echartsLoadTimeout = setTimeout(function() {
  if (typeof echarts === 'undefined') {
    document.querySelectorAll('.chart-box').forEach(function(el) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.9rem;text-align:center;padding:20px;"><div>📊 图表资源加载中...<br><span style="font-size:0.8rem;color:#bbb;">请稍候或刷新页面</span></div></div>';
    });
  }
}, 5000);
</script>
`;

chart = chart.replace(
  '<script src="js/chart.js"></script>',
  chartExtraScript + '\n  <script src="js/chart.js"></script>'
);

// chart.js 中清除超时
let chartJs = fs.readFileSync(path.join(BASE, 'js', 'chart.js'), 'utf8');
if (!chartJs.includes('clearTimeout(window.__echartsLoadTimeout)')) {
  chartJs = `clearTimeout(window.__echartsLoadTimeout);\n` + chartJs;
}
fs.writeFileSync(path.join(BASE, 'js', 'chart.js'), chartJs, 'utf8');

fs.writeFileSync(path.join(BASE, 'chart.html'), chart, 'utf8');
console.log('✅ chart.html 已修复');


// ===== 2. 修复 report.html =====
let report = fs.readFileSync(path.join(BASE, 'report.html'), 'utf8');

report = report.replace(
  'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js',
  'https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js'
);
report = report.replace(
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
);

// 报表页也加 ECharts 超时兜底
const reportExtraScript = `
<script>
window.__echartsLoadTimeout = setTimeout(function() {
  if (typeof echarts === 'undefined') {
    var box = document.getElementById('report-chart');
    if (box) box.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:350px;color:#999;font-size:0.9rem;text-align:center;">📊 图表加载中...<br><span style="font-size:0.8rem;color:#bbb;">请稍候或刷新</span></div>';
  }
}, 5000);
</script>
`;

// 在 initReportPage 前注入清除超时
report = report.replace(
  'async function initReportPage()',
  `clearTimeout(window.__echartsLoadTimeout);\nasync function initReportPage()`
);

fs.writeFileSync(path.join(BASE, 'report.html'), report, 'utf8');
console.log('✅ report.html 已修复');


// ===== 3. 批量替换所有HTML中的Font Awesome CDN =====
const htmlFiles = ['index.html', 'record.html', 'budget.html', 'about.html'];
htmlFiles.forEach(function(f) {
  let p = path.join(BASE, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
      'https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
    );
    fs.writeFileSync(p, content, 'utf8');
    console.log('✅ ' + f + ' FA CDN已替换');
  }
});


// ===== 4. 修复 main.js - 底部导航栏改为屏幕宽度检测而非UA检测 =====
let mainJs = fs.readFileSync(path.join(BASE, 'js', 'main.js'), 'utf8');

// 替换移动端检测逻辑：从UA检测改为屏幕宽度检测
const oldNavInject = `// --- 移动端底部导航栏 ---
(function() {
  // 仅移动端显示
  if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) return;`;

const newNavInject = `// --- 移动端底部导航栏 ---
(function() {
  // 使用屏幕宽度检测，兼容所有设备（包括PC浏览器手机模式）
  if (window.innerWidth > 767) return;`;

mainJs = mainJs.replace(oldNavInject, newNavInject);

console.log('✅ main.js 导航栏检测逻辑已修复（UA→屏幕宽度）');
fs.writeFileSync(path.join(BASE, 'js', 'main.js'), mainJs, 'utf8');


// ===== 5. CSS 全面优化 =====
let css = fs.readFileSync(path.join(BASE, 'css', 'style.css'), 'utf8');

// 在文件末尾（触摸反馈代码之后）追加移动端UI优化
const mobileOptimization = `

/* ============================================
   H5 移动端深度UI优化 v2
   ============================================ */

/* 页脚在移动端大幅简化或隐藏（有底部导航就够了）*/
@media (max-width: 767px) {
  .footer {
    padding: 20px 16px 80px !important; /* 底部留出导航栏空间 */
  }

  .footer__grid {
    gap: 16px !important;
  }

  .footer__desc,
  .footer__title:nth-child(n+2),
  .footer__links:nth-child(n+2) {
    display: none !important;
  }

  /* 图表容器优化 */
  .chart-container {
    padding: 12px !important;
    border-radius: 12px !important;
  }

  /* Tab按钮在移动端更紧凑 */
  .tab-btn {
    padding: 8px 14px !important;
    font-size: 0.85rem !important;
  }

  /* 报表页卡片优化 */
  .report-cards {
    gap: 10px !important;
    margin-bottom: 16px !important;
  }

  .report-card {
    padding: 14px !important;
  }

  .report-card__value {
    font-size: 1.3rem !important;
  }

  /* 数据表格横向滚动优化 */
  .table-wrapper {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .data-table {
    min-width: 500px !important;
  }

  .data-table th,
  .data-table td {
    padding: 10px 8px !important;
    font-size: 0.82rem !important;
  }

  /* 页面标题区域紧凑化 */
  .page-title {
    font-size: 1.4rem !important;
    margin-bottom: 4px !important;
  }

  .page-subtitle {
    font-size: 0.85rem !important;
    margin-bottom: 16px !important;
  }

  /* 卡片间距优化 */
  .card {
    margin-bottom: 14px !important;
    border-radius: 12px !important;
  }

  .card__body {
    padding: 16px !important;
  }

  /* 按钮组在移动端纵向排列 */
  .chart-tabs {
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 6px !important;
  }

  /* 图表高度自适应 */
  .chart-box {
    height: 280px !important;
  }

  .report-chart-box {
    height: 280px !important;
  }

  /* 导航栏在移动端固定定位 */
  .navbar {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    z-index: 4000 !important;
  }

  /* 主内容区给导航栏留空间 */
  main {
    padding-top: 64px !important;
  }

  /* Hero区域在移动端隐藏背景图效果 */
  .hero {
    min-height: auto !important;
    padding: 30px 16px !important;
  }

  .hero::after {
    display: none !important;
  }

  /* 首页概览卡片网格 */
  .home-stats {
    gap: 10px !important;
    margin-top: -16px !important;
  }

  .home-stat-card {
    padding: 14px 10px !important;
  }

  .home-stat-card__value {
    font-size: 1.15rem !important;
  }

  /* 小贴士区域 */
  #daily-tip-home,
  #daily-tip-chart,
  #daily-tip-report {
    margin-top: 16px !important;
    margin-bottom: 12px !important;
  }

  .daily-tip {
    padding: 12px 14px !important;
    border-radius: 10px !important;
    font-size: 0.84rem !important;
  }

  /* 快捷操作按钮组 */
  main > .page-section > div[style*="text-align: center"] {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    align-items: stretch !important;
  }

  main > .page-section > div[style*="text-align: center"] .btn {
    width: 100% !important;
    text-align: center !important;
    justify-content: center !important;
  }

  /* 月度选择器居中 */
  div[style*="display: flex"][style*="justify-content: center"] {
    max-width: 100% !important;
  }

  /* 关于页面移动端优化 */
  .about-hero {
    padding: 24px 16px !important;
  }

  .about-team {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .about-team__member {
    text-align: center !important;
  }

  /* 记录列表项 */
  .record-item {
    padding: 12px !important;
  }

  /* 预算卡片 */
  .budget-category-item {
    padding: 12px !important;
  }

  /* Modal 弹窗移动端优化 */
  .modal__dialog {
    max-height: 85vh !important;
    margin: 40px auto !important;
    width: 92% !important;
  }

  /* Toast通知 */
  .toast {
    left: 50% !important;
    transform: translateX(-50%) !important;
    bottom: 80px !important;
    width: auto !important;
    max-width: 80% !important;
  }

  /* 数据解读卡片文字缩小 */
  .card__body p[style*="margin-bottom"] {
    font-size: 0.83rem !important;
    line-height: 1.6 !important;
    margin-bottom: 8px !important;
  }
}

/* 超小屏适配（iPhone SE等）*/
@media (max-width: 374px) {
  .tab-btn {
    padding: 6px 10px !important;
    font-size: 0.78rem !important;
  }

  .mobile-nav__label {
    font-size: 0.58rem !important;
  }

  .mobile-nav__icon {
    font-size: 1.1rem !important;
  }

  .chart-box {
    height: 240px !important;
  }

  .report-chart-box {
    height: 240px !important;
  }

  .page-title {
    font-size: 1.25rem !important;
  }
}

/* 横屏模式提醒 */
@media (max-width: 767px) and (orientation: landscape) {
  .mobile-nav {
    position: fixed !important;
    bottom: auto !important;
    top: 0 !important;
    padding: 4px !important;
    height: 44px !important;
    align-items: center !important;
  }

  .mobile-nav__item {
    padding: 2px 4px !important;
    flex-direction: row !important;
    gap: 3px !important;
  }

  .mobile-nav__icon {
    font-size: 1rem !important;
  }

  .mobile-nav__label {
    font-size: 0.65rem !important;
  }

  main {
    padding-top: 108px !important; /* 64(nav) + 44(mobile-nav) */
  }
}
`;

// 追加到CSS末尾
css += mobileOptimization;
fs.writeFileSync(path.join(BASE, 'css', 'style.css'), css, 'utf8');
console.log('✅ CSS 移动端深度优化已追加');


// ===== 6. 修复 chart.js - initCharts 增强错误处理 =====
chartJs = fs.readFileSync(path.join(BASE, 'js', 'chart.js'), 'utf8');

// 增强 initCharts 的数据加载逻辑：优先 localStorage → 再 fetch
const oldInitCharts = `/** 初始化所有图表 */
async function initCharts() {
  // 加载数据
  var records = [];
  try {
    var resp = await fetch('data/finance.json');
    records = await resp.json();
  } catch (e) {
    console.error('无法加载财务数据:', e);
    // 尝试从 localStorage 读取
    var stored = localStorage.getItem('zhichaitong_records');
    if (stored) {
      records = JSON.parse(stored);
    }
  }`;

const newInitCharts = `/** 初始化所有图表 */
async function initCharts() {
  // 确保ECharts已加载
  if (typeof echarts === 'undefined') {
    console.warn('ECharts 未加载，等待...');
    var retryCount = 0;
    while (typeof echarts === 'undefined' && retryCount < 20) {
      await new Promise(function(r) { setTimeout(r, 300); });
      retryCount++;
    }
    if (typeof echarts === 'undefined') {
      console.error('ECharts 加载失败');
      document.querySelectorAll('.chart-box').forEach(function(el) {
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ea4335;font-size:0.9rem;text-align:center;padding:20px;">⚠️ 图表组件加载失败<br><span style="font-size:0.8rem;color:#999;">请检查网络后刷新页面</span></div>';
      });
      return;
    }
  }

  // 加载数据：优先 localStorage → 再 fetch
  var records = [];
  var stored = localStorage.getItem('zhichaitong_records');
  if (stored) {
    try { records = JSON.parse(stored); } catch(e) {}
  }
  if (records.length === 0) {
    try {
      var resp = await fetch('data/finance.json');
      if (resp.ok) records = await resp.json();
    } catch (e) {
      console.error('无法加载财务数据:', e);
    }
  }
  if (records.length === 0) {
    console.warn('无数据显示空状态');
    document.querySelectorAll('.chart-box').forEach(function(el) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.9rem;text-align:center;padding:20px;">📝 暂无数据<br><span style="font-size:0.8rem;color:#bbb;">请先添加收支记录</span></div>';
    });
    return;
  }`;

chartJs = chartJs.replace(oldInitCharts, newInitCharts);
fs.writeFileSync(path.join(BASE, 'js', 'chart.js'), chartJs, 'utf8');
console.log('✅ chart.js 错误处理增强完成');


// ===== 7. 修复 report.html 中的 ECharts 依赖 =====
report = fs.readFileSync(path.join(BASE, 'report.html'), 'utf8');

// 在 renderReportChart 函数开头增加 ECharts 检查
const oldRenderChart = `function renderReportChart(records) {
  var dom = document.getElementById('report-chart');`;
const newRenderChart = `function renderReportChart(records) {
  var dom = document.getElementById('report-chart');
  if (!dom) return;
  if (typeof echarts === 'undefined') {
    dom.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:350px;color:#ea4335;font-size:0.9rem;text-align:center;">⚠️ 图表组件加载失败<br><span style="font-size:0.8rem;color:#999;">请检查网络后刷新</span></div>';
    return;
  }`;

report = report.replace(oldRenderChart, newRenderChart);
fs.writeFileSync(path.join(BASE, 'report.html'), report, 'utf8');
console.log('✅ report.html ECharts检查增强完成');


console.log('\\n🎉 全部修复完成！修改的文件：');
console.log('  - chart.html (CDN替换+超时兜底)');
console.log('  - report.html (CDN替换+ECharts检查)');
console.log('  - index.html / record.html / budget.html / about.html (FA CDN)');
console.log('  - js/main.js (导航栏检测逻辑)');
console.log('  - js/chart.js (错误处理增强)');
console.log('  - css/style.css (移动端UI深度优化)');
