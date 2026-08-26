/* ============================================================
   弱项特训模块
   - 分析所有成绩记录中的错误，找出最常错的字符
   - 一键生成针对性练习内容
   - 保存成绩 (type: 'weak-point')
   ============================================================ */

const WeakPointTraining = (() => {
  const state = {
    records: [],
    weakPoints: [],
    target: '',
    index: 0,
    correct: 0,
    errors: 0,
    running: false,
    startTime: 0,
    timer: null,
    status: [],
    errorLog: {},
    isComposing: false,
    loaded: false
  };

  let rootEl = null;
  let hiddenInput = null;

  // ---------- 删除弱项持久化（localStorage） ----------
  const DISMISS_KEY = 'typing_dismissed_weak';

  function loadDismissed() {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }

  function saveDismissed(set) {
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...set])); } catch (e) { /* 忽略 */ }
  }

  // ---------- 错误上下文提取 ----------
  // 从整段文本的出错位置截取一个「词/片段」上下文窗口，便于展示该键是在哪里打错
  function extractContext(text, i) {
    let s = i, e = i;
    while (s > 0 && !/\s/.test(text[s - 1])) s--;
    while (e < text.length - 1 && !/\s/.test(text[e + 1])) e++;
    const MAX = 12;
    if (e - s + 1 > MAX) {
      const left = Math.min(i - s, Math.floor(MAX * 0.6));
      s = i - left;
      e = Math.min(text.length - 1, s + MAX - 1);
    }
    return { before: text.slice(s, i), char: text[i], after: text.slice(i + 1, e + 1) };
  }

  // ---------- 错误分析 ----------
  function analyzeWeakPoints(records) {
    const dismissed = loadDismissed();
    const errMap = {};
    records.forEach(r => {
      // 从 errors 数组分析（指法 / 程序员等：记录 expected -> typed）
      if (r.errors && Array.isArray(r.errors)) {
        r.errors.forEach(e => {
          if (!e || !e.expected) return;
          if (e.expected === ' ') return;   // 空格只保留在程序员部分，不计入通用弱项
          if (dismissed.has(e.expected)) return;
          if (!errMap[e.expected]) {
            errMap[e.expected] = { char: e.expected, count: 0, types: new Set(), examples: [] };
          }
          const node = errMap[e.expected];
          node.count += e.count || 1;
          node.types.add(r.type || 'unknown');
          if (node.examples.length < 2 && e.typed) {
            node.examples.push({ before: undefined, char: e.expected, after: undefined, typed: e.typed });
          }
        });
      }
      // 从 status 数组分析（速度测试等：能精确定位出错位置）
      if (r.status && Array.isArray(r.status) && r.text) {
        for (let i = 0; i < r.status.length; i++) {
          if (r.status[i] === 2) {
            const ch = r.text[i] || '?';
            if (ch === ' ') continue;   // 空格不计入通用弱项
            if (dismissed.has(ch)) continue;
            if (!errMap[ch]) {
              errMap[ch] = { char: ch, count: 0, types: new Set(), examples: [] };
            }
            const node = errMap[ch];
            node.count++;
            node.types.add(r.type || 'unknown');
            if (node.examples.length < 2) {
              node.examples.push(extractContext(r.text, i));
            }
          }
        }
      }
    });
    return Object.values(errMap)
      .map(d => ({ ...d, types: [...d.types] }))
      .sort((a, b) => b.count - a.count);
  }

  // ---------- 生成练习内容 ----------
  function generateTraining(weakPoints, count = 60) {
    if (weakPoints.length === 0) return 'The quick brown fox jumps over the lazy dog.';

    const topChars = weakPoints.slice(0, 10).map(w => w.char);
    // 判断是中文字符还是英文字符
    const isChinese = topChars.some(ch => /[一-鿿]/.test(ch));

    if (isChinese) {
      // 中文练习：把弱项字组成短句
      const sentences = [
        '这是你的弱项字，请反复练习。',
        '多加练习才能进步，不要放弃。',
        '每个字都要认真打，打好基础。',
        '练习是进步的唯一途径。',
        '坚持就是胜利，加油！'
      ];
      let text = '';
      while (text.length < count) {
        // 随机插入弱项字
        const ch = topChars[Math.floor(Math.random() * topChars.length)];
        text += ch;
        if (text.length % 5 === 0) {
          text += sentences[Math.floor(Math.random() * sentences.length)];
        }
      }
      return text.slice(0, count);
    } else {
      // 英文练习：生成包含弱项字符的单词序列
      const commonWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
        'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
        'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
        'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
      ];
      // 筛选包含弱项字符的单词
      const matching = commonWords.filter(w =>
        topChars.some(ch => w.includes(ch))
      );
      const pool = matching.length > 0 ? matching : commonWords;
      const out = [];
      while (out.join(' ').length < count) {
        const w = pool[Math.floor(Math.random() * pool.length)];
        if (out.length > 0) out.push(' ');
        out.push(w);
      }
      return out.join('').slice(0, count);
    }
  }

  // ---------- 渲染 ----------
  function render() {
    rootEl = document.getElementById('weak-point');
    if (!rootEl) return;

    if (state.running) {
      renderTraining();
      return;
    }

    const points = state.weakPoints;
    const hasData = points.length > 0;

    rootEl.innerHTML = `
      <div class="wp-root">
        <div class="view-header">
          <h1>弱项特训</h1>
          <p class="view-desc">根据你的成绩记录自动分析薄弱环节，针对性练习</p>
        </div>

        ${!hasData ? `
          <div class="wp-empty card">
            <span class="ph-icon">📊</span>
            <p>还没有成绩记录，去完成一些练习再来吧</p>
            <p class="ph-sub">完成指法练习或速度测试后，这里会自动分析你的弱项</p>
          </div>
        ` : `
          <div class="wp-summary card">
            <div class="wp-summary-header">
              <span class="wp-summary-title">🎯 你的弱项字符排行榜</span>
              <span class="wp-summary-sub">基于 ${state.records.length} 条成绩记录分析</span>
            </div>
            <div class="wp-rank-list">
              ${points.slice(0, 15).map((p, i) => `
                <div class="wp-rank-item">
                  <span class="wp-rank-num ${i < 3 ? 'wp-rank-top' : ''}">${i + 1}</span>
                  <span class="wp-rank-char">${p.char === ' ' ? '␣' : escHtml(p.char)}</span>
                  <div class="wp-rank-body">
                    <span class="wp-rank-bar-wrap">
                      <span class="wp-rank-bar" style="width:${Math.min(100, (p.count / points[0].count) * 100)}%"></span>
                    </span>
                    <div class="wp-rank-examples">${renderExamples(p)}</div>
                  </div>
                  <span class="wp-rank-count">${p.count} 次</span>
                  <button class="wp-del" data-char="${escHtml(p.char)}" title="移除该弱项，不再训练">✕</button>
                </div>
              `).join('')}
            </div>
            ${points.length > 15 ? `<div class="wp-rank-more">…… 还有 ${points.length - 15} 个字符</div>` : ''}
            <div class="wp-summary-footer">
              <button class="btn btn-primary" id="wp-start">🚀 开始特训</button>
              <button class="btn btn-ghost" id="wp-refresh">🔄 刷新分析</button>
              ${loadDismissed().size > 0 ? `<button class="btn btn-ghost" id="wp-restore">↩ 恢复已移除弱项</button>` : ''}
            </div>
          </div>
        `}
      </div>`;

    rootEl.querySelector('#wp-start')?.addEventListener('click', startTraining);
    rootEl.querySelector('#wp-refresh')?.addEventListener('click', () => {
      loadAndAnalyze();
      render();
    });
    // 删除单个弱项
    rootEl.querySelectorAll('.wp-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.char;
        const set = loadDismissed();
        set.add(ch);
        saveDismissed(set);
        state.weakPoints = analyzeWeakPoints(state.records);
        render();
      });
    });
    // 恢复全部已移除弱项
    rootEl.querySelector('#wp-restore')?.addEventListener('click', () => {
      saveDismissed(new Set());
      state.weakPoints = analyzeWeakPoints(state.records);
      render();
    });
  }

  // ---------- 错误上下文示例 ----------
  function renderExamples(p) {
    const ex = (p.examples || []).slice(0, 2);
    if (ex.length === 0) return '<span class="wp-ex-empty">暂无上下文示例</span>';
    return ex.map((e) => {
      if (e.before !== undefined) {
        return `<span class="wp-ex">…${escHtml(e.before)}<b class="wp-ex-char">${escHtml(e.char)}</b>${escHtml(e.after)}…</span>`;
      }
      if (e.typed !== undefined) {
        return `<span class="wp-ex">想打 <b class="wp-ex-char">${escHtml(e.char)}</b> 却按成 <span class="wp-ex-typed">${escHtml(e.typed)}</span></span>`;
      }
      return '';
    }).join('');
  }

  // ---------- 练习渲染 ----------
  function renderTraining() {
    rootEl.innerHTML = `
      <div class="wp-root">
        <div class="wp-training card">
          <div class="wp-training-header">
            <span class="wp-training-title">🎯 弱项特训</span>
            <button class="btn btn-ghost" id="wp-quit">退出</button>
          </div>
          <div class="wp-training-text" id="wp-text"></div>
          <div class="wp-input-area" id="wp-input-area" hidden>
            <input type="text" class="zh-hidden-input" id="wp-zh-input" autocomplete="off" placeholder="在此输入中文..." />
          </div>
          <div class="wp-training-stats">
            <div class="stat-item"><span class="stat-value" id="wp-progress">0/0</span><span class="stat-label">进度</span></div>
            <div class="stat-item"><span class="stat-value" id="wp-errors">0</span><span class="stat-label">错误</span></div>
            <div class="stat-item"><span class="stat-value" id="wp-acc">100%</span><span class="stat-label">准确率</span></div>
            <div class="stat-item"><span class="stat-value" id="wp-cpm">0</span><span class="stat-label">键/分</span></div>
            <div class="stat-item"><span class="stat-value" id="wp-time">0:00</span><span class="stat-label">用时</span></div>
          </div>
        </div>
        <div class="result-overlay" id="wp-result" hidden></div>
      </div>`;

    renderTrainingText();
    updateTrainingStats();
    state.isComposing = false;

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(updateTrainingStats, 500);

    // 清理旧监听，再根据目标是否含中文选择输入方式
    window.removeEventListener('keydown', onTrainingKey);
    teardownChineseInput();
    if (/[\u4e00-\u9fff]/.test(state.target)) {
      setupChineseInput();
    } else {
      window.addEventListener('keydown', onTrainingKey);
    }

    rootEl.querySelector('#wp-quit').addEventListener('click', stopTraining);
  }

  function renderTrainingText() {
    const el = rootEl.querySelector('#wp-text');
    if (!el) return;
    el.innerHTML = '';
    [...state.target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'speed-char';
      span.textContent = ch;
      if (i < state.index) span.classList.add(state.status[i] === 1 ? 'done' : 'err');
      if (i === state.index) span.classList.add('current');
      el.appendChild(span);
    });
    const cur = el.querySelector('.current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  function updateTrainingStats() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 100;

    const progressEl = rootEl.querySelector('#wp-progress');
    const errorsEl = rootEl.querySelector('#wp-errors');
    const accEl = rootEl.querySelector('#wp-acc');
    const cpmEl = rootEl.querySelector('#wp-cpm');
    const timeEl = rootEl.querySelector('#wp-time');
    if (progressEl) progressEl.textContent = `${state.index}/${state.target.length}`;
    if (errorsEl) errorsEl.textContent = state.errors;
    if (accEl) accEl.textContent = `${acc}%`;
    if (cpmEl) cpmEl.textContent = cpm;
    if (timeEl) timeEl.textContent = fmtTime(elapsed);
  }

  // 统一处理一个输入字符（英文 keydown 与中文 IME 合成共用）
  function processTrainingChar(ch) {
    if (!state.running || state.index >= state.target.length) return;
    if (!state.startTime) state.startTime = Date.now();
    const target = state.target[state.index];
    if (ch === target) {
      state.correct++;
      state.status[state.index] = 1;
    } else {
      state.errors++;
      state.status[state.index] = 2;
    }
    state.index++;
    updateTrainingChar();
    updateTrainingStats();
    if (state.index >= state.target.length) finishTraining();
  }

  function onTrainingKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (state.running && state.index > 0) {
        // 回退并同步扣回正确/错误计数
        const prev = state.status[state.index - 1];
        state.index--;
        if (prev === 1) state.correct = Math.max(0, state.correct - 1);
        else if (prev === 2) state.errors = Math.max(0, state.errors - 1);
        state.status[state.index] = 0;
        renderTrainingText();
        updateTrainingStats();
      }
      return;
    }

    if (e.key.length !== 1) return;
    e.preventDefault();
    processTrainingChar(e.key);
  }

  // ---------- 中文 IME 输入 ----------
  function onCompStart() { state.isComposing = true; }

  function onCompEnd(e) {
    state.isComposing = false;
    const text = e.data || '';
    if (text) processTrainingChar(text);
    if (hiddenInput) { hiddenInput.value = ''; setTimeout(() => hiddenInput.focus(), 0); }
  }

  function onInput() {
    if (state.isComposing) return;
    const val = hiddenInput ? hiddenInput.value : '';
    if (val) { processTrainingChar(val); if (hiddenInput) hiddenInput.value = ''; }
  }

  function setupChineseInput() {
    const area = rootEl.querySelector('#wp-input-area');
    if (!area) return;
    area.hidden = false;
    hiddenInput = rootEl.querySelector('#wp-zh-input');
    if (!hiddenInput) return;
    hiddenInput.value = '';
    hiddenInput.addEventListener('compositionstart', onCompStart);
    hiddenInput.addEventListener('compositionend', onCompEnd);
    hiddenInput.addEventListener('input', onInput);
    setTimeout(() => hiddenInput.focus(), 0);
  }

  function teardownChineseInput() {
    if (hiddenInput) {
      hiddenInput.removeEventListener('compositionstart', onCompStart);
      hiddenInput.removeEventListener('compositionend', onCompEnd);
      hiddenInput.removeEventListener('input', onInput);
      hiddenInput = null;
    }
    const area = rootEl && rootEl.querySelector('#wp-input-area');
    if (area) area.hidden = true;
  }

  function updateTrainingChar() {
    const el = rootEl.querySelector('#wp-text');
    if (!el) return;
    const chars = el.querySelectorAll('.speed-char');
    chars.forEach((c, i) => {
      const cls = 'speed-char';
      if (i < state.index) c.className = `${cls} ${state.status[i] === 1 ? 'done' : 'err'}`;
      else if (i === state.index) c.className = `${cls} current`;
      else c.className = cls;
    });
    const cur = el.querySelector('.current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }

  // ---------- 开始/结束练习 ----------
  function startTraining() {
    const text = generateTraining(state.weakPoints);
    state.target = text;
    state.index = 0;
    state.correct = 0;
    state.errors = 0;
    state.running = true;
    state.startTime = 0;
    state.status = text.split('').map(() => 0);
    state.errorLog = {};
    render();
  }

  function stopTraining() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    window.removeEventListener('keydown', onTrainingKey);
    teardownChineseInput();
    // 重新加载数据（刚保存了新成绩），然后重新渲染
    state.loaded = false;
    loadAndAnalyze();
    rootEl.innerHTML = `<div class="wp-root"><div class="wp-empty card"><span class="ph-icon">⏳</span><p>正在刷新分析...</p></div></div>`;
    const check = setInterval(() => {
      if (state.loaded) { clearInterval(check); if (!state.running) render(); }
    }, 100);
    setTimeout(() => { clearInterval(check); if (!state.running) render(); }, 3000);
  }

  function finishTraining() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    window.removeEventListener('keydown', onTrainingKey);
    teardownChineseInput();
    updateTrainingStats();

    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 0;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const wpm = Math.round(cpm / 5);

    const overlay = rootEl.querySelector('#wp-result');
    overlay.innerHTML = `
      <div class="result-card card">
        <h2>🎉 特训完成</h2>
        <p class="result-title">弱项特训 — 针对 ${state.weakPoints.slice(0, 5).map(w => w.char === ' ' ? '空格' : w.char).join('、')} 等弱项</p>
        <div class="result-grid">
          <div class="result-cell"><b>${wpm}</b><span>词/分 (WPM)</span></div>
          <div class="result-cell"><b>${cpm}</b><span>键/分 (CPM)</span></div>
          <div class="result-cell"><b>${acc}%</b><span>准确率</span></div>
          <div class="result-cell"><b>${fmtTime(elapsed)}</b><span>用时</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="wp-retry">再练一次</button>
          <button class="btn btn-ghost" id="wp-back">返回分析</button>
        </div>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('#wp-retry').addEventListener('click', startTraining);
    overlay.querySelector('#wp-back').addEventListener('click', stopTraining);
    saveWeakPointRecord(cpm, wpm, acc, elapsed);
  }

  function saveWeakPointRecord(cpm, wpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const weakChars = state.weakPoints.slice(0, 5).map(w => w.char).join('');
    const errorsList = Object.values(state.errorLog);
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'weak-point',
      title: `弱项特训 — ${weakChars}`,
      text: state.target,
      status: state.status,
      cpm, wpm, accuracy,
      time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      errors: errorsList.length > 0 ? errorsList : undefined
    }).catch(e => console.warn('保存成绩失败', e));
  }

  // ---------- 数据加载 ----------
  function loadAndAnalyze() {
    if (!window.api || !window.api.loadRecords) {
      state.records = [];
      state.weakPoints = [];
      state.loaded = true;
      return;
    }
    window.api.loadRecords().then(data => {
      state.records = data || [];
      state.weakPoints = analyzeWeakPoints(state.records);
      state.loaded = true;
    }).catch(e => {
      console.warn('加载成绩失败', e);
      state.records = [];
      state.weakPoints = [];
      state.loaded = true;
    });
  }

  // ---------- 工具函数 ----------
  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------- 生命周期 ----------
  function mount() {
    rootEl = document.getElementById('weak-point');
    if (!rootEl) return;
    state.loaded = false;
    loadAndAnalyze();
    const doRender = () => { render(); };
    if (state.loaded) {
      if (!state.running) doRender();
    } else {
      // 显示加载中，等待 loadRecords 真正完成（避免有记录却误判为空）
      rootEl.innerHTML = `<div class="wp-root"><div class="wp-empty card"><span class="ph-icon">⏳</span><p>正在分析你的成绩记录...</p></div></div>`;
      const check = setInterval(() => {
        if (state.loaded) { clearInterval(check); if (!state.running) doRender(); }
      }, 100);
      // 兜底：加载超时也渲染；若正在训练则不打断
      setTimeout(() => { clearInterval(check); if (!state.running) doRender(); }, 3000);
    }
  }

  function unmount() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    window.removeEventListener('keydown', onTrainingKey);
    teardownChineseInput();
  }

  return { mount, unmount };
})();

window.WeakPointTraining = WeakPointTraining;