/* ============================================================
   五笔打字模块 - 课程制
   - 渐进课程（一级简码 → 键名字 → 高频字 → 词组 → 文章）
   - 课程条 + 目标行 + 编码输入区 + 统计栏
   依赖：wubiDict.js（getWubi）
   ============================================================ */

// ---------- 五笔课程数据 ----------
const WUBI_LESSONS = [
  {
    id: 1, name: '课程1 一级简码', desc: '25个高频一级简码字',
    text: '一地在要工上是中国同和的有人我主产不为这民了发以经'
  },
  {
    id: 2, name: '课程2 键名字', desc: '键盘字根键名汉字',
    text: '金木水火土日月口田山王土大木工目日口田山又女子白手立言耳刀弓禾竹'
  },
  {
    id: 3, name: '课程3 高频单字', desc: '常用汉字编码练习',
    text: '的了我你有他在不们和就对都可也这那上会为来以人要个到能生时地子中国年得说下出过家学天里小好自长大工作己经发'
  },
  {
    id: 4, name: '课程4 二字词组', desc: '常用二字词组编码',
    text: '我们可以没有这个进行工作学习电脑生活快乐朋友老师学校阅读音乐电影美丽阳光幸福知道应该所以因为如果而且虽然但是非常'
  },
  {
    id: 5, name: '课程5 综合词组', desc: '三字以上词组与短句',
    text: '现代化高科技越来越计算机互联网人工智能生产力世界观人生观价值观环境保护可持续发展技术革命创新驱动改革开放'
  },
  {
    id: 6, name: '课程6 文章练习', desc: '精选短文综合练习',
    text: '知识就是力量。读书使人进步。实践出真知。团结就是力量。一寸光阴一寸金。少壮不努力老大徒伤悲。世上无难事只怕有心人。'
  }
];

const WubiTyping = (() => {
  const state = {
    lesson: null,
    target: '',
    codes: [],
    charIndex: 0,
    codeIndex: 0,
    correct: 0,
    errors: 0,
    running: false,
    startTime: 0,
    timer: null,
    errorLog: {}
  };

  let rootEl = null;
  let onBack = null;

  function mount(container, backCb) {
    rootEl = container;
    onBack = backCb || (() => {});
    render();
    window.addEventListener('keydown', onKey);
  }

  function unmount() {
    stopTimer();
    window.removeEventListener('keydown', onKey);
    state.running = false;
  }

  function render() {
    rootEl.innerHTML = `
      <div class="zh-root">
        <div class="lesson-bar">
          <button class="btn btn-ghost" id="wb-back">← 返回</button>
        </div>
        <div class="lesson-bar" id="wb-lessons">${renderLessons()}</div>
        <div class="zh-card card">
          <div class="target-area">
            <div class="target-line" id="wb-target"></div>
            <div class="wb-code-area">
              <div class="wb-code-display" id="wb-code-display">
                <span class="wb-code-idle">👆 点击上方课程开始练习</span>
              </div>
              <div class="wb-hint" id="wb-hint"></div>
            </div>
          </div>
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-value" id="wb-progress">0/0</span><span class="stat-label">进度</span></div>
            <div class="stat-item"><span class="stat-value" id="wb-errors">0</span><span class="stat-label">错误</span></div>
            <div class="stat-item"><span class="stat-value" id="wb-acc">-</span><span class="stat-label">准确率</span></div>
            <div class="stat-item"><span class="stat-value" id="wb-cpm">-</span><span class="stat-label">字/分</span></div>
            <div class="stat-item"><span class="stat-value" id="wb-time">0:00</span><span class="stat-label">用时</span></div>
          </div>
        </div>
        <div class="result-overlay" id="wb-result" hidden></div>
      </div>`;

    rootEl.querySelector('#wb-back').addEventListener('click', onBack);
    rootEl.querySelectorAll('.lesson-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lesson = WUBI_LESSONS.find((l) => l.id === Number(btn.dataset.id));
        if (lesson) startLesson(lesson);
      });
    });
  }

  function renderLessons() {
    return WUBI_LESSONS.map((l, i) => `
      <button class="lesson-btn ${i === 0 ? 'active' : ''}" data-id="${l.id}">
        <span class="lesson-name">${l.name}</span>
        <span class="lesson-desc">${l.desc}</span>
      </button>`).join('');
  }

  function startLesson(lesson) {
    state.lesson = lesson;
    state.target = lesson.text;
    state.codes = [];
    for (const ch of state.target) {
      const code = getWubi(ch);
      // 有编码的拆成字母数组，无编码（标点符号）标为 null 自动跳过
      state.codes.push(code ? code.split('') : null);
    }
    state.charIndex = 0;
    state.codeIndex = 0;
    state.correct = 0;
    state.errors = 0;
    state.running = true;
    state.startTime = 0;
    state.errorLog = {};

    rootEl.querySelectorAll('.lesson-btn').forEach((b) =>
      b.classList.toggle('active', Number(b.dataset.id) === lesson.id));
    rootEl.querySelector('#wb-result').hidden = true;
    skipPunct(); // 跳过开头标点
    renderTarget();
    renderCodeDisplay();
    updateStats();
    startTimer();
  }

  // 跳过无编码的标点符号
  function skipPunct() {
    while (state.charIndex < state.target.length && state.codes[state.charIndex] === null) {
      state.charIndex++;
    }
  }

  function renderTarget() {
    const el = rootEl.querySelector('#wb-target');
    if (!el) return;
    el.innerHTML = '';
    [...state.target].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'target-char';
      if (state.codes[i] === null) span.classList.add('punct'); // 标点符号
      span.textContent = ch;
      if (i < state.charIndex) span.classList.add('done');
      if (i === state.charIndex) span.classList.add('current');
      el.appendChild(span);
    });
    const cur = el.querySelector('.current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    const hint = rootEl.querySelector('#wb-hint');
    if (!state.running) { if (hint) hint.textContent = ''; }
    else if (state.charIndex >= state.target.length) { if (hint) hint.textContent = '🎉 已完成！'; }
    else {
      const ch = state.target[state.charIndex];
      const code = getWubi(ch) || '?';
      if (hint) hint.textContent = `⌨️ 输入 "${ch}" 的编码：${code}`;
    }
  }

  function renderCodeDisplay() {
    const el = rootEl.querySelector('#wb-code-display');
    if (!el) return;
    if (state.charIndex >= state.target.length) {
      el.innerHTML = '<span class="wb-code-done">✅ 已完成</span>';
      return;
    }
    const code = state.codes[state.charIndex];
    if (!code) {
      el.innerHTML = '';
      return;
    }
    const ch = state.target[state.charIndex];
    el.innerHTML = code.map((c, i) => {
      let cls = 'wb-code-char';
      if (i < state.codeIndex) cls += ' done';
      else if (i === state.codeIndex) cls += ' current';
      return `<span class="${cls}">${c}</span>`;
    }).join('') + `<span class="wb-code-ch">${ch}</span>`;
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (!state.running) return;
      if (state.codeIndex > 0) {
        state.codeIndex--;
      } else if (state.charIndex > 0) {
        // 字首退格：回到上一个可输入字符，并把光标放到其编码末尾
        let ci = state.charIndex - 1;
        while (ci > 0 && state.codes[ci] === null) ci--; // 跳过标点
        if (state.codes[ci] === null) {
          // 前面只有标点：退到最开头
          state.charIndex = 0;
          state.codeIndex = 0;
        } else {
          state.charIndex = ci;
          state.codeIndex = state.codes[ci].length - 1;
        }
      }
      renderTarget(); renderCodeDisplay(); updateStats();
      return;
    }
    if (!/^[a-zA-Z]$/.test(e.key)) return;
    e.preventDefault();
    if (!state.running || state.charIndex >= state.target.length) return;
    if (!state.startTime) state.startTime = Date.now();

    const code = state.codes[state.charIndex];
    const targetChar = code[state.codeIndex];
    if (e.key.toLowerCase() === targetChar) {
      state.correct++;
      state.codeIndex++;
      if (state.codeIndex >= code.length) {
        state.charIndex++; state.codeIndex = 0;
        skipPunct(); // 自动跳过后续标点
        renderTarget(); renderCodeDisplay(); updateStats();
        if (state.charIndex >= state.target.length) finish();
      } else { renderCodeDisplay(); updateStats(); }
    } else {
      state.errors++;
      const ch = state.target[state.charIndex];
      if (!state.errorLog[ch]) state.errorLog[ch] = { expected: targetChar, typed: e.key, count: 0 };
      state.errorLog[ch].count++;
      flashCode(); updateStats();
    }
  }

  function flashCode() {
    const el = rootEl.querySelector('#wb-code-display');
    if (!el) return;
    el.classList.remove('wb-flash'); void el.offsetWidth; el.classList.add('wb-flash');
    setTimeout(() => el.classList.remove('wb-flash'), 260);
  }

  function updateStats() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const total = state.correct + state.errors;
    // 字/分按「完成字数」计，而不是按编码字母数（避免虚高）
    const cpm = minutes > 0 ? Math.round(state.charIndex / minutes) : 0;
    const acc = total > 0 ? Math.round(state.correct / total * 100) : 100;
    rootEl.querySelector('#wb-progress').textContent = `${state.charIndex}/${state.target.length}`;
    rootEl.querySelector('#wb-errors').textContent = state.errors;
    rootEl.querySelector('#wb-acc').textContent = total > 0 ? `${acc}%` : '-';
    rootEl.querySelector('#wb-cpm').textContent = cpm;
    rootEl.querySelector('#wb-time').textContent = fmtTime(elapsed);
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
    // 字/分按「完成字数」计
    const cpm = minutes > 0 ? Math.round(state.charIndex / minutes) : 0;
    const overlay = rootEl.querySelector('#wb-result');
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
          <button class="btn btn-primary" id="wb-retry">再练一次</button>
          <button class="btn btn-ghost" id="wb-close">关闭</button>
        </div>
      </div>`;
    overlay.hidden = false;
    overlay.querySelector('#wb-retry').addEventListener('click', () => startLesson(state.lesson));
    overlay.querySelector('#wb-close').addEventListener('click', () => { overlay.hidden = true; renderTarget(); });
    saveRecord(state.lesson.name, cpm, acc, elapsed);
  }

  function saveRecord(title, cpm, accuracy, elapsed) {
    if (!window.api || !window.api.saveRecord) return;
    const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
    window.api.saveRecord({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'wubi', title,
      text: state.target, cpm, wpm: Math.round(cpm / 5), accuracy,
      time: Math.round(elapsed * 10) / 10,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }).catch((e) => console.warn('保存成绩失败', e));
  }

  return { mount, unmount };
})();

window.WubiTyping = WubiTyping;