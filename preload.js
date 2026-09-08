const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer thread safely
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('ai', {
  checkHealth: () => ipcRenderer.invoke('ai:checkHealth'),
  processCall: (audioPath) => ipcRenderer.invoke('ai:processCall', audioPath),
  processSampleCall: () => ipcRenderer.invoke('ai:processSampleCall'),
  query: (prompt, context, enableWebSearch) => ipcRenderer.invoke('ai:query', { prompt, context, enableWebSearch }),
});


