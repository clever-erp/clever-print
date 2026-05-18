import { Tray, Menu, nativeImage, app, type NativeImage } from 'electron';
import { join } from 'node:path';
import { ensureConfigWindow } from './windows/configWindow';
import { setAutostart, isAutostartEnabled } from './autostart';
import { checkForUpdatesManually } from './autoUpdate';
import { logger } from './logger';
import { setQuittingFully } from './appState';

let tray: Tray | null = null;
let currentStatus: TrayStatus = 'unconfigured';

export type TrayStatus = 'idle' | 'busy' | 'error' | 'unconfigured';

function iconPath(status: TrayStatus): string {
  // Resolved relative to the built main bundle (out/main/). Resources copied via electron-builder extraResources.
  const file =
    status === 'error' ? 'tray-error.png' :
    status === 'busy' ? 'tray-busy.png' :
    status === 'unconfigured' ? 'tray-idle.png' :
    'tray-idle.png';
  return join(process.resourcesPath ?? join(__dirname, '../../resources'), file);
}

function loadIcon(status: TrayStatus): NativeImage {
  const img = nativeImage.createFromPath(iconPath(status));
  if (img.isEmpty()) {
    // Fallback empty icon — better than crashing in dev when resources aren't bundled yet.
    return nativeImage.createEmpty();
  }
  return img;
}

export function buildTray(onTestPrint: () => void, onUnpairAll: () => void): Tray {
  if (tray && !tray.isDestroyed()) return tray;
  tray = new Tray(loadIcon(currentStatus));
  tray.setToolTip('Clever Print');
  tray.on('click', () => ensureConfigWindow());
  rebuildMenu(onTestPrint, onUnpairAll);
  return tray;
}

export function setTrayStatus(status: TrayStatus): void {
  currentStatus = status;
  if (tray && !tray.isDestroyed()) {
    tray.setImage(loadIcon(status));
    tray.setToolTip(`Clever Print — ${status}`);
  }
}

export function rebuildMenu(onTestPrint: () => void, onUnpairAll: () => void): void {
  if (!tray || tray.isDestroyed()) return;
  const autostartEnabled = isAutostartEnabled();
  const menu = Menu.buildFromTemplate([
    { label: `Clever Print ${app.getVersion()}`, enabled: false },
    { label: `Estado: ${labelFor(currentStatus)}`, enabled: false },
    { type: 'separator' },
    { label: 'Abrir configuración…', click: () => ensureConfigWindow('status') },
    { label: 'Imprimir prueba', click: () => onTestPrint() },
    { type: 'separator' },
    { label: 'Re-emparejar navegador', click: () => ensureConfigWindow('pairing') },
    { label: 'Olvidar todos los emparejamientos…', click: () => onUnpairAll() },
    { type: 'separator' },
    { label: 'Buscar actualizaciones…', click: () => void checkForUpdatesManually().catch((err) => logger.error(err)) },
    {
      label: 'Iniciar con Windows',
      type: 'checkbox',
      checked: autostartEnabled,
      click: (item) => setAutostart(item.checked),
    },
    { type: 'separator' },
    { label: 'Salir', click: () => { setQuittingFully(); app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function labelFor(s: TrayStatus): string {
  switch (s) {
    case 'idle': return 'Impresora en línea';
    case 'busy': return 'Imprimiendo…';
    case 'error': return 'Error en la impresora';
    case 'unconfigured': return 'Sin configurar';
  }
}
