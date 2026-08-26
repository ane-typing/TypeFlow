/* ============================================================
   拼音打字模块 - 课程制
   - 渐进课程（音节 → 单字 → 词语 → 句子）
   - 课程条 + 目标行 + 输入区 + 统计栏
   - IME 输入法（composition 事件）
   ============================================================ */

// ---------- 拼音课程数据 ----------
const PINYIN_LESSONS = [
  {
    id: 1, name: '课程1 基本音节', desc: '单韵母 + 声母入门',
    text: '爸爸 妈妈 大马 土地 笔记 努力 机器 法律 合理 集体 独立 初步 目标 那么 你们 他们 自己 可以 主要 电脑'
  },
  {
    id: 2, name: '课程2 常用单字', desc: '高频汉字逐一练习',
    text: '的是了我你有他在不们和就对都可也这那上会为来以人要个到能生时地子中国年得说下出过家学天里小好自长大工作己经发'
  },
  {
    id: 3, name: '课程3 二字词语', desc: '常用二字词语组合',
    text: '我们学习电脑工作生活快乐大家学校老师朋友阅读音乐电影美丽阳光幸福知道可以应该所以因为如果而且虽然但是非常'
  },
  {
    id: 4, name: '课程4 三字短语', desc: '三字及以上常用短语',
    text: '现代化高科技越来越大多数互联网计算机人工智能自动化生产力世界观人生观价值观高科技越来越美好现代化越来越强大'
  },
  {
    id: 5, name: '课程5 短句练习', desc: '简单句输入练习',
    text: '我爱学习。今天是晴天。我们一起去看电影。这个电影很好看。明天我要去图书馆。周末我们去公园玩。今天的天气非常好。我喜欢和朋友们一起玩。'
  },
  {
    id: 6, name: '课程6 综合练习', desc: '混合短句全面练习',
    text: '知识就是力量。读书使人进步。实践出真知。团结就是力量。一寸光阴一寸金。少壮不努力老大徒伤悲。世上无难事只怕有心人。'
  }
];

const PinyinTyping = (() => {
  const state = {
    lesson: null,
    target: '',
    index: 0,
    correct: 0,
    errors: 0,
    running: false,
    startTime: 0,
    timer: null,
    status: [],
    errorLog: {},
    isComposing: false
  };

  let rootEl = null;
  let hiddenInput = null;
  let onBack = null;

  function mount(container, backCb) {
    rootEl = container;
    onBack = backCb || (() => {});
    render();
  }

  function unmount() {
    stopTimer();
    if (hiddenInput) {
      hiddenInput.removeEventListener('compositionstart', onCompositionStart);
      hiddenInput.removeEventListener('compositionend', onCompositionEnd);
      hiddenInput.removeEventListener('input', onInput);
      hiddenInput.removeEventListener('keydown', onKeyDown);
      hiddenInput = null;
    }
    state.running = false;
  }

  function render() {
    rootEl.innerHTML = `
      <div class="zh-root">
        <div class="lesson-bar">
          <button class="btn btn-ghost" id="py-back">← 返回</button>
        </div>
        <div class="lesson-bar" id="py-lessons">${renderLessons()}</div>
        <div class="zh-card card">
          <div class="target-area">
            <div class="target-line" id="py-target"></div>
            <div class="zh-hint" id="py-hint">👆 点击上方课程开始练习</div>
          </div>
          <div class="zh-input-area">
            <input type="text" class="zh-hidden-input" id="py-input" autocomplete="off" placeholder="点击课程后，在此输入..." />
          </div>
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-value" id="py-progress">0/0</span><span class="stat-label">进度</span></div>
            <div class="stat-item"><span class="stat-value" id="py-errors">0</span><span class="stat-label">错误</span></div>
            <div class="stat-item"><span class="stat-value" id="py-acc">-</span><span class="stat-label">准确率</span></div>
            <div class="stat-item"><span class="stat-value" id="py-cpm">-</span><span class="stat-label">字/分</span></div>
            <div class="stat-item"><span class="stat-value" id="py-time">0:00</span><span class="stat-label">用时</span></div>
          </div>
        </div>
        <div class="result-overlay" id="py-result" hidden></div>
      </div>`;

    rootEl.querySelector('#py-back').addEventListener('click', onBack);
    rootEl.querySelectorAll('.lesson-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lesson = PINYIN_LESSONS.find((l) => l.id === Number(btn.dataset.id));
        if (lesson) startLesson(lesson);
      });
    });
  }

  function renderLessons() {
    return PINYIN_LESSONS.map((l, i) => `
      <button class="lesson-btn ${i === 0 ? 'active' : ''}" data-id="${l.id}">
        <span class="lesson-name">${l.name}</span>
        <span class="lesson-desc">${l.desc}</span>
      </button>`).join('');
  }

  function startLesson(lesson) {
    state.lesson = lesson;
    state.target = lesson.text;
    state.index = 0;
    state.correct = 0;
    state.errors = 0;
    state.running = true;
    state.startTime = 0;
    state.status = state.target.split('').map(() => 0);
    state.errorLog = {};
    state.isComposing = false;

    rootEl.querySelectorAll('.lesson-btn').forEach((b) =>
      b.classList.toggle('active', Number(b.dataset.id) === lesson.id));
    rootEl.querySelector('#py-result').hidden = true;
    renderTarget();
    updateStats();
    startTimer();
    setupInput();
  }

  function setupInput() {
    if (hiddenInput) {
      hiddenInput.removeEventListener('compositionstart', onCompositionStart);
      hiddenInput.removeEventListener('compositionend', onCompositionEnd);
      hiddenInput.removeEventListener('input', onInput);
      hiddenInput.removeEventListener('keydown', onKeyDown);
    }
    hiddenInput = rootEl.querySelector('#py-input');
    hiddenInput.value = '';
    hiddenInput.addEventListener('compositionstart', onCompositionStart);
    hiddenInput.addEventListener('compositionend', onCompositionEnd);
    hiddenInput.addEventListener('input', onInput);
    hiddenInput.addEventListener('keydown', onKeyDown);
    hiddenInput.focus();
  }

  function onCompositionStart() { state.isComposing = true; }

  function onCompositionEnd(e) {
    state.isComposing = false;
    const text = e.data || '';
    if (text) processChars(text);
    if (hiddenInput) { hiddenInput.value = ''; setTimeout(() => hiddenInput.focus(), 0); }
  }

  function onInput() {
    if (state.isComposing) return;
    const val = hiddenInput ? hiddenInput.value : '';
    if (val) { processChars(val); if (hiddenInput) hiddenInput.value = ''; }
  }

  function onKeyDown(e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (state.running && state.index > 0 && !state.isComposing) {
        state.index--;
        state.status[state.index] = 0;
        recalcStats();
        renderTarget();
        updateStats();
      }
      return;
    }
    if (!state.startTime && !state.isComposing && e.key.length === 1) {
      state.startTime = Date.now();
    }
  }

  function recalcStats() {
    state.correct = 0; state.errors = 0;
    for (let i = 0; i < state.index; i++) {
      if (state.status[i] === 1) state.correct++;
      else if (state.status[i] === 2) state.errors++;
    }
  }

  function processChars(text) {
    if (!state.running || state.index >= state.target.length) return;
    if (!state.startTime) state.startTime = Date.now();
    for (const ch of text) {
      if (state.index >= state.target.length) break;
      const target = state.target[state.index];
      if (ch === target) { state.correct++; state.status[state.index] = 1; }
      else {
        state.errors++; state.status[state.index] = 2;
        if (target.charCodeAt(0) >= 0x4e00) {
          if (!state.errorLog[target]) state.errorLog[target] = { expected: target, typed: ch, count: 0 };
          state.errorLog[target].count++;
        }
      }
      state.index++;
      renderTarget(); updateStats();
      if (state.index >= state.target.length) { finish(); return; }
    }
  }

  function renderTarget() {
    const el = rootEl.querySelector('#py-target');
    if (!el) return;
    el.innerHTML = '';
    [...state.target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'target-char';
      span.textContent = ch;
      if (i < state.index) span.classList.add(state.status[i] === 1 ? 'done' : 'err');
      if (i === state.index) span.classList.add('current');
      el.appendChild(span);
    });
    const cur = el.querySelector('.current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    const hint = rootEl.querySelector('#py-hint');
    if (hint) {
      if (!state.running) hint.textContent = '👆 点击上方课程开始练习';
      else if (state.index >= state.target.length) hint.textContent = '🎉 已完成！';
      else hint.textContent = `🎯 请输入 "${state.target[state.index]}"（共 ${state.target.length} 字）`;
    }
  }

  function updateStats() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 100;
    rootEl.querySelector('#py-progress').textContent = `${state.index}/${state.target.length}`;
    rootEl.querySelector('#py-errors').textContent = state.errors;
    rootEl.querySelector('#py-acc').textContent = total > 0 ? `${acc}%` : '-';
    rootEl.querySelector('#py-cpm').textContent = cpm;
    rootEl.querySelector('#py-time').textContent = fmtTime(elapsed);
  }

  function fmtTime(sec) { const m = Math.floor(sec / 60); const s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; }
  function startTimer() { stopTimer(); state.timer = setInterval(updateStats, 500); }
  function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }

  function finish() {
    state.running = false; stopTimer();
    updateStats();
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 0;
    const cpm = minutes > 0 ? Math.round(state.correct / minutes) : 0;
    const overlay = rootEl.querySelector('#py-result');
    overlay.innerHTML = `
      <div class="result-card card">
        <h2>🎉 练习完成</h2>
        <p class="result-title">${state.lesson.name}（共 ${state.target.length} 字）</p>
        <div class="result-grid">
          <div class="result-cell"><b>${cpm}</b><span>字/分</span></div>
          <div class="result-cell"><b>${acc}%</b><span>准确率</span></div>
          <div class="result-cell"><b>${fmtTime(elapsed)}</b><span>用时</span></div>
          <div class="result-cell"><b>${state.errors}</b><span>错误</span></div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" id="py-retry">再练一次</button>
          <button class="btn btn-ghost" id="py-close">关闭</button>
        </div>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('#py-retry').addEventListener('click', () => startLesson(state.lesson));
    overlay.querySelector('#py-close').addEventListener('click', () => { overlay.hidden = true; renderTarget(); });
    saveRecord(state.lesson.name, cpm, acc, elapsed);
  }

  function saveRecord(title, cpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'pinyin', title,
      text: state.target, status: state.status,
      cpm, wpm: Math.round(cpm / 5), accuracy,
      time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }).catch((e) => console.warn('保存成绩失败', e));
  }

  return { mount, unmount };
})();

window.PinyinTyping = PinyinTyping;