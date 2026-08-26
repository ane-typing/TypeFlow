/* ============================================================
   成绩记录模块（挂载到"成绩记录"视图）
   - 从 window.api.loadRecords() 读取数据
   - 历史表格 + 类型筛选（全部/指法/速度）
   - SVG 进步曲线
   - 展开每行显示错误分析
   - 删除单条 / 清空全部
   ============================================================ */

const Records = (() => {
  let records = [];
  let filter = 'all';
  let expanded = {}; // { id: true/false }
  let rootEl = null;

  // ---------- 渲染 ----------

  function render() {
    rootEl = document.getElementById('records');
    rootEl.innerHTML = `
      <div class="records-root">
        <div class="records-header">
          <div class="view-header">
            <h1>成绩记录</h1>
            <p class="view-desc">查看历史成绩与进步曲线</p>
          </div>
          <div class="records-actions">
            <button class="btn btn-ghost" id="rec-clear" ${records.length === 0 ? 'disabled' : ''}>🗑 清空全部</button>
          </div>
        </div>
        <div class="records-filter">
          <button class="filter-btn active" data-filter="all">全部</button>
          <button class="filter-btn" data-filter="finger">英文指法</button>
          <button class="filter-btn" data-filter="speed">英文速度</button>
          <button class="filter-btn" data-filter="zh-speed">中文速度</button>
          <button class="filter-btn" data-filter="pinyin">拼音练习</button>
          <button class="filter-btn" data-filter="wubi">五笔练习</button>
          <button class="filter-btn" data-filter="coder">程序员</button>
          <button class="filter-btn" data-filter="code-speed">代码</button>
          <button class="filter-btn" data-filter="weak-point">弱项特训</button>
        </div>
        <div class="rec-chart card" id="rec-chart" ${records.length === 0 ? 'hidden' : ''}>
          <div class="rec-chart-title">📈 进步曲线（CPM）</div>
          <div class="rec-chart-svg" id="rec-chart-svg">${renderChart()}</div>
        </div>
        <div class="rec-table card" id="rec-table" ${filtered().length === 0 ? 'hidden' : ''}>
          <table>
            <thead>
              <tr><th style="width:32px"></th><th>时间</th><th>类型</th><th>标题</th><th>速度</th><th>准确率</th><th>用时</th><th>操作</th></tr>
            </thead>
            <tbody id="rec-tbody">${renderTableRows()}</tbody>
          </table>
        </div>
        <div class="rec-filter-empty" id="rec-filter-empty" ${records.length > 0 && filtered().length === 0 ? '' : 'hidden'}>
          <span class="ph-icon">🗂️</span>
          <p>该分类还没有练习记录，换一个分类看看吧</p>
        </div>
        <div class="rec-empty" id="rec-empty" ${records.length === 0 ? '' : 'hidden'}>
          <span class="ph-icon">📊</span>
          <p>还没有成绩，去完成一次练习或测试吧</p>
        </div>
      </div>`;

    // 筛选按钮
    rootEl.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        rootEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.filter;
        expanded = {};
        refreshTable();
      });
    });

    // 清空全部
    rootEl.querySelector('#rec-clear').addEventListener('click', () => {
      if (records.length === 0) return;
      if (!confirm('确定要清空全部成绩记录吗？此操作不可撤销。')) return;
      window.api.clearRecords().then(() => {
        records = [];
        expanded = {};
        reRender();
      }).catch((e) => console.warn('清空失败', e));
    });

    // 事件委托：展开/删除
    const tbody = rootEl.querySelector('#rec-tbody');
    tbody.addEventListener('click', (e) => {
      const expand = e.target.closest('.rec-expand');
      if (expand) {
        const id = expand.dataset.id;
        expanded[id] = !expanded[id];
        // 只更新表格内容，不重设整个视图
        const allRows = rootEl.querySelectorAll('#rec-tbody tr');
        refreshTable();
        return;
      }
      const del = e.target.closest('.rec-del');
      if (!del) return;
      const id = del.dataset.id;
      if (!confirm('确定删除此条记录？')) return;
      window.api.deleteRecord(id).then((data) => {
        records = data;
        delete expanded[id];
        reRender();
      }).catch((e) => console.warn('删除失败', e));
    });
  }

  function reRender() {
    render();
  }

  function filtered() {
    if (filter === 'all') return records;
    return records.filter((r) => r.type === filter);
  }

  // 类型显示映射
  function typeInfo(t) {
    switch (t) {
      case 'finger':   return { label: '英文指法', cls: 'finger' };
      case 'speed':    return { label: '英文速度', cls: 'speed' };
      case 'zh-speed': return { label: '中文速度', cls: 'zh-speed' };
      case 'pinyin':   return { label: '拼音练习', cls: 'pinyin' };
      case 'wubi':     return { label: '五笔练习', cls: 'wubi' };
      case 'coder':    return { label: '程序员', cls: 'coder' };
      case 'code-speed': return { label: '代码', cls: 'code-speed' };
      case 'weak-point': return { label: '弱项特训', cls: 'weak-point' };
      default:         return { label: t, cls: t };
    }
  }

  function renderTableRows() {
    const list = filtered();
    if (list.length === 0) return '';
    return list.map((r) => {
      const isExpanded = expanded[r.id] || false;
      const info = typeInfo(r.type);
      // 速度单位：英文 speed 用 WPM，其余中文类用 字/分，指法用 CPM
      let speedText;
      if (r.type === 'speed') speedText = r.wpm + ' WPM';
      else if (r.type === 'code-speed') speedText = r.cpm + ' 键/分';
      else if (r.type === 'finger' || r.type === 'coder') speedText = r.cpm + ' CPM';
      else speedText = r.cpm + ' 字/分';
      return `
      <tr>
        <td><button class="rec-expand" data-id="${r.id}">${isExpanded ? '▼' : '▶'}</button></td>
        <td class="rec-date">${r.date}</td>
        <td><span class="rec-type-badge ${info.cls}">${info.label}</span></td>
        <td class="rec-title">${escHtml(r.title)}</td>
        <td class="rec-speed">${speedText}</td>
        <td class="rec-acc">${r.accuracy}%</td>
        <td class="rec-time">${fmtTime(r.time)}</td>
        <td><button class="rec-del" data-id="${r.id}">✕</button></td>
      </tr>
      <tr class="rec-detail-row ${isExpanded ? '' : 'hidden'}" data-parent="${r.id}">
        <td colspan="8">${renderErrorAnalysis(r)}</td>
      </tr>`;
    }).join('');
  }

  function renderErrorAnalysis(record) {
    // 速度测试/中文速度/代码且保存了全文：展示整篇内容标记
    if ((record.type === 'speed' || record.type === 'zh-speed' || record.type === 'code-speed') && record.text && record.status) {
      return renderSpeedAnalysis(record);
    }
    // 指法练习或未保存全文：展示错误表格
    if (!record.errors || record.errors.length === 0) {
      return '<div class="rec-err-empty">该次练习未记录错误详情</div>';
    }
    const total = record.errors.reduce((s, e) => s + e.count, 0);
    const rows = record.errors
      .sort((a, b) => b.count - a.count)
      .map((e) => {
        const pct = Math.round((e.count / total) * 100);
        return `<tr><td class="err-char">${escHtml(e.expected)}</td><td class="err-char">${escHtml(e.typed)}</td><td>${e.count}</td><td>${pct}%</td></tr>`;
      })
      .join('');
    return `
      <div class="rec-err-title">❌ 错误分析（共 ${total} 次错误）</div>
      <table class="rec-err-table">
        <thead><tr><th>期望字符</th><th>实际输入</th><th>错误次数</th><th>占比</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderSpeedAnalysis(record) {
    const text = record.text;
    const status = record.status;
    const errors = record.errors || [];
    // 渲染全文，每个字符按状态着色
    let chars = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const st = status[i] !== undefined ? status[i] : 0;
      let cls = 'sa-char';
      if (st === 1) cls += ' sa-done';
      else if (st === 2) cls += ' sa-err';
      chars += `<span class="${cls}">${ch === ' ' ? ' ' : escHtml(ch)}</span>`;
    }
    // 错误统计：以 status 红色错误字符为准（errors 数组在部分模块可能为空）
    const statusErrors = (record.status && Array.isArray(record.status))
      ? record.status.filter((s) => s === 2).length
      : 0;
    const totalErrors = statusErrors > 0 ? statusErrors : errors.reduce((s, e) => s + e.count, 0);
    let errList = '';
    if (errors.length > 0) {
      const sorted = errors.sort((a, b) => b.count - a.count);
      errList = sorted.map((e) =>
        `<span class="sa-err-item"><span class="err-char">${escHtml(e.expected)}</span> → ${escHtml(e.typed)} × ${e.count}</span>`
      ).join('');
    }
    return `
      <div class="sa-text">${chars}</div>
      <div class="sa-footer">
        <div class="sa-err-count">❌ 错误次数：<b>${totalErrors}</b> 次</div>
        ${errList ? `<div class="sa-err-list">按错键位：${errList}</div>` : ''}
        <div class="sa-legend">
          <span class="sa-legend-dot sa-dot-done"></span> 正确
          <span class="sa-legend-dot sa-dot-err"></span> 错误
          <span class="sa-legend-dot sa-dot-miss"></span> 未打到
        </div>
      </div>`;
  }

  function refreshTable() {
    const list = filtered();
    rootEl.querySelector('#rec-tbody').innerHTML = renderTableRows();
    rootEl.querySelector('#rec-table').hidden = list.length === 0;
    // 全局空态只在「从没练过」时显示；只要有任何一条成绩就不再显示
    rootEl.querySelector('#rec-empty').hidden = records.length > 0;
    const filterEmpty = rootEl.querySelector('#rec-filter-empty');
    if (filterEmpty) filterEmpty.hidden = !(records.length > 0 && list.length === 0);
    rootEl.querySelector('#rec-chart').hidden = records.length === 0;
    rootEl.querySelector('#rec-chart-svg').innerHTML = renderChart();
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
  }

  // ---------- SVG 进步曲线 ----------

  function renderChart() {
    const chartTypes = ['speed', 'zh-speed', 'pinyin', 'wubi', 'code-speed'];
    const list = records.filter((r) => chartTypes.includes(r.type)).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (list.length < 2) return '<div class="chart-hint">至少完成 2 次速度测试或中文练习才能显示进步曲线</div>';

    const w = 600, h = 200, pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const cpmList = list.map((r) => r.cpm);
    const maxCpm = Math.max(...cpmList, 100);
    const minCpm = Math.min(...cpmList, 0);
    const range = maxCpm - minCpm || 1;
    const xStep = (w - pad.left - pad.right) / (list.length - 1);

    let d = '';
    const points = list.map((r, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + (h - pad.top - pad.bottom) * (1 - (r.cpm - minCpm) / range);
      return { x, y, cpm: r.cpm, title: r.title.substring(0, 12) };
    });
    d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    let yTicks = '';
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      const val = Math.round(minCpm + range * i / tickCount);
      const y = pad.top + (h - pad.top - pad.bottom) * (1 - i / tickCount);
      yTicks += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" class="chart-axis">${val}</text>`;
      yTicks += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" class="chart-grid"/>`;
    }

    let dots = '';
    points.forEach((p) => {
      dots += `<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"/>`;
      dots += `<text x="${p.x}" y="${p.y - 12}" text-anchor="middle" class="chart-label">${p.cpm}</text>`;
    });

    return `<svg viewBox="0 0 ${w} ${h}" class="rec-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4cc9f0" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#4cc9f0" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yTicks}
      <path d="${d}" fill="none" stroke="#4cc9f0" stroke-width="2.5" class="chart-line"/>
      <path d="${d} L${points[points.length-1].x},${pad.top + (h-pad.top-pad.bottom)} L${points[0].x},${pad.top + (h-pad.top-pad.bottom)} Z" fill="url(#chartGrad)" opacity="0.5"/>
      ${dots}
    </svg>`;
  }

  // ---------- 生命周期 ----------

  function mount() {
    window.api.loadRecords().then((data) => {
      records = data || [];
      expanded = {};
      render();
    }).catch((e) => {
      console.warn('加载成绩失败', e);
      records = [];
      render();
    });
  }

  function unmount() { /* 无副作用 */ }

  return { mount, unmount };
})();

window.Records = Records;