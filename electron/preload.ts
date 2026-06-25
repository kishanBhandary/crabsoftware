import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe native API to the renderer process (Next.js)
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  platform: process.platform,
  getAppVersion: () => '1.0.0',
});
