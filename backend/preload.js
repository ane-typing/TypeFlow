// 预加载脚本：通过 contextBridge 安全地向渲染进程暴露数据接口
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 读取全部成绩记录
  loadRecords: () => ipcRenderer.invoke('records:load'),
  // 追加一条成绩记录
  saveRecord: (record) => ipcRenderer.invoke('records:save', record),
  // 按 id 删除一条成绩记录
  deleteRecord: (id) => ipcRenderer.invoke('records:delete', id),
  // 清空全部成绩记录
  clearRecords: () => ipcRenderer.invoke('records:clear')
});