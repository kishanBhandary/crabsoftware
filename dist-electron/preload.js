"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose a safe native API to the renderer process (Next.js)
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => electron_1.shell.openExternal(url),
    platform: process.platform,
    getAppVersion: () => '1.0.0',
});
