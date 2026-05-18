import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type { ConfigShape, Pending, DiscoveredPrinter, PrintResponse } from '../shared/types';

const api = {
  getConfig: (): Promise<ConfigShape> => ipcRenderer.invoke(IPC.CONFIG_GET),
  setConfig: (patch: Partial<ConfigShape>): Promise<ConfigShape> => ipcRenderer.invoke(IPC.CONFIG_SET, patch),
  listPrinters: (): Promise<DiscoveredPrinter[]> => ipcRenderer.invoke(IPC.PRINTERS_LIST),
  testPrint: (): Promise<PrintResponse> => ipcRenderer.invoke(IPC.PRINT_TEST),
  agentStatus: (): Promise<{ version: string; configPath: string }> => ipcRenderer.invoke(IPC.AGENT_STATUS),
  approvePairing: (id: string): Promise<Pending | null> => ipcRenderer.invoke(IPC.PAIR_APPROVE, id),
  rejectPairing: (id: string): Promise<Pending | null> => ipcRenderer.invoke(IPC.PAIR_REJECT, id),
  listPending: (): Promise<Pending[]> => ipcRenderer.invoke(IPC.PAIR_PENDING),
  removePairing: (origin: string): Promise<ConfigShape> => ipcRenderer.invoke('pair:remove', origin),
  openLogsFolder: (): Promise<void> => ipcRenderer.invoke(IPC.OPEN_LOGS_FOLDER),
  checkUpdates: (): Promise<unknown> => ipcRenderer.invoke(IPC.CHECK_UPDATES),
  onPendingChanged: (cb: (list: Pending[]) => void): (() => void) => {
    const fn = (_: unknown, list: Pending[]) => cb(list);
    ipcRenderer.on(IPC.PAIR_PENDING, fn);
    return () => { ipcRenderer.off(IPC.PAIR_PENDING, fn); };
  },
  onNavigate: (cb: (page: string) => void): (() => void) => {
    const fn = (_: unknown, page: string) => cb(page);
    ipcRenderer.on('navigate', fn);
    return () => { ipcRenderer.off('navigate', fn); };
  },
};

export type CleverPrintApi = typeof api;

contextBridge.exposeInMainWorld('cleverPrint', api);
