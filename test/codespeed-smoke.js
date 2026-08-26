// 冒烟：代码速度测试（28 段）渲染与开始
const { app, BrowserWindow } = require('electron');
const path = require('path');
const FRONTEND = path.join(__dirname, '..', 'frontend', 'index.html');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1100, height: 750, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, '..', 'backend', 'preload.js') } });
  const errors = [];
  win.webContents.on('console-message', (e, level, m) => { if (level >= 2) errors.push(m); });
  await win.loadFile(FRONTEND);
  await new Promise(r => setTimeout(r, 900));
  await win.webContents.executeJavaScript(`window.app.Router.switch('speed')`);
  await new Promise(r => setTimeout(r, 300));

  const res = await win.webContents.executeJavaScript(`(async () => {
    const total = window.CODE_SNIPPETS.length;
    const langs = [...new Set(window.CODE_SNIPPETS.map(s => s.lang))];
    [...document.querySelectorAll('#speed-tabs .speed-tab')].find(t => t.dataset.tab === 'code').click();
    await new Promise(r => setTimeout(r, 150));
    const cards = document.querySelectorAll('#speed-cards .article-card').length;
    const meta = document.querySelector('#speed-cards .code-card-meta')?.textContent || '';
    document.querySelector('#speed-cards .article-card').click();
    await new Promise(r => setTimeout(r, 200));
    const testing = !document.getElementById('speed-testing').hidden;
    const title = document.getElementById('speed-title').textContent;
    return { total, langs, cards, meta, testing, title };
  })()`);
  console.log(JSON.stringify(res));
  console.log('errors:', errors.length ? errors.join('\n') : '(none)');
  app.exit(0);
}).catch(e => { console.error('FAIL', e); app.exit(1); });
