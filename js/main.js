/**
 * 智财通 - 主逻辑脚本
 * 记录管理、预算管理、工具函数
 */

/* ===================================================
   Storage Keys
   =================================================== */
const STORAGE_KEYS = {
  records: 'zhichaitong_records',
  budget: 'zhichaitong_budget'
};

/* ===================================================
   Data Helpers
   =================================================== */

/** 从 localStorage 获取记录，若无则从 finance.json 初始化 */
function getRecords() {
  let records = localStorage.getItem(STORAGE_KEYS.records);
  if (records) {
    return JSON.parse(records);
  }
  // 默认使用 fetch 异步加载，此处返回空数组作为同步回退
  return [];
}

/** 保存记录到 localStorage */
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
}

/** 从 localStorage 获取预算，若无则从 budget.json 初始化 */
function getBudget() {
  let budget = localStorage.getItem(STORAGE_KEYS.budget);
  if (budget) {
    return JSON.parse(budget);
  }
  return [];
}

/** 保存预算到 localStorage */
function saveBudget(budget) {
  localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(budget));
}

/** 异步初始化默认记录（从 finance.json 加载） */
async function initDefaultRecords() {
  if (localStorage.getItem(STORAGE_KEYS.records)) return;
  try {
    const resp = await fetch('data/finance.json');
    const data = await resp.json();
    saveRecords(data);
  } catch (e) {
    console.warn('无法加载默认收支数据:', e);
    saveRecords([]);
  }
}

/** 异步初始化默认预算（从 budget.json 加载） */
async function initDefaultBudget() {
  if (localStorage.getItem(STORAGE_KEYS.budget)) return;
  try {
    const resp = await fetch('data/budget.json');
    const data = await resp.json();
    saveBudget(data);
  } catch (e) {
    console.warn('无法加载默认预算数据:', e);
  }
}

/* ===================================================
   Utility Functions
   =================================================== */

/** 格式化金额为货币显示 */
function formatMoney(amount, showSymbol) {
  let sym = showSymbol === false ? '' : '¥';
  return sym + Number(amount).toFixed(2);
}

/** 获取今天的日期字符串 YYYY-MM-DD */
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** 获取当前月份的字符串 YYYY-MM */
function getCurrentMonthStr() {
  return getTodayStr().slice(0, 7);
}

/** 显示 Toast 通知 */
function showToast(message, type) {
  type = type || 'success';
  // 移除已有 toast
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function () {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

/** 设置导航当前激活状态 */
function setActiveNav() {
  var path = window.location.pathname;
  var links = document.querySelectorAll('.navbar__link');
  links.forEach(function (link) {
    link.classList.remove('navbar__link--active');
    var href = link.getAttribute('href');
    if (path.endsWith(href) || (href === 'index.html' && (path.endsWith('/') || path.endsWith('index.html')))) {
      link.classList.add('navbar__link--active');
    }
  });
}

/* ===================================================
   Category Definitions
   =================================================== */

var CATEGORIES = {
  income: ['工资', '理财收益', '兼职', '其他'],
  expense: ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '其他']
};

var CATEGORY_ICONS = {
  '工资': '💰',
  '理财收益': '📈',
  '兼职': '💼',
  '餐饮': '🍜',
  '交通': '🚇',
  '购物': '🛒',
  '住房': '🏠',
  '娱乐': '🎮',
  '医疗': '💊',
  '教育': '📚',
  '其他': '📦'
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📌';
}

/* ===================================================
   Record Helpers
   =================================================== */

/** 添加一条收支记录 */
function addRecord(record) {
  var records = getRecords();
  record.id = Date.now();
  records.unshift(record);
  saveRecords(records);
  return record;
}

/** 删除一条记录 */
function deleteRecord(id) {
  var records = getRecords();
  records = records.filter(function (r) { return r.id !== id; });
  saveRecords(records);
}

/** 获取当月记录 */
function getCurrentMonthRecords() {
  var month = getCurrentMonthStr();
  return getRecords().filter(function (r) { return r.date.startsWith(month); });
}

/** 获取指定月份的支出分类汇总 */
function getCategorySummary(records) {
  var summary = {};
  var expenseRecords = records.filter(function (r) { return r.type === 'expense'; });
  expenseRecords.forEach(function (r) {
    if (!summary[r.category]) summary[r.category] = 0;
    summary[r.category] += r.amount;
  });
  return summary;
}

/** 获取月度收支汇总 */
function getMonthlySummary(records) {
  var monthly = {};
  records.forEach(function (r) {
    var month = r.date.slice(0, 7);
    if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
    if (r.type === 'income') {
      monthly[month].income += r.amount;
    } else {
      monthly[month].expense += r.amount;
    }
  });
  return monthly;
}

/* ===================================================
   Budget Helpers
   =================================================== */

/** 获取当月预算信息 */
function getCurrentMonthBudget() {
  var month = getCurrentMonthStr();
  var budgets = getBudget();
  var found = budgets.find(function (b) { return b.month === month; });
  // 获取当月实际总支出
  var records = getRecords();
  var actualExpense = records
    .filter(function (r) { return r.type === 'expense' && r.date.startsWith(month); })
    .reduce(function (sum, r) { return sum + r.amount; }, 0);

  return {
    month: month,
    budget: found ? found.budget : 0,
    actual: actualExpense,
    remaining: (found ? found.budget : 0) - actualExpense,
    percent: found && found.budget > 0 ? Math.round((actualExpense / found.budget) * 100) : 0
  };
}

/** 获取当月各分类预算执行情况 */
function getCategoryBudgetDetail() {
  var records = getRecords();
  var month = getCurrentMonthStr();
  var expenseRecords = records.filter(function (r) { return r.type === 'expense' && r.date.startsWith(month); });

  // 每个分类的支出
  var categorySpent = {};
  var totalExpense = 0;
  expenseRecords.forEach(function (r) {
    if (!categorySpent[r.category]) categorySpent[r.category] = 0;
    categorySpent[r.category] += r.amount;
    totalExpense += r.amount;
  });

  // 为每个分类分配预算（按比例或平均）
  var totalBudget = getCurrentMonthBudget().budget;
  var categoryBudget = totalBudget / CATEGORIES.expense.length;

  // 从 localStorage 读取自定义预算（如果有的话）
  var customBudget = localStorage.getItem('zhichaitong_category_budget');
  var customMap = customBudget ? JSON.parse(customBudget) : {};

  return CATEGORIES.expense.map(function (cat) {
    var spent = categorySpent[cat] || 0;
    // 优先使用自定义预算，如果没有自定义且总预算>0则按比例分配，否则为0（无预算）
    var budget = (customMap[cat] !== undefined) ? customMap[cat] : (totalBudget > 0 ? categoryBudget : 0);
    return {
      category: cat,
      budget: budget,
      spent: spent,
      remaining: budget - spent,
      percent: budget > 0 ? Math.round((spent / budget) * 100) : 0
    };
  });
}

/* ===================================================
   Page Initialization
   =================================================== */

document.addEventListener('DOMContentLoaded', function () {
  setActiveNav();
});

/* ===================================================
   Navbar HTML Generator (for consistent use across pages)
   =================================================== */

function getNavbarHTML(activePage) {
  var pages = [
    { name: '首页', href: 'index.html' },
    { name: '记账', href: 'record.html' },
    { name: '预算', href: 'budget.html' },
    { name: '图表', href: 'chart.html' },
    { name: '报表', href: 'report.html' },
    { name: '关于', href: 'about.html' }
  ];

  var linksHTML = pages.map(function (p) {
    var activeClass = p.href === activePage ? ' navbar__link--active' : '';
    return '<a href="' + p.href + '" class="navbar__link' + activeClass + '">' + p.name + '</a>';
  }).join('\n            ');

  return '<nav class="navbar">\n' +
    '  <div class="navbar__inner">\n' +
    '    <a href="index.html" class="navbar__logo">\n' +
    '      <span class="navbar__logo-icon">💰</span>\n' +
    '      智财通\n' +
    '    </a>\n' +
    '    <input type="checkbox" id="nav-toggle" class="navbar__toggle-checkbox">\n' +
    '    <label for="nav-toggle" class="navbar__hamburger">\n' +
    '      <span class="navbar__hamburger-line"></span>\n' +
    '      <span class="navbar__hamburger-line"></span>\n' +
    '      <span class="navbar__hamburger-line"></span>\n' +
    '    </label>\n' +
    '    <div class="navbar__links">\n' +
    '      ' + linksHTML + '\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</nav>';
}

/* ===================================================
   Footer HTML Generator
   =================================================== */

function getFooterHTML() {
  return '<footer class="footer">\n' +
    '  <div class="footer__inner">\n' +
    '    <div class="footer__grid">\n' +
    '      <div>\n' +
    '        <p class="footer__brand">💰 智财通</p>\n' +
    '        <p class="footer__desc">智能个人财务管理平台，让每一笔收支都有迹可循，轻松掌控财务状况。</p>\n' +
    '      </div>\n' +
    '      <div>\n' +
    '        <p class="footer__title">快速链接</p>\n' +
    '        <div class="footer__links">\n' +
    '          <a href="index.html" class="footer__link">首页</a>\n' +
    '          <a href="record.html" class="footer__link">记账</a>\n' +
    '          <a href="budget.html" class="footer__link">预算</a>\n' +
    '          <a href="chart.html" class="footer__link">图表</a>\n' +
    '          <a href="report.html" class="footer__link">报表</a>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div>\n' +
    '        <p class="footer__title">联系方式</p>\n' +
    '        <div class="footer__links">\n' +
    '          <span class="footer__link">📧 zhicaitong@example.com</span>\n' +
    '          <span class="footer__link">📞 400-888-XXXX</span>\n' +
    '          <span class="footer__link">📍 在线客服支持</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="footer__bottom">\n' +
    '      © 2026 智财通 | AI赋能新生态 期末课程项目 | 保留所有权利\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>';
}

// ============================================
// 随机护眼背景色（仅浅色模式生效，深色模式不覆盖）
// ============================================
(function() {
  var isDark = localStorage.getItem('zhichaitong_theme') === 'dark';
  if (isDark) return; // 深色模式下跳过护眼色

  var palettes = [
    { bg: '#f0f4f8', text: '#1a2b3c', textSec: '#4a5d6e', card: '#ffffff', border: '#d8e2ec' },  // 雾霾蓝
    { bg: '#fef9f3', text: '#2d2520', textSec: '#5c4f45', card: '#ffffff', border: '#e8ddd0' },  // 暖米色
    { bg: '#f5f0fa', text: '#2a1f3d', textSec: '#554770', card: '#ffffff', border: '#ddd6e8' },  // 淡紫雾
    { bg: '#f0faf4', text: '#1a2f24', textSec: '#3d5c4a', card: '#ffffff', border: '#cde0d4' },  // 薄荷绿
    { bg: '#faf5f0', text: '#2d2418', textSec: '#5c4d38', card: '#ffffff', border: '#e2d8cc' },  // 奶茶色
    { bg: '#f4f0f8', text: '#282038', textSec: '#50456a', card: '#ffffff', border: '#d8d0e4' }   // 薰衣草
  ];
  var pick = palettes[Math.floor(Math.random() * palettes.length)];
  document.documentElement.style.setProperty('--color-bg', pick.bg);
  document.documentElement.style.setProperty('--color-text', pick.text);
  document.documentElement.style.setProperty('--color-text-secondary', pick.textSec);
  document.documentElement.style.setProperty('--color-white', pick.card);
  document.documentElement.style.setProperty('--color-border', pick.border);
})();
// ============================================
// 优化3: 导航栏滚动阴影
// ============================================
(function() {
  var nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
      nav.classList.add('navbar--scrolled');
    } else {
      nav.classList.remove('navbar--scrolled');
    }
  }, { passive: true });
})();

// ============================================
// 优化4: 数字滚动动画
// ============================================
function animateNumber(el, target, duration) {
  if (!el || isNaN(target)) return;
  var start = 0;
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    // easeOutExpo
    var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    var current = start + (target - start) * eased;
    el.textContent = '¥' + current.toFixed(2);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = '¥' + target.toFixed(2);
  }
  requestAnimationFrame(step);
}

// 护眼色应用函数（供深色模式切换回浅色时调用）
function applyLightPalette() {
  var palettes = [
    { bg: '#f0f4f8', text: '#1a2b3c', textSec: '#4a5d6e', card: '#ffffff', border: '#d8e2ec' },
    { bg: '#fef9f3', text: '#2d2520', textSec: '#5c4f45', card: '#ffffff', border: '#e8ddd0' },
    { bg: '#f5f0fa', text: '#2a1f3d', textSec: '#554770', card: '#ffffff', border: '#ddd6e8' },
    { bg: '#f0faf4', text: '#1a2f24', textSec: '#3d5c4a', card: '#ffffff', border: '#cde0d4' },
    { bg: '#faf5f0', text: '#2d2418', textSec: '#5c4d38', card: '#ffffff', border: '#e2d8cc' },
    { bg: '#f4f0f8', text: '#282038', textSec: '#50456a', card: '#ffffff', border: '#d8d0e4' }
  ];
  var pick = palettes[Math.floor(Math.random() * palettes.length)];
  document.documentElement.style.setProperty('--color-bg', pick.bg);
  document.documentElement.style.setProperty('--color-text', pick.text);
  document.documentElement.style.setProperty('--color-text-secondary', pick.textSec);
  document.documentElement.style.setProperty('--color-white', pick.card);
  document.documentElement.style.setProperty('--color-border', pick.border);
}

// ============================================
// 优化7: 深色模式切换（所有页面导航栏加按钮）
// ============================================
(function() {
  // 在每个页面的导航栏右侧插入切换按钮
  function injectThemeToggle() {
    var inner = document.querySelector('.navbar__inner');
    if (!inner || inner.querySelector('.theme-toggle')) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = '切换深色/浅色模式';
    btn.innerHTML = '🌙';
    inner.appendChild(btn);

    // 恢复用户偏好
    var saved = localStorage.getItem('zhichaitong_theme') || 'light';
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.innerHTML = '☀️';
    }

    btn.addEventListener('click', function() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        btn.innerHTML = '🌙';
        localStorage.setItem('zhichaitong_theme', 'light');
        // 切回浅色模式，重新应用随机护眼色
        applyLightPalette();
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        btn.innerHTML = '☀️';
        localStorage.setItem('zhichaitong_theme', 'dark');
        // 切换深色模式时清除内联护眼色变量，让CSS深色变量生效
        document.documentElement.style.removeProperty('--color-bg');
        document.documentElement.style.removeProperty('--color-text');
        document.documentElement.style.removeProperty('--color-text-secondary');
        document.documentElement.style.removeProperty('--color-white');
        document.documentElement.style.removeProperty('--color-border');
      }
      // 重绘ECharts图表（如果存在）
      if (typeof echarts !== 'undefined') {
        echarts.getInstanceByDom(document.getElementById('chart-pie')) && echarts.getInstanceByDom(document.getElementById('chart-pie')).resize();
        echarts.getInstanceByDom(document.getElementById('chart-line')) && echarts.getInstanceByDom(document.getElementById('chart-line')).resize();
        echarts.getInstanceByDom(document.getElementById('chart-bar')) && echarts.getInstanceByDom(document.getElementById('chart-bar')).resize();
        echarts.getInstanceByDom(document.getElementById('report-chart')) && echarts.getInstanceByDom(document.getElementById('report-chart')).resize();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectThemeToggle);
  } else {
    injectThemeToggle();
  }
})();

// ============================================
// 优化8: 每日小贴士（约100条，70%财务+30%梗，每次刷新随机）
// ============================================
var DAILY_TIPS = [
  // ===== 财务贴士 =====
  { icon: '💡', text: '<strong>50-30-20法则：</strong>将收入的50%用于必要支出，30%用于个人需求，20%用于储蓄和还债。' },
  { icon: '🎯', text: '<strong>记账第一步：</strong>不需要每笔都记，先从记录大额支出开始，养成习惯后再细化。' },
  { icon: '📱', text: '<strong>无现金消费陷阱：</strong>移动支付让花钱变得\u201C无痛感\u201D，建议设置每日消费上限提醒。' },
  { icon: '🏦', text: '<strong>紧急备用金：</strong>建议存够3-6个月的生活费作为应急基金，以备不时之需。' },
  { icon: '🍜', text: '<strong>餐饮省钱技巧：</strong>自己做饭比外卖便宜60%以上，每周做2-3次饭，一年能省好几千！' },
  { icon: '🛒', text: '<strong>购物冷静期：</strong>看到想买的东西，先放购物车24小时再决定，80%的冲动消费会消失。' },
  { icon: '📊', text: '<strong>定期复盘：</strong>每月末花15分钟看看自己的收支报表，比任何理财课程都管用。' },
  { icon: '☕', text: '<strong>拿铁效应：</strong>每天一杯30元的咖啡，一年就是10950元。小钱积少成多，值得注意。' },
  { icon: '💰', text: '<strong>收入-储蓄=支出：</strong>发工资后先把储蓄部分转走，剩下的才是可以花的钱，而不是反过来。' },
  { icon: '🎮', text: '<strong>娱乐预算控制：</strong>游戏、视频会员等订阅服务定期检查，不常用的及时取消，每年能省数百元。' },
  { icon: '📈', text: '<strong>复利的力量：</strong>每月存500元，年化5%收益，5年后就是34000+元。越早开始越好！' },
  { icon: '🔔', text: '<strong>账单日提醒：</strong>信用卡/花呗还款日前3天设提醒，避免逾期影响信用分。' },
  { icon: '🏠', text: '<strong>房租支出红线：</strong>房租或房贷尽量不要超过月收入的30%，否则会严重影响生活质量。' },
  { icon: '🛒', text: '<strong>超市购物技巧：</strong>吃饱了再去超市，饥饿状态下购物会多花约20%的钱！' },
  { icon: '💳', text: '<strong>信用卡使用建议：</strong>信用卡不是额外的钱，是未来的自己要还的债，理性消费。' },
  { icon: '📆', text: '<strong>一年两次大复盘：</strong>建议每年6月和12月做一次深度财务复盘，调整下半年的预算分配。' },
  { icon: '🌍', text: '<strong>旅行基金：</strong>想出去玩？提前半年开始每月存旅行基金，比临时刷信用卡舒服多了。' },
  { icon: '🎓', text: '<strong>自我投资最划算：</strong>花钱学技能、买书、上课，这些支出长期来看回报率最高。' },
  { icon: '🏥', text: '<strong>医疗备用金：</strong>除了紧急备用金，建议单独存一笔医疗备用金，万一生病不怕措手不及。' },
  { icon: '📦', text: '<strong>订阅服务清理：</strong>Netflix、Spotify、各种会员……每季度检查一次，取消不用的，一年能省上千。' },
  { icon: '💹', text: '<strong>基金定投：</strong>每个月固定日期买固定金额的基金，平摊成本，适合懒人理财。' },
  { icon: '🧾', text: '<strong>报销及时跟进：</strong>公司报销、医保报销，发生后一周内提交，越拖越容易忘。' },
  { icon: '📑', text: '<strong>电子发票管理：</strong>用邮箱或云盘专门存电子发票，报销和退税时找起来超方便。' },
  { icon: '🪙', text: '<strong>零钱集中管理：</strong>支付宝、微信、现金的零钱，月底统一归集，积少成多可能有惊喜。' },
  { icon: '🏦', text: '<strong>银行卡管理费：</strong>不用的银行卡及时注销，有些卡每年收10元年费，不知不觉扣了好几年。' },
  { icon: '📈', text: '<strong>不要追涨杀跌：</strong>投资理财第一要义是心态，看到大跌就抛是最容易亏钱的操作。' },
  { icon: '💰', text: '<strong>年终奖规划：</strong>年终奖到手后，建议50%存起来，30%还债/投资，20%奖励自己。' },
  { icon: '🎁', text: '<strong>礼物预算：</strong>生日、节日礼物提前列入预算，避免临时抱佛脚超支。' },
  { icon: '📊', text: '<strong>收入多元化：</strong>工资是最稳定的收入，但也最危险——试着发展一份副业或被动收入吧！' },
  { icon: '🏠', text: '<strong>租房 vs 买房：</strong>年轻人先别急着买房，租房省下的钱用来投资，灵活性更高。' },
  { icon: '📱', text: '<strong>手机套餐优化：</strong>检查一下你的手机套餐，很多人每月的话费比实际需要高出30-50%。' },
  { icon: '🚗', text: '<strong>出行成本计算：</strong>打车 vs 地铁 vs 骑车，算一下每次出行的真实成本，选最划算的。' },
  { icon: '🛒', text: '<strong>双十一冷静指南：</strong>列好清单再买，不凑单、不跨店满减，只买真正需要的东西。' },
  { icon: '💡', text: '<strong>水电省钱小技巧：</strong>空调26\u00B0C最省电，LED灯泡比普通灯泡省80%电，养成随手关灯的习惯。' },
  { icon: '📊', text: '<strong>记账App选择：</strong>适合自己的才是最好的，不要因为某个App好看就频繁换，数据迁移很麻烦。' },
  { icon: '🎯', text: '<strong>设定SMART财务目标：</strong>具体(S)、可衡量(M)、可达成(A)、相关(R)、有时限(T)——比如\u201C半年存10000元\u201D而不是\u201C多存点钱\u201D。' },
  { icon: '💰', text: '<strong>年终奖计税规划：</strong>年终奖单独计税 vs 合并计税，哪种更划算？12月前算一下，能省好几千。' },
  { icon: '📈', text: '<strong>通胀的影响：</strong>钱放枕头底下每年贬值约2-3%，适当投资才能跑赢通胀。' },
  { icon: '🏦', text: '<strong>分散存款风险：</strong>50万以上的存款建议分散到不同银行，存款保险只保50万。' },
  { icon: '🎓', text: '<strong>考证值得吗：</strong>先算ROI（投资回报率）！有些证书报名费+培训费上万，但薪资涨幅为零，慎重。' },
  { icon: '📦', text: '<strong>退货时效注意：</strong>网购大部分支持7天无理由，收到货不满意赶紧退，别拖到过期。' },
  { icon: '🌏', text: '<strong>汇率波动留意：</strong>有外币消费/还款需求的话，关注一下汇率，能省一点是一点。' },
  { icon: '🛡️', text: '<strong>保险配置顺序：</strong>先配医保和意外险，再考虑重疾和寿险，理财型保险最后考虑。' },
  { icon: '📊', text: '<strong>财务自由度公式：</strong>被动收入 \u00F7 月支出 \u00D7 100% = 财务自由度，达到100%就可以退休啦！' },
  { icon: '💡', text: '<strong>节能家电回收：</strong>以旧换新买家电，旧机回收还能抵一部分钱，比直接扔了划算。' },
  { icon: '📱', text: '<strong>免息分期陷阱：</strong>看起来免息，实际上可能收了手续费，算一下真实年化利率再决定。' },
  { icon: '🎁', text: '<strong>生日礼物DIY：</strong>亲手做的礼物比买的更有意义，成本也更低，一举两得！' },
  { icon: '📈', text: '<strong>指数基金 vs 主动基金：</strong>长期看，大部分主动基金跑不赢指数基金，而且管理费还更便宜。' },
  { icon: '🏠', text: '<strong>搬家省钱攻略：</strong>淡季搬家（11月-2月）比旺季便宜30%以上，能约朋友帮忙就别找搬家公司。' },
  { icon: '📦', text: '<strong>快递退货运费险：</strong>网购时勾选运费险，退货时运费有保障，特别适合容易尺码不合适的衣服鞋子。' },
  { icon: '💰', text: '<strong>副业收入报税：</strong>接私活、做自媒体有收入的，记得按规定报税，别等被查了再后悔。' },
  { icon: '🎯', text: '<strong>消费前问自己三个问题：</strong>我真的需要吗？我有类似的东西吗？30天后我还想要吗？' },
  { icon: '📊', text: '<strong>财务健康体检：</strong>净资产为正、有3-6个月备用金、没有高息负债 = 财务健康，你来测测看？' },
  { icon: '🛡️', text: '<strong>警惕理财诈骗：</strong>年化收益超过8%的要打问号，超过12%的基本都是骗局，守护好自己的钱袋子。' },
  { icon: '📱', text: '<strong>免密支付关闭：</strong>小额免密支付虽然方便，但容易在不知情的情况下被连续扣款，建议关掉。' },
  { icon: '🎓', text: '<strong>继续教育抵税：</strong>报税时别忘了填报继续教育专项附加扣除，每年可以抵扣一部分个税。' },
  { icon: '🏦', text: '<strong>工资卡与消费卡分离：</strong>工资到账后马上转一部分到消费卡，只用消费卡里的钱，强制储蓄。' },
  { icon: '📈', text: '<strong>不要All in一只股票：</strong>分散投资是降低风险的最基本操作，不要把鸡蛋放在同一个篮子里。' },
  { icon: '🍜', text: '<strong>外卖红包技巧：</strong>外卖App的红包不是每天都值得用，满30减5不如直接买20的套餐来得实在。' },
  { icon: '🎁', text: '<strong>朋友聚餐AA制：</strong>别不好意思提AA，真正的朋友不会因为你提议AA而看不起你。' },
  { icon: '📊', text: '<strong>攀比心理是财务杀手：</strong>朋友圈里别人晒的新包新鞋，可能是刷信用卡买的，别拿自己的存款去比别人的负债。' },
  { icon: '💡', text: '<strong>节能习惯养成：</strong>拔掉不用的充电器、用冷水洗衣服、缩短洗澡时间，这些方法一年能省几百水电费。' },
  { icon: '📱', text: '<strong>二手平台淘宝：</strong>买电子书阅读器、键盘、耳机这些，闲鱼上的95新品往往只要新品价格的50-70%。' },
  { icon: '🏠', text: '<strong>租房合同细节：</strong>签约前看清押金退还条件、维修责任归属，避免退租时被无理扣钱。' },
  { icon: '📊', text: '<strong>工资涨幅 vs通胀率：</strong>如果加薪低于通胀率，实际购买力其实在下滑，理财更要跟上。' },
  { icon: '🎯', text: '<strong>存钱小游戏：</strong>设定一个周挑战，比如\u201C这一周不外食\u201D，完成后的成就感比省钱更让人开心！' },
  { icon: '💡', text: '<strong>闲置变现：</strong>不穿的衣服、不看的书、不用的电子产品，闲鱼卖掉既是整理也是回血。' },
  { icon: '📊', text: '<strong>投资期限匹配：</strong>短期要用的钱买货币基金，中期买债券/定期，长期才适合配置股票。' },
  { icon: '🛡️', text: '<strong>千万别碰网贷：</strong>网贷年化利率往往20%以上，借了一次就掉进深渊，信用卡利率都比它低得多。' },
  { icon: '🎓', text: '<strong>知识付费冷静期：</strong>看到付费课程先看看免费内容是不是够用，很多99元的课内容跟免费B站视频一样。' },

  // ===== 可爱梗 / 搞笑贴士 =====
  { icon: '🦆', text: '厄了鸭提醒您：记账就像写日记，不记会忘，记了会胖……啊不对，是会有钱💰' },
  { icon: '🍜', text: '有人问：为什么我越记越穷？因为之前根本不知道自己竟然花了这么多钱😭 记账是照妖镜！' },
  { icon: '🦆', text: '本鸭的理财哲学：钱不是万能的，但没有钱是万万不能的鸭～ 🦆💸' },
  { icon: '🎮', text: '游戏里氪金的时候手速飞快，记账的时候……\u201C这不算支出吧？？\u201D —— 否，这算😤' },
  { icon: '🍜', text: '据说80%的人月初是\u201C巴菲特\u201D，月中是\u201C普通打工人\u201D，月末是\u201C乞讨鸭\u201D🦆，你是哪个阶段？' },
  { icon: '📊', text: '记账最痛苦的不是记，是看到月度报表那一刻——\u201C我哪来这么多钱吃外卖的？？？\u201D🤯' },
  { icon: '🦆', text: '厄了鸭金句：钱花了可以再赚，但看完报表后的心痛是无法用钱治愈的🦆💔' },
  { icon: '🎁', text: '双十一最贵的不是买买买，是\u201C凑单\u201D——为了减50块，多花了200块，这数学是谁教的？📉' },
  { icon: '🏦', text: '银行短信提醒：\u201C您尾号xxxx的账户支出xxx元\u201D——这是每月最让人心跳加速的短信📱💓' },
  { icon: '🦆', text: '本鸭宣布：智财通用户自动获得\u201C理财小能手\u201D称号，有效期至……下次超支之前🎖️' },
  { icon: '🍜', text: '有人说\u201C钱是王八蛋\u201D，但本鸭觉得钱明明是小天使，只是翅膀有时候会断掉而已😇' },
  { icon: '📱', text: '当代年轻人四大幻觉：今天不花钱、这个月能存下钱、卸载淘宝能省钱、和前任还能当朋友🙃' },
  { icon: '🎮', text: 'Steam游戏打折的时候：我一定会玩的！一个月后：这游戏怎么在我的库里吃灰🎮💨' },
  { icon: '🦆', text: '厄了鸭背书时间：不乱花钱 = 变相赚钱，所以本鸭今天没花钱 = 今天赚了100块！这逻辑无懈可击🦆✨' },
  { icon: '📊', text: '报表上的餐饮支出占比60%的时候，说明你该学做饭了，不是说明你是个美食家🍳' },
  { icon: '🛒', text: '购物车里有20件东西，最后买了19件——这就是所谓的\u201C理性消费\u201D🙂' },
  { icon: '🦆', text: '本鸭的省钱秘诀：把想买的东西截图设为手机壁纸，三天后你还想看它吗？不想？那就省了🦆📱' },
  { icon: '💰', text: '工资到账短信念：\u201C代发工资xxx元\u201D——这是每个月最幸福也最短暂的瞬间💸✨' },
  { icon: '🎯', text: '新年愿望：今年一定要存到钱！年中愿望：……先活下去吧🥲 年底愿望：明年一定行！' },
  { icon: '🦆', text: '使用智财通满30天可解锁隐藏成就：终于知道自己钱去哪了！🏆 快来挑战吧～' },
  { icon: '🍜', text: '有人说省钱就要吃土，但本鸭认为：炸串该吃还得吃，钱可以再赚，但快乐买不到🍢' },
  { icon: '📱', text: '花呗还款日的前一天晚上：我发誓下个月一定理性消费！——下个月15号：真香🙃' },
  { icon: '🦆', text: '厄了鸭陪伴你的每一天：记账、省钱、变有钱……然后继续记账、继续省钱、继续努力变有钱🦆💪' },
  { icon: '🎮', text: '如果你能坚持一个月不买游戏/皮肤/周边，你就已经超过了90%的年轻人了🎮🏆' },
  { icon: '📊', text: '看着报表上密密麻麻的支出，突然明白了一个道理：原来我这么努力地花钱，也是一种勤奋啊😤' },
  { icon: '🦆', text: '本鸭今天学到了一个新词：精致穷。意思就是：看起来光鲜亮丽，实际上余额为零。别做这样的人鸭🦆' },
  { icon: '🛒', text: '快递盒堆成山的时候，就是你该反思人生的时候了📦 智财通可以帮你——在买之前就反思！' },
  { icon: '💡', text: '据说在钱包里放一张100元钞票然后告诉自己\u201C这是 emergency only\u201D，这种方法的有效期是……半天😂' },
  { icon: '🦆', text: '厄了鸭今日感悟：月光族不可怕，可怕的是月光了还不知道光在哪……智财通帮你找到光！✨🦆' },
  { icon: '🎮', text: '游戏氪金前一念咒语：氪了这单会不会影响我明天的奶茶预算？如果是，那就不氪😤' },
  { icon: '🌙', text: '深夜刷购物App = 第二天醒来：我昨晚到底买了什么？？？夜晚的你不是你，是冲动的魔鬼🌚' },
  { icon: '🍜', text: '花100块吃一顿好的：值得！花100块买一个用三次就吃灰的小家电：血亏！学会区分\u201C体验消费\u201D和\u201C垃圾消费\u201D🧐' },
  { icon: '🦆', text: '本鸭郑重声明：所有\u201C就这一次\u201D的冲动消费，最后都会变成\u201C又来了\u201D的固定支出🦆💸' },
  { icon: '📊', text: '月末查账单发现自己竟然是隐形富豪——隐形到连自己都看不见的那种😎💸' }
];

// 随机打乱贴士顺序（每次加载不同）
(function() {
  for (var i = DAILY_TIPS.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = DAILY_TIPS[i];
    DAILY_TIPS[i] = DAILY_TIPS[j];
    DAILY_TIPS[j] = temp;
  }
})();

function showDailyTip(containerSelector) {
  var container = document.querySelector(containerSelector);
  if (!container) return;
  // 每次刷新随机选一条
  var idx = Math.floor(Math.random() * DAILY_TIPS.length);
  var tip = DAILY_TIPS[idx];
  container.innerHTML =
    '<div class="daily-tip">' +
      '<span class="daily-tip__icon">' + tip.icon + '</span>' +
      '<div class="daily-tip__text">' + tip.text + '</div>' +
    '</div>';
}


// 优化9: 首页数据概览卡片
// ============================================
function renderHomeStats() {
  var container = document.getElementById('home-stats');
  if (!container) return;

  var records = getRecords();
  var month = getCurrentMonthStr();
  var monthRecords = records.filter(function(r) { return r.date.startsWith(month); });

  var income = monthRecords.filter(function(r) { return r.type === 'income'; })
    .reduce(function(s, r) { return s + r.amount; }, 0);
  var expense = monthRecords.filter(function(r) { return r.type === 'expense'; })
    .reduce(function(s, r) { return s + r.amount; }, 0);
  var net = income - expense;

  container.innerHTML =
    '<div class="home-stat-card">' +
      '<div class="home-stat-card__icon">💰</div>' +
      '<div class="home-stat-card__value home-stat-card__value--income" id="stat-income">¥0.00</div>' +
      '<div class="home-stat-card__label">本月收入</div>' +
    '</div>' +
    '<div class="home-stat-card">' +
      '<div class="home-stat-card__icon">💸</div>' +
      '<div class="home-stat-card__value home-stat-card__value--expense" id="stat-expense">¥0.00</div>' +
      '<div class="home-stat-card__label">本月支出</div>' +
    '</div>' +
    '<div class="home-stat-card">' +
      '<div class="home-stat-card__icon">📊</div>' +
      '<div class="home-stat-card__value home-stat-card__value--net" id="stat-net">¥0.00</div>' +
      '<div class="home-stat-card__label">本月结余</div>' +
    '</div>';

  // 数字滚动动画
  setTimeout(function() {
    animateNumber(document.getElementById('stat-income'), income, 800);
    animateNumber(document.getElementById('stat-expense'), expense, 800);
    animateNumber(document.getElementById('stat-net'), net, 1000);
  }, 300);
}

// ============================================
// 优化10: 键盘快捷键
// ============================================
(function() {
  document.addEventListener('keydown', function(e) {
    // 忽略输入框内的按键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch(e.key.toLowerCase()) {
      case 'n':
        // N -> 跳转记账页
        window.location.href = 'record.html';
        break;
      case 'b':
        // B -> 跳转预算页
        window.location.href = 'budget.html';
        break;
      case 'c':
        // C -> 跳转图表页
        window.location.href = 'chart.html';
        break;
      case 'r':
        // R -> 跳转报表页
        window.location.href = 'report.html';
        break;
      case 'h':
      case 'home':
        // H/Home -> 首页
        window.location.href = 'index.html';
        break;
      case 'escape':
        // Esc -> 关闭模态框
        var modal = document.querySelector('.modal-overlay--visible');
        if (modal) modal.classList.remove('modal-overlay--visible');
        break;
    }
  });
})();

// ============================================
// 优化6: 预算超支浮动提醒
// ============================================
function checkBudgetAlerts() {
  var details = getCategoryBudgetDetail();
  var alerted = JSON.parse(localStorage.getItem('zhichaitong_budget_alerted') || '{}');
  var today = getTodayStr();
  var hasNewAlert = false;

  details.forEach(function(d) {
    var key = d.category + '_' + today;
    if (d.percent >= 100 && !alerted[key]) {
      showBudgetToast(d.category, d.percent, true);
      alerted[key] = 'danger';
      hasNewAlert = true;
    } else if (d.percent >= 80 && !alerted[key]) {
      showBudgetToast(d.category, d.percent, false);
      alerted[key] = 'warn';
      hasNewAlert = true;
    }
  });

  if (hasNewAlert) {
    localStorage.setItem('zhichaitong_budget_alerted', JSON.stringify(alerted));
  }
}

function showBudgetToast(category, percent, isDanger) {
  var toast = document.createElement('div');
  toast.className = 'budget-toast ' + (isDanger ? 'budget-toast--danger' : 'budget-toast--warn');
  toast.innerHTML =
    (isDanger ? '🚨' : '⚠️') +
    ' <strong>' + category + '</strong> 已使用 ' + percent + '%' +
    (isDanger ? '，已超支！' : '，接近预算上限') +
    '<span class="budget-toast__close" onclick="this.parentElement.remove()">✕</span>';
  document.body.appendChild(toast);

  // 5秒后自动消失
  setTimeout(function() {
    if (toast.parentNode) toast.style.opacity = '0';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400);
  }, 5000);
}

// ============================================
// 新手引导教程
// ============================================
(function() {
  var TOUR_KEY = 'zhichaitong_tour_done';

  function getTourHTML() {
    return '<div class="tour-overlay" id="tour-overlay">' +
      '<div class="tour-modal">' +
        '<div class="tour-modal__header">' +
          '<span class="tour-modal__icon">🎓</span>' +
          '<h2 class="tour-modal__title">欢迎使用智财通！</h2>' +
          '<p class="tour-modal__subtitle">3分钟快速上手，让记账变得简单</p>' +
        '</div>' +
        '<div class="tour-modal__body">' +
          '<div class="tour-step">' +
            '<span class="tour-step__num">1</span>' +
            '<div class="tour-step__content">' +
              '<h4>🏠 首页概览</h4>' +
              '<p>查看本月收支汇总、理财小贴士，快速了解财务状况</p>' +
            '</div>' +
          '</div>' +
          '<div class="tour-step">' +
            '<span class="tour-step__num">2</span>' +
            '<div class="tour-step__content">' +
              '<h4>📝 日常记账</h4>' +
              '<p>选择收入/支出类型，填写金额和分类，3秒完成一笔记录</p>' +
            '</div>' +
          '</div>' +
          '<div class="tour-step">' +
            '<span class="tour-step__num">3</span>' +
            '<div class="tour-step__content">' +
              '<h4>💰 预算管理</h4>' +
              '<p>设定月度预算，系统自动追踪执行进度，超支会发出提醒</p>' +
            '</div>' +
          '</div>' +
          '<div class="tour-step">' +
            '<span class="tour-step__num">4</span>' +
            '<div class="tour-step__content">' +
              '<h4>📊 数据可视化</h4>' +
              '<p>饼图、折线图、柱状图多维度分析消费习惯</p>' +
            '</div>' +
          '</div>' +
          '<div class="tour-step">' +
            '<span class="tour-step__num">5</span>' +
            '<div class="tour-step__content">' +
              '<h4>⌨️ 快捷键</h4>' +
              '<p>按 <kbd>N</kbd> 记账 · <kbd>B</kbd> 预算 · <kbd>C</kbd> 图表 · <kbd>R</kbd> 报表 · <kbd>Esc</kbd> 关闭弹窗</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tour-modal__footer">' +
          '<button class="btn btn--secondary" id="tour-skip" style="color:var(--color-text-secondary);border-color:var(--color-border);">跳过</button>' +
          '<button class="btn btn--primary" id="tour-got-it">我知道了！</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function injectHelpButton() {
    if (document.querySelector('.tour-help-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'tour-help-btn';
    btn.title = '查看新手教程';
    btn.innerHTML = '?';
    btn.addEventListener('click', showTour);
    document.body.appendChild(btn);
  }

  function showTour() {
    // 移除已有教程
    var exist = document.getElementById('tour-overlay');
    if (exist) exist.remove();

    var div = document.createElement('div');
    div.innerHTML = getTourHTML();
    document.body.appendChild(div.firstElementChild);

    var overlay = document.getElementById('tour-overlay');

    // 跳过
    document.getElementById('tour-skip').addEventListener('click', function() {
      overlay.remove();
      localStorage.setItem(TOUR_KEY, 'true');
    });

    // 知道了
    document.getElementById('tour-got-it').addEventListener('click', function() {
      overlay.remove();
      localStorage.setItem(TOUR_KEY, 'true');
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
        localStorage.setItem(TOUR_KEY, 'true');
      }
    });
  }

  // 页面加载后执行
  function initTour() {
    injectHelpButton();
    // 首次访问自动弹出
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(showTour, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTour);
  } else {
    initTour();
  }
})();

// ============================================
// 关于页面滚动入场动画
// ============================================
(function() {
  function initAboutAnimations() {
    // 给关于页面的各个 section 添加动画
    var sections = document.querySelectorAll('.about-section');
    if (sections.length === 0) return;

    sections.forEach(function(section) {
      section.classList.add('about-animate-in');
      section.style.opacity = '0';
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '';
          // 计算延迟
          var index = Array.from(sections).indexOf(entry.target);
          entry.target.style.animationDelay = (index * 0.1) + 's';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    sections.forEach(function(section) {
      observer.observe(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutAnimations);
  } else {
    initAboutAnimations();
  }
})();

// ============================================
// H5 移动端增强
// ============================================

// --- 检测移动设备 ---
var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
  document.documentElement.classList.add('is-mobile');
}

// --- 触摸反馈：按钮点击时添加 active 状态 ---
(function() {
  document.addEventListener('touchstart', function() {}, { passive: true });
  document.addEventListener('click', function(e) {
    var target = e.target.closest('.btn, button, .navbar__link, .feature-card, .home-stat-card');
    if (!target) return;
    target.classList.add('js-tap-active');
    setTimeout(function() {
      target.classList.remove('js-tap-active');
    }, 200);
  });
})();

// --- 防止意外下拉刷新（仅在非滚动区域） ---
(function() {
  var body = document.body;
  var startY = 0;
  body.addEventListener('touchstart', function(e) {
    startY = e.touches[0].pageY;
  }, { passive: true });
  body.addEventListener('touchmove', function(e) {
    var scrollTop = document.documentElement.scrollTop || body.scrollTop;
    if (scrollTop === 0 && e.touches[0].pageY > startY) {
      // 在页面顶部向下拉：允许刷新
    }
  }, { passive: true });
})();

// --- 移动端底部导航栏 ---
(function() {
  // 使用屏幕宽度检测，兼容所有设备（包括PC浏览器手机模式）
  if (window.innerWidth > 767) return;

  var pages = [
    { icon: '🏠', label: '首页', href: 'index.html' },
    { icon: '📝', label: '记账', href: 'record.html' },
    { icon: '💰', label: '预算', href: 'budget.html' },
    { icon: '📊', label: '图表', href: 'chart.html' },
    { icon: '📋', label: '报表', href: 'report.html' }
  ];

  var currentPath = window.location.pathname.split('/').pop() || 'index.html';

  var html = '<nav class="mobile-nav">';
  pages.forEach(function(p) {
    var active = p.href === currentPath ? ' mobile-nav__item--active' : '';
    html += '<a href="' + p.href + '" class="mobile-nav__item' + active + '">' +
      '<span class="mobile-nav__icon">' + p.icon + '</span>' +
      '<span class="mobile-nav__label">' + p.label + '</span>' +
    '</a>';
  });
  html += '</nav>';

  function inject() {
    if (document.querySelector('.mobile-nav')) return;
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    // 给 body 加底部间距，防止内容被导航栏遮挡
    document.body.style.paddingBottom = '68px';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

// --- 页面切换淡入效果 ---
(function() {
  // 页面加载后淡入
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.2s ease';
  window.addEventListener('load', function() {
    document.documentElement.style.opacity = '1';
  });
  // 兜底：防止 JS 失败页面不可见
  setTimeout(function() {
    if (document.documentElement.style.opacity === '0') {
      document.documentElement.style.opacity = '1';
    }
  }, 1000);
})();