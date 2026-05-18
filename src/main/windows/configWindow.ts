import { BrowserWindow } from 'electron';
import { join } from 'node:path';
import { isQuittingFully } from '../appState';

let win: BrowserWindow | null = null;

export function getConfigWindow(): BrowserWindow | null {
  return win;
}

export function ensureConfigWindow(focusPage?: string): BrowserWindow {
  if (win && !win.isDestroyed()) {
    if (focusPage) win.webContents.send('navigate', focusPage);
    win.show();
    win.focus();
    return win;
  }

  win = new BrowserWindow({
    width: 720,
    height: 760,
    minWidth: 640,
    minHeight: 640,
    title: 'Clever Print',
    show: false,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => {
    win?.show();
    if (focusPage) win?.webContents.send('navigate', focusPage);
  });

  win.on('close', (e) => {
    // Hide instead of quit; the app lives in the tray.
    if (!isQuittingFully()) {
      e.preventDefault();
      win?.hide();
    }
  });

  win.on('closed', () => {
    win = null;
  });

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

