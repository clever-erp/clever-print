export const IPC = {
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  PRINTERS_LIST: 'printers:list',
  PRINT_TEST: 'print:test',
  AGENT_STATUS: 'agent:status',
  AGENT_STATUS_CHANGED: 'agent:status:changed',
  PAIR_APPROVE: 'pair:approve',
  PAIR_REJECT: 'pair:reject',
  PAIR_PENDING: 'pair:pending',
  OPEN_LOGS_FOLDER: 'system:open-logs',
  CHECK_UPDATES: 'system:check-updates',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
