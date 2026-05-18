import { app, BrowserWindow } from 'electron';
import { logger } from './logger';
import { buildTray, setTrayStatus } from './tray';
import { ensureConfigWindow } from './windows/configWindow';
import { registerIpc } from './ipc';
import { startHttpServer, stopHttpServer } from './server/httpServer';
import { startAutoUpdate } from './autoUpdate';
import { setAutostart } from './autostart';
import { getConfig, isPaired, updateConfig } from './config/store';
import { setupPairingApprovalHook } from './pairing/code';
import { testPrint } from './printing/queue';
import { setQuittingFully } from './appState';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  logger.warn('Another instance is already running — exiting.');
  app.quit();
} else {
  app.on('second-instance', () => ensureConfigWindow('status'));
}

app.whenReady().then(async () => {
  logger.info('clever-print starting', { version: app.getVersion(), pid: process.pid });

  const cfg = getConfig();
  setAutostart(cfg.autostart);

  registerIpc();
  buildTray(
    () => void testPrint().catch((err) => logger.error('test print failed', err)),
    () => { updateConfig({ pairings: [] }); },
  );

  setupPairingApprovalHook();

  setTrayStatus(cfg.printer ? 'idle' : 'unconfigured');
  void isPaired();

  try {
    await startHttpServer(cfg.httpPort);
  } catch (err) {
    logger.error('HTTP server failed to start', err);
    setTrayStatus('error');
  }

  // First run: open config window so the user can pick a printer.
  if (!cfg.printer && !process.argv.includes('--hidden')) {
    ensureConfigWindow('printer');
  }

  startAutoUpdate();
});

app.on('window-all-closed', () => {
  // Keep the agent alive in the tray. (Electron quits by default only on
  // non-darwin; since we host the agent in the tray we never want to quit
  // here. Returning without calling app.quit() is enough.)
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) ensureConfigWindow('status');
});

app.on('before-quit', async () => {
  setQuittingFully();
  await stopHttpServer().catch((err) => logger.error('HTTP shutdown error', err));
});
