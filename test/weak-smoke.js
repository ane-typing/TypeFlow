// 冒烟测试：验证弱项特训的三处改动
// 1) 排行榜显示每个键的错误上下文示例  2) 空格不计入通用弱项  3) 可删除单个弱项
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const FRONTEND = path.join(__dirname, '..', 'frontend', 'index.html');
const SEED = path.join(os.tmpdir(), 'dsh-typing-weak-seed', 'records.json');
fs.mkdirSync(path.dirname(SEED), { recursive: true });

// 构造测试成绩：speed 记录里 t 错 1 次、空格错 1 次；coder 记录里 ; 错 2 次（期望->实际）
const text = 'the quick brown fox jumps over';
const status = new Array(text.length).fill(0);
status[0] = 2; // 't' 错
status[3] = 2; // ' ' 空格错（应被排除）
const seed = [
  { id: 's1', type: 'speed', title: 'Speed A', text, status,
    cpm: 100, wpm: 20, accuracy: 90, time: 30, date: '2026-08-26 12:00' },
  { id: 'c1', type: 'coder', title: 'Python · 课程5',
    errors: [{ expected: ';', typed: 'a', count: 2 }] },
  { id: 'f1', type: 'finger', title: 'Finger L1',
    errors: [{ expected: 'q', typed: 'w', count: 1 }] }
];
fs.writeFileSync(SEED, JSON.stringify(seed));

app.whenReady().then(async () => {
  // 注册与 backend/main.js 一致的 IPC，读写 SEED
  ipcMain.handle('records:load', () => JSON.parse(fs.readFileSync(SEED, 'utf-8')));
  ipcMain.handle('records:save', (_, rec) => { const r = JSON.parse(fs.readFileSync(SEED, 'utf-8')); r.push(rec); fs.writeFileSync(SEED, JSON.stringify(r)); return r; });
  ipcMain.handle('records:delete', (_, id) => { const r = JSON.parse(fs.readFileSync(SEED, 'utf-8')).filter(x => x.id !== id); fs.writeFileSync(SEED, JSON.stringify(r)); return r; });
  ipcMain.handle('records:clear', () => { fs.writeFileSync(SEED, '[]'); return []; });

  const win = new BrowserWindow({ width: 1100, height: 750, show: false,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false,
      preload: path.join(__dirname, '..', 'backend', 'preload.js')
    } });
  const errors = [];
  win.webContents.on('console-message', (e, level, m) => { if (level >= 2) errors.push(m); });
  await win.loadFile(FRONTEND);
  await new Promise(r => setTimeout(r, 1000));

  await win.webContents.executeJavaScript(`localStorage.removeItem('typing_dismissed_weak')`);

  await win.webContents.executeJavaScript(`window.app.Router.switch('weak-point')`);
  await new Promise(r => setTimeout(r, 800));

  const report = await win.webContents.executeJavaScript(`(() => {
    const rows = [...document.querySelectorAll('.wp-rank-item')];
    const chars = rows.map(r => r.querySelector('.wp-rank-char').textContent);
    const examples = rows.map(r => (r.querySelector('.wp-rank-examples')?.textContent || '').trim());
    const spaceIncluded = chars.includes(' ');
    const delBtnCount = document.querySelectorAll('.wp-del').length;
    const hasRestore = !!document.getElementById('wp-restore');
    return { chars, examples, spaceIncluded, delBtnCount, hasRestore, html: document.getElementById('weak-point').innerHTML.slice(0, 200) };
  })()`);
  console.log('RANKING:', JSON.stringify(report));

  // 删除 't' 弱项
  const afterDel = await win.webContents.executeJavaScript(`(() => {
    const delBtn = [...document.querySelectorAll('.wp-del')].find(b => b.dataset.char === 't');
    if (!delBtn) return 'NO-DEL-T';
    delBtn.click();
    return new Promise(res => setTimeout(() => {
      const rows = [...document.querySelectorAll('.wp-rank-item')];
      const chars = rows.map(r => r.querySelector('.wp-rank-char').textContent);
      res({ chars, hasRestore: !!document.getElementById('wp-restore') });
    }, 200));
  })()`);
  console.log('AFTER DELETE t:', JSON.stringify(afterDel));

  // 恢复全部
  const afterRestore = await win.webContents.executeJavaScript(`(() => {
    const btn = document.getElementById('wp-restore');
    if (!btn) return 'NO-RESTORE';
    btn.click();
    return new Promise(res => setTimeout(() => {
      const rows = [...document.querySelectorAll('.wp-rank-item')];
      const chars = rows.map(r => r.querySelector('.wp-rank-char').textContent);
      res({ chars, hasRestore: !!document.getElementById('wp-restore') });
    }, 200));
  })()`);
  console.log('AFTER RESTORE:', JSON.stringify(afterRestore));

  console.log('errors:', errors.length ? errors.join('\n') : '(none)');
  app.exit(0);
}).catch(e => { console.error('SMOKE FAIL', e); app.exit(1); });
