"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const http = __importStar(require("http"));
let nextProcess = null;
let mainWindow = null;
// Listen for external URL open requests from renderer/preload
electron_1.ipcMain.on('open-external', async (event, url) => {
    try {
        await electron_1.shell.openExternal(url);
    }
    catch (err) {
        console.error('Failed to open external URL:', err);
    }
});
function startNextServer() {
    const isDev = !electron_1.app.isPackaged;
    const userDataPath = electron_1.app.getPath('userData');
    console.log(`[Electron] User Data Path for SQLite database: ${userDataPath}`);
    if (isDev) {
        console.log(`[Electron] Starting Next.js server in development mode...`);
        nextProcess = (0, child_process_1.spawn)('npx', ['next', 'dev', '-p', '3000'], {
            cwd: path.join(__dirname, '..'),
            shell: true,
            env: {
                ...process.env,
                PORT: '3000',
                NODE_ENV: 'development',
                USER_DATA_PATH: userDataPath
            }
        });
    }
    else {
        console.log(`[Electron] Starting Next.js server in production mode...`);
        // In production, run the packaged Next.js server using Electron's Node runtime
        const nextCliPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
        nextProcess = (0, child_process_1.spawn)(process.execPath, [nextCliPath, 'start', '-p', '3000'], {
            cwd: path.join(__dirname, '..'),
            shell: false, // Don't open terminal window on Windows
            env: {
                ...process.env,
                PORT: '3000',
                NODE_ENV: 'production',
                ELECTRON_RUN_AS_NODE: '1',
                USER_DATA_PATH: userDataPath
            }
        });
    }
    nextProcess.on('error', (err) => {
        console.error('[Electron] Failed to start Next.js server process:', err);
    });
    nextProcess.stdout?.on('data', (data) => {
        console.log(`[Next.js] ${data.toString().trim()}`);
    });
    nextProcess.stderr?.on('data', (data) => {
        console.error(`[Next.js Error] ${data.toString().trim()}`);
    });
}
function checkServerReady(callback) {
    const req = http.request({ host: '127.0.0.1', port: 3000, timeout: 500 }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 308 || res.statusCode === 404) {
            console.log('[Electron] Next.js server is ready.');
            callback();
        }
        else {
            setTimeout(() => checkServerReady(callback), 200);
        }
    });
    req.on('error', () => {
        setTimeout(() => checkServerReady(callback), 200);
    });
    req.end();
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1600,
        height: 950,
        minWidth: 1200,
        minHeight: 800,
        title: "CrabShack Water Quality Pro",
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Load the local Next.js server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Ensure the Next.js process is terminated when Electron exits
function cleanup() {
    if (nextProcess) {
        console.log('[Electron] Shutting down Next.js server...');
        if (process.platform === 'win32') {
            (0, child_process_1.spawn)('taskkill', ['/pid', String(nextProcess.pid), '/f', '/t']);
        }
        else {
            nextProcess.kill('SIGINT');
        }
        nextProcess = null;
    }
}
electron_1.app.on('ready', () => {
    startNextServer();
    checkServerReady(() => {
        createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    cleanup();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.app.on('will-quit', () => {
    cleanup();
});
