import { ipcMain, shell, app } from 'electron';
import { IPC } from '@shared/ipc-channels';
import { getConfig, updateConfig, removePairing, getConfigPath } from './config/store';
import { listPrinters } from './printing/windowsPrinters';
import { testPrint } from './printing/queue';
import { logger } from './logger';
import { checkForUpdatesManually } from './autoUpdate';
import { approvePending, rejectPending, listPending } from './pairing/code';
import type { ConfigShape } from './config/schema';

export function registerIpc(): void {
  ipcMain.handle(IPC.CONFIG_GET, async () => getConfig());
  ipcMain.handle(IPC.CONFIG_SET, async (_evt, patch: Partial<ConfigShape>) => updateConfig(patch));
  ipcMain.handle(IPC.PRINTERS_LIST, async () => listPrinters());

  ipcMain.handle(IPC.PRINT_TEST, async () => testPrint());

  ipcMain.handle(IPC.AGENT_STATUS, async () => ({
    version: app.getVersion(),
    configPath: getConfigPath(),
  }));

  ipcMain.handle(IPC.PAIR_APPROVE, async (_evt, pairingId: string) => approvePending(pairingId));
  ipcMain.handle(IPC.PAIR_REJECT, async (_evt, pairingId: string) => rejectPending(pairingId));
  ipcMain.handle(IPC.PAIR_PENDING, async () => listPending());

  ipcMain.handle('pair:remove', async (_evt, origin: string) => removePairing(origin));

  ipcMain.handle(IPC.OPEN_LOGS_FOLDER, async () => {
    try {
      const folder = app.getPath('logs');
      await shell.openPath(folder);
    } catch (err) {
      logger.error('open logs failed', err);
    }
  });

  ipcMain.handle(IPC.CHECK_UPDATES, async () => checkForUpdatesManually());
}
