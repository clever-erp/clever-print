import { app } from 'electron';
import { logger } from './logger';

export function setAutostart(enabled: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
      args: ['--hidden'],
    });
    logger.info('Autostart set to', enabled);
  } catch (err) {
    logger.error('Failed to set autostart', err);
  }
}

export function isAutostartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
