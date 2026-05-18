import log from 'electron-log/main';

log.initialize({ preload: true });
log.transports.file.fileName = 'main.log';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.console.level = 'debug';
log.transports.file.level = 'info';

export const logger = log;
