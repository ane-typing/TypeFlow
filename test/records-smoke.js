// 冒烟测试：成绩记录空态
// 验证：只要有 1 条成绩，「还没有成绩」全局空态就不显示；筛选到无记录的分类应有提示
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const FRONTEND = path.join(__dirname, '..', 'frontend', 'index.html');
const SEED = path.join(os.tmpdir(), 'dsh-typing-rec-seed', 'records.json');
fs.mkdirSync(path.dirname(SEED), { recursive: true });

const records = [{ id: 'r1', type: 'speed', title: 'A Day', cpm: 120, wpm: 24, accuracy: 95, time: 20, date: '2026-08-26 12:00' }];
fs.writeFileSync(SEED, JSON.stringify(records));

app.whenReady().then(async () => {
  ipcMain.handle('records:load', () => JSON.parse(fs.readFileSync(SEED, 'utf-8')));
  ipcMain.handle('records:save', (_, rec) => { const r = JSON.parse(fs.readFileSync(SEED, 'utf-8')); r.push(rec); fs.writeFileSync(SEED, JSON.stringify(r)); return r; });
  ipcMain.handle('records:delete', (_, id) => { const r = JSON.parse(fs.readFileSync(SEED, 'utf-8')).filter(x => x.id !== id); fs.writeFileSync(SEED, JSON.stringify(r)); return r; });
  ipcMain.handle('records:clear', () => { fs.writeFileSync(SEED, '[]'); return []; });

  const win = new BrowserWindow({ width: 1100, height: 750, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, '..', 'backend', 'preload.js') } });
  const errors = [];
  win.webContents.on('console-message', (e, level, m) => { if (level >= 2) errors.push(m); });
  await win.loadFile(FRONTEND);
  await new Promise(r => setTimeout(r, 1000));

  await win.webContents.executeJavaScript(`window.app.Router.switch('records')`);
  await new Promise(r => setTimeout(r, 600));

  const globalEmptyVisible = await win.webContents.executeJavaScript(
    `(() => { const el = document.getElementById('rec-empty'); return !!el && !el.hidden; })()`);
  const rowCount = await win.webContents.executeJavaScript(
    `document.querySelectorAll('#rec-tbody tr.rec-row, #rec-tbody tr').length`);
  const tableHidden = await win.webContents.executeJavaScript(`document.getElementById('rec-table').hidden`);

  // 筛选到「拼音练习」（无记录）
  const pinyinResult = await win.webContents.executeJavaScript(`(() => {
    const btn = [...document.querySelectorAll('.filter-btn')].find(b => b.dataset.filter === 'pinyin');
    btn.click();
    return new Promise(res => setTimeout(() => {
      const tbodyRows = document.querySelectorAll('#rec-tbody tr').length;
      const tableH = document.getElementById('rec-table').hidden;
      const globalEmptyH = document.getElementById('rec-empty').hidden;
      res({ tbodyRows, tableH, globalEmptyH, hasFilterEmpty: !!document.getElementById('rec-filter-empty') });
    }, 200));
  })()`);

  console.log('GLOBAL (1 record):', JSON.stringify({ globalEmptyVisible, rowCount, tableHidden }));
  console.log('FILTER pinyin:', JSON.stringify(pinyinResult));
  console.log('errors:', errors.length ? errors.join('\n') : '(none)');
  app.exit(0);
}).catch(e => { console.error('SMOKE FAIL', e); app.exit(1); });
