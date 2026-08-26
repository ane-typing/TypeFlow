// Electron 主进程：创建窗口、IPC 数据持久化、启动管理
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ---------- 数据持久化 ----------
// 数据统一存到 Electron 用户数据目录（%APPDATA%/<appName>/records.json），
// 开发模式与打包模式共用，避免打包后写入 asar 只读区导致成绩丢失。

// 确保数据文件存在；首次运行把旧的开发目录数据（data/records.json）迁移过来
function getDataPath() {
  const target = path.join(app.getPath('userData'), 'records.json');
  if (!fs.existsSync(target)) {
    const legacy = path.join(app.getAppPath(), 'data', 'records.json');
    if (fs.existsSync(legacy)) {
      fs.copyFileSync(legacy, target); // 迁移旧成绩
    } else {
      fs.writeFileSync(target, '[]', 'utf-8');
    }
  }
  return target;
}

// 读取全部成绩记录
function loadRecords() {
  const dataPath = getDataPath();
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// 追加一条成绩记录
function saveRecord(record) {
  const records = loadRecords();
  records.push(record);
  fs.writeFileSync(getDataPath(), JSON.stringify(records, null, 2), 'utf-8');
  return records;
}

// 按 id 删除一条成绩记录
function deleteRecord(id) {
  const records = loadRecords().filter((r) => r.id !== id);
  fs.writeFileSync(getDataPath(), JSON.stringify(records, null, 2), 'utf-8');
  return records;
}

// 清空全部成绩记录
function clearRecords() {
  fs.writeFileSync(getDataPath(), '[]', 'utf-8');
  return [];
}

// ---------- 创建窗口 ----------

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 640,
    title: '打字练习软件',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // 安全：渲染进程与主进程隔离
      nodeIntegration: false  // 安全：渲染进程禁用 Node
    }
  });
  win.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));
}

// ---------- 生命周期 ----------

app.whenReady().then(() => {
  // 注册 IPC 接口，供渲染进程通过 window.api 调用
  ipcMain.handle('records:load', () => loadRecords());
  ipcMain.handle('records:save', (_, record) => saveRecord(record));
  ipcMain.handle('records:delete', (_, id) => deleteRecord(id));
  ipcMain.handle('records:clear', () => clearRecords());

  createWindow();

  // macOS 点击 Dock 图标时若无窗口则重建
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除 macOS 外，关闭全部窗口即退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});