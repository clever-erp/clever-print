import { app } from 'electron';
import pkg from 'electron-updater';
import { logger } from './logger';

const { autoUpdater } = pkg;

let started = false;

export function startAutoUpdate(): void {
  if (started || !app.isPackaged) return;
  started = true;

  autoUpdater.logger = logger;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => logger.error('autoUpdater error', err));
  autoUpdater.on('update-available', (info) => logger.info('Update available', info?.version));
  autoUpdater.on('update-downloaded', (info) => logger.info('Update downloaded', info?.version));

  autoUpdater.checkForUpdatesAndNotify().catch((err) => logger.error('Initial update check failed', err));
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => logger.error('Periodic update check failed', err));
  }, 6 * 60 * 60 * 1000);
}

export function checkForUpdatesManually(): Promise<unknown> {
  if (!app.isPackaged) {
    logger.info('Skipping manual update check in dev');
    return Promise.resolve(null);
  }
  return autoUpdater.checkForUpdates();
}
