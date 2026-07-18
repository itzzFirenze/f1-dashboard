const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Secure IPC methods can be defined here
  // The frontend can access them via window.electronAPI
});
