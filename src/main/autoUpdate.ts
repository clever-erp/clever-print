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

export interface ManualCheckResult {
  available: boolean;
  currentVersion: string;
  latestVersion: string | null;
  isDev: boolean;
}

// Return only structured-cloneable fields. autoUpdater.checkForUpdates()'s
// raw result contains a CancellationToken class instance which can't pass
// through Electron's IPC serialization → "object could not be cloned".
export async function checkForUpdatesManually(): Promise<ManualCheckResult> {
  const currentVersion = app.getVersion();
  if (!app.isPackaged) {
    logger.info('Skipping manual update check in dev');
    return { available: false, currentVersion, latestVersion: null, isDev: true };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    const latestVersion = result?.updateInfo?.version ?? null;
    return {
      available: !!latestVersion && latestVersion !== currentVersion,
      currentVersion,
      latestVersion,
      isDev: false,
    };
  } catch (err) {
    logger.error('checkForUpdates failed', err);
    return { available: false, currentVersion, latestVersion: null, isDev: false };
  }
}
