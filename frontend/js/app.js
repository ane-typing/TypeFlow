/* ============================================================
   打字练习软件 - 应用入口与页面路由
   模块通过 Router.register(name, module) 挂载
   模块需实现 mount()/unmount()
   ============================================================ */

const Router = {
  current: 'practice',
  views: {},

  register(name, module) {
    this.views[name] = module;
  },

  switch(name) {
    const panel = document.getElementById('view-' + name);
    if (!panel) return;

    if (this.views[this.current] && this.current !== name) {
      try { this.views[this.current].unmount && this.views[this.current].unmount(); } catch (e) { console.warn('卸载视图失败', e); }
    }

    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    panel.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
    if (btn) btn.classList.add('active');
    this.current = name;

    const mod = this.views[name];
    if (mod && mod.mount) {
      setTimeout(() => { try { mod.mount(); } catch (e) { console.warn('挂载视图失败', e); } }, 0);
    }
  }
};

function initNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => Router.switch(btn.dataset.view));
  });
}

window.shuffleArticles = function(count, pool) {
  const arr = (pool || window.ARTICLES || []).slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
};

/* ============================================================
   汉语练习模块（入口菜单 + 拼音/五笔子视图）
   ============================================================ */
const ChineseHome = (() => {
  let rootEl = null;
  let currentSub = null; // 'pinyin' | 'wubi' | null

  function render() {
    rootEl = document.getElementById('zh-home');
    showMenu();
  }

  function showMenu() {
    currentSub = null;
    rootEl.innerHTML = `
      <div class="zh-home">
        <div class="view-header">
          <h1>汉语练习</h1>
          <p class="view-desc">选择一种输入法开始练习</p>
        </div>
        <div class="zh-home-cards">
          <div class="zh-home-card" id="zh-to-pinyin">
            <div class="zh-home-icon">🅿️</div>
            <div class="zh-home-title">拼音练习</div>
            <div class="zh-home-desc">使用拼音输入法，逐字输入中文文章</div>
          </div>
          <div class="zh-home-card" id="zh-to-wubi">
            <div class="zh-home-icon">🔤</div>
            <div class="zh-home-title">五笔练习</div>
            <div class="zh-home-desc">输入五笔编码，逐字练习中文打字</div>
          </div>
        </div>
      </div>`;

    rootEl.querySelector('#zh-to-pinyin').addEventListener('click', () => {
      showPinyin();
    });
    rootEl.querySelector('#zh-to-wubi').addEventListener('click', () => {
      showWubi();
    });
  }

  function showPinyin() {
    currentSub = 'pinyin';
    // 拼音练习模块渲染到当前容器
    rootEl.innerHTML = `<div id="zh-pinyin-sub"></div>`;
    PinyinTyping.mount(document.getElementById('zh-pinyin-sub'), () => showMenu());
  }

  function showWubi() {
    currentSub = 'wubi';
    rootEl.innerHTML = `<div id="zh-wubi-sub"></div>`;
    WubiTyping.mount(document.getElementById('zh-wubi-sub'), () => showMenu());
  }

  function mount() {
    render();
  }

  function unmount() {
    if (currentSub === 'pinyin') {
      PinyinTyping.unmount && PinyinTyping.unmount();
    } else if (currentSub === 'wubi') {
      WubiTyping.unmount && WubiTyping.unmount();
    }
    currentSub = null;
  }

  return { mount, unmount };
})();

window.ChineseHome = ChineseHome;

/** 应用启动 */
window.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTheme();
  Router.register('practice', window.FingerTraining);
  Router.register('speed', window.SpeedTest);
  Router.register('weak-point', window.WeakPointTraining);
  Router.register('records', window.Records);
  Router.register('zh', window.ChineseHome);
  Router.register('coder', window.CoderTyping);
  Router.switch('practice');
});

/** 主题切换 */
function initTheme() {
  const saved = localStorage.getItem('typing_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = saved === 'light' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('typing_theme', next);
      btn.textContent = next === 'light' ? '☀️' : '🌙';
    });
  }
}

window.Router = Router;
window.app = { Router };