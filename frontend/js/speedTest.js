/* ============================================================
   速度测试模块（英文 + 中文双板块）
   - 英文/中文标签切换，互不干扰
   - 英文：逐字符 keydown 输入（原逻辑）
   - 中文：IME 输入法 composition 事件
   - 保存成绩（type: 'speed' / 'zh-speed'）
   ============================================================ */

const SpeedTest = (() => {
  const state = {
    article: null,
    target: '',
    index: 0,
    correct: 0,
    errors: 0,
    running: false,
    startTime: 0,
    timer: null,
    status: [],
    errorLog: {},
    mode: 'en', // 'en' | 'zh'
    isComposing: false,
    enShowing: [],
    zhShowing: [],
    codeShowing: []
  };

  let rootEl = null;
  let hiddenInput = null;

  // ---------- 渲染 ----------
  function render() {
    rootEl = document.getElementById('speed-test');
    state.enShowing = getShuffledEn();
    state.zhShowing = getShuffledZh();
    state.codeShowing = getShuffledCode();

    rootEl.innerHTML = `
      <div class="speed-root">
        <div class="speed-article-list" id="speed-list">
          <div class="speed-list-header">
            <div>
              <h1>速度测试</h1>
              <p class="view-desc" id="speed-desc">选择一篇文章开始打字速度测试</p>
            </div>
            <button class="btn btn-ghost" id="speed-shuffle">🔄 换一批</button>
          </div>
          <div class="speed-tabs" id="speed-tabs">
            <button class="speed-tab active" data-tab="en">🇬🇧 英文</button>
            <button class="speed-tab" data-tab="zh">🇨🇳 中文</button>
            <button class="speed-tab" data-tab="code">💻 代码</button>
          </div>
          <div class="article-cards" id="speed-cards">${renderCards('en')}</div>
        </div>
        <div class="speed-testing" id="speed-testing" hidden>
          <div class="speed-test-card card">
            <div class="speed-title-bar">
              <span class="speed-title" id="speed-title"></span>
              <button class="btn btn-ghost" id="speed-quit">退出</button>
            </div>
            <div class="speed-text" id="speed-text"></div>
            <div class="speed-stats">
              <div class="stat-item"><span class="stat-value" id="sp-wpm">0</span><span class="stat-label">WPM</span></div>
              <div class="stat-item"><span class="stat-value" id="sp-cpm">0</span><span class="stat-label">CPM</span></div>
              <div class="stat-item"><span class="stat-value" id="sp-acc">100%</span><span class="stat-label">准确率</span></div>
              <div class="stat-item"><span class="stat-value" id="sp-progress">0%</span><span class="stat-label">进度</span></div>
              <div class="stat-item"><span class="stat-value" id="sp-time">0:00</span><span class="stat-label">用时</span></div>
            </div>
          </div>
        </div>
        <div class="result-overlay" id="speed-result" hidden></div>
      </div>`;

    // 标签切换
    rootEl.querySelectorAll('.speed-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.mode = tab.dataset.tab;
        rootEl.querySelectorAll('.speed-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        rootEl.querySelector('#speed-cards').innerHTML = renderCards(state.mode);
        bindCards();
        const desc = rootEl.querySelector('#speed-desc');
        if (desc) {
          desc.textContent = state.mode === 'en' ? '选择一篇英文文章开始打字速度测试'
            : state.mode === 'zh' ? '选择一篇中文文章开始打字速度测试'
            : '选择一段代码开始打字速度测试（新手 vs 老手）';
        }
      });
    });

    rootEl.querySelector('#speed-shuffle').addEventListener('click', () => {
      if (state.mode === 'en') state.enShowing = getShuffledEn();
      else if (state.mode === 'zh') state.zhShowing = getShuffledZh();
      else state.codeShowing = getShuffledCode();
      rootEl.querySelector('#speed-cards').innerHTML = renderCards(state.mode);
      bindCards();
    });

    bindCards();
    rootEl.querySelector('#speed-quit')?.addEventListener('click', () => showList());
  }

  function getShuffledEn() {
    return window.shuffleArticles ? window.shuffleArticles(6) : (window.ARTICLES || []).slice(0, 6);
  }

  function getShuffledZh() {
    return window.shuffleArticles ? window.shuffleArticles(6, window.ZH_ARTICLES) : (window.ZH_ARTICLES || []).slice(0, 6);
  }

  function getShuffledCode() {
    return window.shuffleCodeSnippets ? window.shuffleCodeSnippets(6) : (window.CODE_SNIPPETS || []).slice(0, 6);
  }

  function getPool(mode) {
    if (mode === 'en') return state.enShowing;
    if (mode === 'zh') return state.zhShowing;
    return state.codeShowing;
  }

  function renderCards(mode) {
    const pool = getPool(mode);
    if (mode === 'code') {
      return pool.map((a) => `
        <div class="article-card code-card" data-id="${a.id}">
          <div class="code-card-meta">
            <span class="article-level ${a.level}">${a.level}</span>
            <span class="article-lang ${a.lang.toLowerCase()}">${a.lang}</span>
          </div>
          <div class="article-title">${a.title}</div>
          <div class="article-words">${a.text.length} 字符 · ${a.text.split('\n').length} 行</div>
        </div>`).join('');
    }
    return pool.map((a) => `
      <div class="article-card" data-id="${a.id}">
        <div class="article-level ${a.level}">${a.level}</div>
        <div class="article-title">${a.title}</div>
        <div class="article-words">${mode === 'en' ? (a.text.split(/\s+/).length + ' 词 · ' + a.text.length + ' 字符') : (a.text.length + ' 字')}</div>
      </div>`).join('');
  }

  function bindCards() {
    rootEl.querySelectorAll('.article-card').forEach((card) => {
      card.addEventListener('click', () => {
        const pool = getPool(state.mode);
        const article = pool.find((a) => a.id === Number(card.dataset.id));
        if (article) startTest(article);
      });
    });
  }

  function showList() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    window.removeEventListener('keydown', onKey);
    if (hiddenInput) {
      hiddenInput.removeEventListener('compositionstart', onCompStart);
      hiddenInput.removeEventListener('compositionend', onCompEnd);
      hiddenInput.removeEventListener('input', onInput);
      hiddenInput = null;
    }
    rootEl.querySelector('#speed-list').hidden = false;
    rootEl.querySelector('#speed-testing').hidden = true;
    rootEl.querySelector('#speed-result').hidden = true;
  }

  // ---------- 开始测试 ----------
  function startTest(article) {
    state.article = article;
    state.target = article.text;
    state.index = 0;
    state.correct = 0;
    state.errors = 0;
    state.running = true;
    state.startTime = 0;
    state.status = state.target.split('').map(() => 0);
    state.errorLog = {};
    state.isComposing = false;

    rootEl.querySelector('#speed-list').hidden = true;
    rootEl.querySelector('#speed-testing').hidden = false;
    rootEl.querySelector('#speed-result').hidden = true;
    rootEl.querySelector('#speed-title').textContent = article.title;
    // 代码模式使用更紧凑的等宽字体
    rootEl.querySelector('#speed-testing').classList.toggle('code-mode', state.mode === 'code');

    renderText();
    updateStats();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(updateStats, 500);

    window.removeEventListener('keydown', onKey);
    if (state.mode === 'en' || state.mode === 'code') {
      window.addEventListener('keydown', onKey);
    } else {
      setupChineseInput();
    }
  }

  // ---------- 中文输入设置 ----------
  function setupChineseInput() {
    // 在测试区添加隐藏输入框
    let inputArea = rootEl.querySelector('#zh-input-area');
    if (!inputArea) {
      const textArea = rootEl.querySelector('#speed-text');
      inputArea = document.createElement('div');
      inputArea.id = 'zh-input-area';
      inputArea.className = 'zh-input-area';
      inputArea.innerHTML = '<input type="text" class="zh-hidden-input" id="speed-zh-input" autocomplete="off" placeholder="在此输入中文..." />';
      textArea.parentNode.insertBefore(inputArea, textArea.nextSibling);
    }
    inputArea.hidden = false;

    hiddenInput = rootEl.querySelector('#speed-zh-input');
    hiddenInput.value = '';
    hiddenInput.addEventListener('compositionstart', onCompStart);
    hiddenInput.addEventListener('compositionend', onCompEnd);
    hiddenInput.addEventListener('input', onInput);
    hiddenInput.focus();
  }

  function onCompStart() { state.isComposing = true; }

  function onCompEnd(e) {
    state.isComposing = false;
    const text = e.data || '';
    if (text) processChineseChars(text);
    if (hiddenInput) { hiddenInput.value = ''; setTimeout(() => hiddenInput.focus(), 0); }
  }

  function onInput() {
    if (state.isComposing) return;
    const val = hiddenInput ? hiddenInput.value : '';
    if (val) { processChineseChars(val); if (hiddenInput) hiddenInput.value = ''; }
  }

  function processChineseChars(text) {
    if (!state.running || state.index >= state.target.length) return;
    if (!state.startTime) state.startTime = Date.now();
    for (const ch of text) {
      if (state.index >= state.target.length) break;
      const target = state.target[state.index];
      if (ch === target) { state.correct++; state.status[state.index] = 1; }
      else { state.errors++; state.status[state.index] = 2; }
      state.index++;
      updateTargetChar(); updateStats();
      if (state.index >= state.target.length) { finish(); return; }
    }
  }

  // ---------- 英文章程渲染 ----------
  function renderText() {
    const el = rootEl.querySelector('#speed-text');
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

  // ---------- 统计 ----------
  function updateStats() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const wpm = Math.round(cpm / 5);
    const total = state.correct + state.errors;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 100;
    const progress = state.target.length > 0 ? Math.round(state.index / state.target.length * 100) : 0;

    const wpmEl = rootEl.querySelector('#sp-wpm');
    const cpmEl = rootEl.querySelector('#sp-cpm');
    const accEl = rootEl.querySelector('#sp-acc');
    const progressEl = rootEl.querySelector('#sp-progress');
    const timeEl = rootEl.querySelector('#sp-time');
    if (wpmEl) wpmEl.textContent = wpm;
    if (cpmEl) cpmEl.textContent = cpm;
    if (accEl) accEl.textContent = `${acc}%`;
    if (progressEl) progressEl.textContent = `${progress}%`;
    if (timeEl) timeEl.textContent = fmtTime(elapsed);
  }

  function fmtTime(sec) { const m = Math.floor(sec / 60); const s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; }

  // ---------- 结束 ----------
  function finish() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    window.removeEventListener('keydown', onKey);
    if (hiddenInput) {
      hiddenInput.removeEventListener('compositionstart', onCompStart);
      hiddenInput.removeEventListener('compositionend', onCompEnd);
      hiddenInput.removeEventListener('input', onInput);
      hiddenInput = null;
    }
    const inputArea = rootEl.querySelector('#zh-input-area');
    if (inputArea) inputArea.hidden = true;
    updateStats();

    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 0;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const wpm = Math.round(cpm / 5);

    const overlay = rootEl.querySelector('#speed-result');
    overlay.innerHTML = `
      <div class="result-card card">
        <h2>🎉 测试完成</h2>
        <p class="result-title">${state.article.title}</p>
        <div class="result-grid">
          <div class="result-cell"><b>${wpm}</b><span>词/分 (WPM)</span></div>
          <div class="result-cell"><b>${cpm}</b><span>${state.mode === 'zh' ? '字/分' : '键/分'} (CPM)</span></div>
          <div class="result-cell"><b>${acc}%</b><span>准确率</span></div>
          <div class="result-cell"><b>${fmtTime(elapsed)}</b><span>用时</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="sp-retry">再测一次</button>
          <button class="btn btn-ghost" id="sp-back">返回列表</button>
        </div>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('#sp-retry').addEventListener('click', () => startTest(state.article));
    overlay.querySelector('#sp-back').addEventListener('click', () => showList());
    saveRecord(state.article.title, cpm, wpm, acc, elapsed);
  }

  function saveRecord(title, cpm, wpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const errorsList = Object.values(state.errorLog);
    const type = state.mode === 'zh' ? 'zh-speed' : (state.mode === 'code' ? 'code-speed' : 'speed');
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type, title,
      text: state.target, status: state.status,
      cpm, wpm, accuracy, time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      errors: errorsList.length > 0 ? errorsList : undefined
    }).catch((e) => console.warn('保存成绩失败', e));
  }

  // ---------- 英文击键 ----------
  function onKey(e) {
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
        renderText(); updateStats();
      }
      return;
    }
    // 允许 Enter 作为换行符输入（代码片段含 \n，否则会卡在换行处）
    const isEnter = e.key === 'Enter';
    if (!isEnter && e.key.length !== 1) return;
    e.preventDefault();
    if (!state.running || state.index >= state.target.length) return;
    if (!state.startTime) state.startTime = Date.now();
    const target = state.target[state.index];
    const pressed = isEnter ? '\n' : e.key;
    if (pressed === target) { state.correct++; state.status[state.index] = 1; }
    else { state.errors++; state.status[state.index] = 2; }
    state.index++;
    updateTargetChar(); updateStats();
    if (state.index >= state.target.length) finish();
  }

  function updateTargetChar() {
    const el = rootEl.querySelector('#speed-text');
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

  // ---------- 生命周期 ----------
  function mount() {
    render();
  }

  function unmount() {
    showList();
    window.removeEventListener('keydown', onKey);
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.running = false;
  }

  return { mount, unmount };
})();

window.SpeedTest = SpeedTest;