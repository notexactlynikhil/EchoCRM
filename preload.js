const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer thread safely
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
