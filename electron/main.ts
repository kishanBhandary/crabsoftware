import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

let nextProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

// Listen for external URL open requests from renderer/preload
ipcMain.on('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
  } catch (err) {
    console.error('Failed to open external URL:', err);
  }
});

function startNextServer() {
  const isDev = !app.isPackaged;
  // Use tsx or direct next command depending on environment
  const args = isDev 
    ? ['next', 'dev', '-p', '3000'] 
    : ['next', 'start', '-p', '3000'];

  console.log(`[Electron] Starting Next.js server in ${isDev ? 'development' : 'production'} mode...`);

  // We pass the app's userData path to the Next.js server so it knows where to store the database
  const userDataPath = app.getPath('userData');
  console.log(`[Electron] User Data Path for SQLite database: ${userDataPath}`);

  nextProcess = spawn('npx', args, {
    cwd: path.join(__dirname, '..'), // Run from project root
    shell: true,
    env: { 
      ...process.env, 
      PORT: '3000', 
      NODE_ENV: isDev ? 'development' : 'production',
      USER_DATA_PATH: userDataPath
    }
  });

  nextProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  nextProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js Error] ${data.toString().trim()}`);
  });
}

function checkServerReady(callback: () => void) {
  const req = http.request({ host: '127.0.0.1', port: 3000, timeout: 500 }, (res) => {
    if (res.statusCode === 200 || res.statusCode === 308 || res.statusCode === 404) {
      console.log('[Electron] Next.js server is ready.');
      callback();
    } else {
      setTimeout(() => checkServerReady(callback), 200);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkServerReady(callback), 200);
  });
  req.end();
}

function createWindow() {
  mainWindow = new BrowserWindow({
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
      spawn('taskkill', ['/pid', String(nextProcess.pid), '/f', '/t']);
    } else {
      nextProcess.kill('SIGINT');
    }
    nextProcess = null;
  }
}

app.on('ready', () => {
  startNextServer();
  checkServerReady(() => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  cleanup();
});
