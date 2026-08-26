/* ============================================================
   程序员打字模块（挂载到"程序员练习"视图）
   - 参照 fingerTraining 结构：语言条 + 课程条 + 键盘 + 目标行 + 统计栏
   - 支持两种语言切换：Python 3.12 / Java 17 (LTS)
   - 支持 Shift 符号高亮（SHIFT_MAP）
   - 复用 finger-lessons.js 的 KBD / KEY_FINGER 键盘数据
   依赖：coder-lessons.js（CODER_LANGUAGES / SHIFT_MAP）
   ============================================================ */

const CoderTyping = (() => {
  // ---------- 模块状态 ----------
  const state = {
    lang: null, // 当前语言 id
    lesson: null,
    target: '',
    index: 0,
    correct: 0,
    errors: 0,
    running: false,
    startTime: 0,
    timer: null,
    errorLog: {}
  };

  let rootEl = null;

  // ---------- 语言辅助 ----------
  function getLang() {
    if (!state.lang) state.lang = window.CODER_LANGUAGES[0].id;
    return window.CODER_LANGUAGES.find((l) => l.id === state.lang) || window.CODER_LANGUAGES[0];
  }

  function getLessons() {
    return getLang().lessons;
  }

  // ---------- 渲染主结构 ----------
  function render() {
    rootEl = document.getElementById('coder-training');
    rootEl.innerHTML = `
      <div class="finger-root coder-root">
        <div class="lesson-bar lang-bar">${renderLangs()}</div>
        <div class="lesson-bar">${renderLessons()}</div>
        <div class="finger-card card">
          <div class="target-area">
            <div class="target-line coder-target-line" id="ct-target"></div>
            <div class="finger-hint" id="ct-hint">👆 点击上方课程开始练习</div>
          </div>
          ${renderKeyboard()}
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-value" id="ct-progress">0/0</span><span class="stat-label">进度</span></div>
            <div class="stat-item"><span class="stat-value" id="ct-errors">0</span><span class="stat-label">错误</span></div>
            <div class="stat-item"><span class="stat-value" id="ct-acc">-</span><span class="stat-label">准确率</span></div>
            <div class="stat-item"><span class="stat-value" id="ct-cpm">-</span><span class="stat-label">速度(键/分)</span></div>
            <div class="stat-item"><span class="stat-value" id="ct-time">0:00</span><span class="stat-label">用时</span></div>
          </div>
        </div>
        <div class="result-overlay" id="ct-result" hidden></div>
      </div>`;

    rootEl.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.lang !== state.lang) {
          state.lang = btn.dataset.lang;
          state.lesson = null;
          state.running = false;
          if (state.timer) { clearInterval(state.timer); state.timer = null; }
          render();
        }
      });
    });

    rootEl.querySelectorAll('.lesson-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lesson = getLessons().find((l) => l.id === Number(btn.dataset.id));
        if (lesson) startLesson(lesson);
      });
    });
  }

  // ---------- 语言选择条 ----------
  function renderLangs() {
    return window.CODER_LANGUAGES.map((l) => `
      <button class="lesson-btn lang-btn ${l.id === getLang().id ? 'active' : ''}" data-lang="${l.id}">
        <span class="lesson-name">${l.icon} ${l.name} ${l.version}</span>
        <span class="lesson-desc">${l.versionNote}</span>
      </button>`).join('');
  }

  function renderLessons() {
    return getLessons().map((l, i) => `
      <button class="lesson-btn ${i === 0 ? 'active' : ''}" data-id="${l.id}">
        <span class="lesson-name">${l.name}</span>
        <span class="lesson-desc">${l.desc}</span>
      </button>`).join('');
  }

  // ---------- 完整键盘渲染（同 fingerTraining） ----------
  function renderKeyboard() {
    let html = '<div class="keyboard">';
    window.KBD.forEach((group, ri) => {
      html += `<div class="kbd-row ${window.KBD_CLASSES[ri] || ''}">`;
      group.row.forEach((k) => {
        const w = k.w || 44;
        const widthStyle = `style="flex:0 0 ${w}px;width:${w}px"`;
        if (k.type === 'char') {
          const fingerIdx = window.KEY_FINGER[k.key] !== undefined ? window.KEY_FINGER[k.key] : 4;
          const colorCls = window.FINGER_COLOR[fingerIdx] || 'thumb';
          html += `<span class="kbd-key ${colorCls}" data-key="${k.key}" ${widthStyle}>
                     ${k.sub ? `<span class="key-sub">${k.sub}</span>` : ''}
                     <span class="key-main">${k.label}</span>
                   </span>`;
        } else {
          html += `<span class="kbd-key ${k.type === 'thumb' ? 'thumb' : 'func'}" data-key="${k.key}" ${widthStyle}>
                     <span class="key-main">${k.label}</span>
                   </span>`;
        }
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // ---------- 目标序列渲染 ----------
  function renderTarget() {
    const el = rootEl.querySelector('#ct-target');
    el.innerHTML = '';
    [...state.target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'target-char coder-char';
      span.textContent = ch;
      if (i < state.index) span.classList.add('done');
      if (i === state.index) span.classList.add('current');
      el.appendChild(span);
    });
    updateExpect();
  }

  // ---------- 期望键高亮 + 指法提示（支持 Shift 符号） ----------
  function updateExpect() {
    rootEl.querySelectorAll('.kbd-key.expect, .kbd-key.expect-shift').forEach((k) =>
      k.classList.remove('expect', 'expect-shift'));
    const hint = rootEl.querySelector('#ct-hint');
    if (!state.running || state.index >= state.target.length) {
      hint.textContent = state.running ? '🎉 已完成，正在生成成绩…' : '👆 点击上方课程开始练习';
      return;
    }
    const ch = state.target[state.index];
    const isShift = window.needsShift(ch);
    const baseKey = window.getBaseKey(ch);
    rootEl.querySelectorAll(`.kbd-key[data-key="${CSS.escape(baseKey)}"]`).forEach((k) => k.classList.add('expect'));
    if (isShift) {
      rootEl.querySelectorAll('.kbd-key[data-key="shift"]').forEach((k) => k.classList.add('expect-shift'));
    }
    const fp = window.KEY_FINGER[baseKey];
    const extra = isShift ? '（需要按住 Shift）' : '';
    hint.textContent = `👈 当前字符: ${showChar(ch)}${extra} · 用 ${window.FINGER_NAME[fp]} 按 · ${window.FINGER_HINT[fp]}`;
  }

  function showChar(ch) { return ch === ' ' ? '空格' : ch; }

  // ---------- 统计 ----------
  function updateStats() {
    const done = state.correct + state.errors;
    const acc = done > 0 ? (state.correct / done * 100).toFixed(1) : '-';
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const cpm = elapsed > 0 ? Math.round((state.correct / elapsed) * 60) : '-';
    rootEl.querySelector('#ct-progress').textContent = `${state.index}/${state.target.length}`;
    rootEl.querySelector('#ct-errors').textContent = state.errors;
    rootEl.querySelector('#ct-acc').textContent = `${acc}%`;
    rootEl.querySelector('#ct-cpm').textContent = cpm;
    rootEl.querySelector('#ct-time').textContent = fmtTime(elapsed);
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ---------- 开始 / 结束 ----------
  function startLesson(lesson) {
    state.lesson = lesson;
    state.target = window.buildTarget(lesson);
    state.index = 0;
    state.correct = 0;
    state.errors = 0;
    state.errorLog = {};
    state.running = true;
    state.startTime = 0;

    rootEl.querySelectorAll('.lesson-btn:not(.lang-btn)').forEach((b) =>
      b.classList.toggle('active', Number(b.dataset.id) === lesson.id));
    rootEl.querySelector('#ct-result').hidden = true;
    renderTarget();
    updateStats();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(updateStats, 500);
  }

  function finish() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    updateStats();

    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const acc = state.correct + state.errors > 0
      ? Math.round(state.correct / (state.correct + state.errors) * 100) : 0;
    const cpm = elapsed > 0 ? Math.round((state.correct / elapsed) * 60) : 0;
    const wpm = Math.round(cpm / 5);
    const langName = getLang().name;

    const overlay = rootEl.querySelector('#ct-result');
    overlay.innerHTML = `
      <div class="result-card card">
        <h2>🎉 课程完成</h2>
        <p class="result-title">${langName} · ${state.lesson.name}（共 ${state.target.length} 键）</p>
        <div class="result-grid">
          <div class="result-cell"><b>${cpm}</b><span>键/分 (CPM)</span></div>
          <div class="result-cell"><b>${wpm}</b><span>词/分 (WPM)</span></div>
          <div class="result-cell"><b>${acc}%</b><span>准确率</span></div>
          <div class="result-cell"><b>${fmtTime(elapsed)}</b><span>用时</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="ct-retry">再练一次</button>
          <button class="btn btn-ghost" id="ct-close">关闭</button>
        </div>
      </div>`;
    overlay.hidden = false;

    overlay.querySelector('#ct-retry').addEventListener('click', () => startLesson(state.lesson));
    overlay.querySelector('#ct-close').addEventListener('click', () => { overlay.hidden = true; updateExpect(); });

    saveRecord(`${getLang().name} · ${state.lesson.name}`, cpm, wpm, acc, elapsed);
  }

  function saveRecord(title, cpm, wpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const errorsList = Object.values(state.errorLog);
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'coder', title,
      cpm, wpm, accuracy, time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      errors: errorsList.length > 0 ? errorsList : undefined
    }).catch((e) => console.warn('保存成绩失败', e));
  }

  // ---------- 击键处理 ----------
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (!state.running || state.index >= state.target.length) return;

    if (!state.startTime) state.startTime = Date.now();

    const target = state.target[state.index];
    const matched = (e.key === target);
    const baseKey = window.getBaseKey(target);
    const keyEl = rootEl.querySelector(`.kbd-key[data-key="${CSS.escape(baseKey)}"]`);

    if (matched) {
      state.correct++;
      state.index++;
      flash(keyEl, 'correct');
      if (state.index >= state.target.length) {
        finish();
      } else {
        renderTarget();
      }
    } else {
      state.errors++;
      if (!state.errorLog[target]) state.errorLog[target] = { expected: target, typed: e.key, count: 0 };
      state.errorLog[target].count++;
      flash(keyEl, 'error');
    }
    updateStats();
  }

  function flash(keyEl, cls) {
    if (!keyEl) return;
    keyEl.classList.remove('correct', 'error');
    void keyEl.offsetWidth;
    keyEl.classList.add(cls);
    setTimeout(() => keyEl.classList.remove(cls), 260);
  }

  // ---------- 模块生命周期 ----------
  function mount() {
    render();
    window.addEventListener('keydown', onKey);
  }

  function unmount() {
    window.removeEventListener('keydown', onKey);
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.running = false;
  }

  return { mount, unmount };
})();

window.CoderTyping = CoderTyping;