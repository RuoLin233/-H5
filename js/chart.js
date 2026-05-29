clearTimeout(window.__echartsLoadTimeout);
/**
 * 智财通 - ECharts 图表脚本
 * 依赖：ECharts 5.4.3 CDN、finance.json 数据文件
 */

var chartInstances = {};

/** 初始化所有图表 */
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
  }

  // 初始化三个图表
  initPieChart(records);
  initLineChart(records);
  initBarChart(records);

  // 监听窗口大小变化
  window.addEventListener('resize', function () {
    Object.values(chartInstances).forEach(function (chart) {
      if (chart && chart.resize) chart.resize();
    });
  });
}

/** 图表1：收支分类饼图 */
function initPieChart(records) {
  var dom = document.getElementById('chart-pie');
  if (!dom) return;

  var chart = echarts.init(dom);
  chartInstances['pie'] = chart;

  // 统计各支出分类总额
  var categoryMap = {};
  records.filter(function (r) { return r.type === 'expense'; }).forEach(function (r) {
    if (!categoryMap[r.category]) categoryMap[r.category] = 0;
    categoryMap[r.category] += r.amount;
  });

  var data = Object.entries(categoryMap).map(function (entry) {
    return { name: entry[0], value: Math.round(entry[1] * 100) / 100 };
  });

  var option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      bottom: 10,
      type: 'scroll'
    },
    color: ['#4285f4', '#34a853', '#00bcd4', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#78909c'],
    series: [{
      name: '支出分类',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '46%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: data
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: '42%',
      style: {
        text: '支出分类占比',
        textAlign: 'center',
        fill: '#5f6368',
        fontSize: 13,
        fontWeight: 'normal'
      }
    }]
  };

  chart.setOption(option);
}

/** 图表2：月度收支趋势折线图 */
function initLineChart(records) {
  var dom = document.getElementById('chart-line');
  if (!dom) return;

  var chart = echarts.init(dom);
  chartInstances['line'] = chart;

  // 统计月度数据
  var monthlyData = {};
  records.forEach(function (r) {
    var month = r.date.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    if (r.type === 'income') {
      monthlyData[month].income += r.amount;
    } else {
      monthlyData[month].expense += r.amount;
    }
  });

  var months = Object.keys(monthlyData).sort();
  var displayMonths = months.map(function (m) { return m.slice(5) + '月'; });
  var incomeData = months.map(function (m) { return Math.round(monthlyData[m].income); });
  var expenseData = months.map(function (m) { return Math.round(monthlyData[m].expense); });

  // 找超支月份（4月）
  var overMonthIndex = -1;
  months.forEach(function (m, i) {
    if (monthlyData[m].expense > monthlyData[m].income * 0.6) {
      if (overMonthIndex === -1 || monthlyData[m].expense > monthlyData[months[overMonthIndex]].expense) {
        overMonthIndex = i;
      }
    }
  });

  var option = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        var res = params[0].axisValue + '<br/>';
        params.forEach(function (p) {
          res += p.marker + ' ' + p.seriesName + ': ¥' + p.value + '<br/>';
        });
        return res;
      }
    },
    legend: {
      data: ['月收入', '月支出'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: displayMonths,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '月收入',
        type: 'line',
        data: incomeData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#1a73e8' },
        itemStyle: { color: '#1a73e8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(26,115,232,0.3)' },
            { offset: 1, color: 'rgba(26,115,232,0.02)' }
          ])
        },
        markPoint: (overMonthIndex >= 0) ? {
          data: [{
            name: '超支月',
            coord: [overMonthIndex, expenseData[overMonthIndex]],
            value: '超支月',
            symbol: 'roundRect',
            symbolSize: [50, 26],
            itemStyle: { color: '#ea4335' },
            label: { color: '#fff', fontSize: 11 }
          }],
          symbolOffset: [0, -20]
        } : undefined
      },
      {
        name: '月支出',
        type: 'line',
        data: expenseData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#ea4335' },
        itemStyle: { color: '#ea4335' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(234,67,53,0.25)' },
            { offset: 1, color: 'rgba(234,67,53,0.02)' }
          ])
        }
      }
    ]
  };

  chart.setOption(option);
}

/** 图表3：消费分类柱状图 */
function initBarChart(records) {
  var dom = document.getElementById('chart-bar');
  if (!dom) return;

  var chart = echarts.init(dom);
  chartInstances['bar'] = chart;

  // 统计各分类支出
  var categories = ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '其他'];
  var categoryData = {};
  categories.forEach(function (c) { categoryData[c] = 0; });
  records.filter(function (r) { return r.type === 'expense'; }).forEach(function (r) {
    if (categoryData[r.category] !== undefined) {
      categoryData[r.category] += r.amount;
    }
  });

  var values = categories.map(function (c) { return Math.round(categoryData[c]); });
  var avg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;

  var option = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        return params[0].name + '<br/>' + params[0].marker + ' 支出: ¥' + params[0].value;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { rotate: 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      type: 'bar',
      data: values.map(function (v) {
        return {
          value: v,
          itemStyle: {
            color: v > avg ? '#ea4335' : '#1a73e8',
            borderRadius: [6, 6, 0, 0]
          }
        };
      }),
      label: {
        show: true,
        position: 'top',
        formatter: '¥{c}',
        fontSize: 11,
        color: '#5f6368'
      },
      barWidth: '50%',
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0,0,0,0.2)'
        }
      }
    }]
  };

  chart.setOption(option);
}

/** Tab 切换功能 */
function switchTab(tabName) {
  // 更新按钮状态
  var buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(function (btn) {
    btn.classList.remove('tab-btn--active');
  });
  var activeBtn = document.querySelector('[data-tab="' + tabName + '"]');
  if (activeBtn) activeBtn.classList.add('tab-btn--active');

  // 切换图表显示
  var containers = document.querySelectorAll('.chart-box');
  containers.forEach(function (c) {
    if (c.id === 'chart-' + tabName) {
      c.classList.remove('chart-box--hidden');
    } else {
      c.classList.add('chart-box--hidden');
    }
  });

  // resize 当前图表
  setTimeout(function () {
    var chart = chartInstances[tabName];
    if (chart && chart.resize) chart.resize();
  }, 100);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
  // 检查是否存在图表容器
  if (document.getElementById('chart-pie')) {
    initCharts();
  }

  // Tab 按钮事件绑定
  var tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
});
