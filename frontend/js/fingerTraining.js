/* ============================================================
   键位指法练习模块（挂载到"英文练习"视图）
   - 还原真实键盘长相（倾斜错位 + 完整键位）
   - 课程选择 → 随机目标序列 → 逐键输入判定（支持大小写/Shift）
   - 键盘按手指配色，正确绿 / 错误红 / 当前期望高亮
   - 实时统计与课程成绩保存（type: 'finger'）
   依赖：finger-lessons.js（LESSONS / KEY_FINGER / FINGER_NAME / KBD 等）
   ============================================================ */

const FingerTraining = (() => {
  // ---------- 模块状态 ----------
  const state = {
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

  // ---------- 渲染主结构 ----------
  function render() {
    rootEl = document.getElementById('finger-training');
    rootEl.innerHTML = `
      <div class="finger-root">
        <div class="lesson-bar">${renderLessons()}</div>
        <div class="finger-card card">
          <div class="target-area">
            <div class="target-line" id="ft-target"></div>
            <div class="finger-hint" id="ft-hint">👆 点击上方课程开始练习</div>
          </div>
          ${renderKeyboard()}
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-value" id="ft-progress">0/0</span><span class="stat-label">进度</span></div>
            <div class="stat-item"><span class="stat-value" id="ft-errors">0</span><span class="stat-label">错误</span></div>
            <div class="stat-item"><span class="stat-value" id="ft-acc">-</span><span class="stat-label">准确率</span></div>
            <div class="stat-item"><span class="stat-value" id="ft-cpm">-</span><span class="stat-label">速度(键/分)</span></div>
            <div class="stat-item"><span class="stat-value" id="ft-time">0:00</span><span class="stat-label">用时</span></div>
          </div>
        </div>
        <div class="result-overlay" id="ft-result" hidden></div>
      </div>`;

    rootEl.querySelectorAll('.lesson-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lesson = window.LESSONS.find((l) => l.id === Number(btn.dataset.id));
        if (lesson) startLesson(lesson);
      });
    });
  }

  // ---------- 课程条 ----------
  function renderLessons() {
    return window.LESSONS.map((l, i) => `
      <button class="lesson-btn ${i === 0 ? 'active' : ''}" data-id="${l.id}">
        <span class="lesson-name">${l.name}</span>
        <span class="lesson-desc">${l.desc}</span>
      </button>`).join('');
  }

  // ---------- 真实键盘渲染 ----------
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
    const el = rootEl.querySelector('#ft-target');
    el.innerHTML = '';
    [...state.target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'target-char';
      span.textContent = ch;
      if (i < state.index) span.classList.add('done');
      if (i === state.index) span.classList.add('current');
      el.appendChild(span);
    });
    updateExpect();
  }

  // ---------- 期望键高亮 + 指法提示 ----------
  function updateExpect() {
    // 清掉上一次期望高亮（含 Shift 提示）
    rootEl.querySelectorAll('.kbd-key.expect, .kbd-key.expect-shift').forEach((k) => k.classList.remove('expect', 'expect-shift'));
    const hint = rootEl.querySelector('#ft-hint');
    if (!state.running || state.index >= state.target.length) {
      hint.textContent = state.running ? '🎉 已完成，正在生成成绩…' : '👆 点击上方课程开始练习';
      return;
    }
    const ch = state.target[state.index];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const matchKey = ch.toLowerCase();
    // 高亮目标字符所在键
    rootEl.querySelectorAll(`.kbd-key[data-key="${CSS.escape(matchKey)}"]`).forEach((k) => k.classList.add('expect'));
    // 大写字符需同时提示 Shift
    if (isUpper) {
      rootEl.querySelectorAll('.kbd-key[data-key="shift"]').forEach((k) => k.classList.add('expect-shift'));
    }
    const fp = window.KEY_FINGER[matchKey];
    const extra = isUpper ? '（需要按住 Shift）' : '';
    hint.textContent = `👈 当前字符: ${showChar(ch)}${extra} · 用 ${window.FINGER_NAME[fp]} 按 · ${window.FINGER_HINT[fp]}`;
  }

  function showChar(ch) { return ch === ' ' ? '空格' : ch; }

  // ---------- 统计 ----------
  function updateStats() {
    const done = state.correct + state.errors;
    const acc = done > 0 ? (state.correct / done * 100).toFixed(1) : '-';
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const cpm = elapsed > 0 ? Math.round((state.correct / elapsed) * 60) : '-';
    rootEl.querySelector('#ft-progress').textContent = `${state.index}/${state.target.length}`;
    rootEl.querySelector('#ft-errors').textContent = state.errors;
    rootEl.querySelector('#ft-acc').textContent = `${acc}%`;
    rootEl.querySelector('#ft-cpm').textContent = cpm;
    rootEl.querySelector('#ft-time').textContent = fmtTime(elapsed);
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
    state.startTime = 0; // 点击课程不立即计时，按下第一个键才启动

    rootEl.querySelectorAll('.lesson-btn').forEach((b) =>
      b.classList.toggle('active', Number(b.dataset.id) === lesson.id));
    rootEl.querySelector('#ft-result').hidden = true;
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

    const overlay = rootEl.querySelector('#ft-result');
    overlay.innerHTML = `
      <div class="result-card card">
        <h2>🎉 课程完成</h2>
        <p class="result-title">${state.lesson.name}（共 ${state.target.length} 键）</p>
        <div class="result-grid">
          <div class="result-cell"><b>${cpm}</b><span>键/分 (CPM)</span></div>
          <div class="result-cell"><b>${wpm}</b><span>词/分 (WPM)</span></div>
          <div class="result-cell"><b>${acc}%</b><span>准确率</span></div>
          <div class="result-cell"><b>${fmtTime(elapsed)}</b><span>用时</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="ft-retry">再练一次</button>
          <button class="btn btn-ghost" id="ft-close">关闭</button>
        </div>
      </div>`;
    overlay.hidden = false;

    overlay.querySelector('#ft-retry').addEventListener('click', () => startLesson(state.lesson));
    overlay.querySelector('#ft-close').addEventListener('click', () => { overlay.hidden = true; updateExpect(); });

    saveRecord(state.lesson.name, cpm, wpm, acc, elapsed);
  }

  function saveRecord(title, cpm, wpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const errorsList = Object.values(state.errorLog);
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'finger',
      title,
      cpm, wpm, accuracy, time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      errors: errorsList.length > 0 ? errorsList : undefined
    }).catch((e) => console.warn('保存成绩失败', e));
  }

  // ---------- 击键处理 ----------
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    // 只处理单个字符键：过滤功能键（CapsLock/Shift/Tab/Enter/Backspace 等），确保 Caps Lock 不计入错误
    if (e.key.length !== 1) return;
    // 阻止空格滚动页面等默认行为
    e.preventDefault();
    if (!state.running || state.index >= state.target.length) return;

    // 按下第一个键时才开始计时
    if (!state.startTime) state.startTime = Date.now();

    const target = state.target[state.index];
    const isUpper = target >= 'A' && target <= 'Z';
    // 通过实际输入字符匹配（区分大小写）
    const matched = (e.key === target);
    const matchKey = target.toLowerCase();
    const keyEl = rootEl.querySelector(`.kbd-key[data-key="${CSS.escape(matchKey)}"]`);

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
      // 记录错误详情
      if (!state.errorLog[target]) state.errorLog[target] = { expected: target, typed: e.key, count: 0 };
      state.errorLog[target].count++;
      flash(keyEl, 'error');
    }
    updateStats();
  }

  // 键盘键瞬时反馈（绿/红闪烁）
  function flash(keyEl, cls) {
    if (!keyEl) return;
    keyEl.classList.remove('correct', 'error');
    void keyEl.offsetWidth; // 触发重排以支持连续动画
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

window.FingerTraining = FingerTraining;