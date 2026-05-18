import Store from 'electron-store';
import { ConfigSchema, type ConfigShape } from './schema';
import { logger } from '../logger';

// electron-store JSON schema is independent of zod; we validate at load time.
const defaults: ConfigShape = ConfigSchema.parse({});

const store = new Store<ConfigShape>({
  name: 'config',
  defaults,
  clearInvalidConfig: true,
});

// Validate once on startup; surface any corruption.
try {
  ConfigSchema.parse(store.store);
} catch (err) {
  logger.warn('Config failed validation, resetting to defaults', err);
  store.clear();
  store.set(defaults);
}

export function getConfig(): ConfigShape {
  return store.store;
}

export function updateConfig(patch: Partial<ConfigShape>): ConfigShape {
  const next = ConfigSchema.parse({ ...store.store, ...patch });
  store.set(next);
  return next;
}

export function addPairing(p: ConfigShape['pairings'][number]): ConfigShape {
  const current = store.get('pairings');
  const filtered = current.filter((x) => x.origin !== p.origin);
  return updateConfig({ pairings: [...filtered, p] });
}

export function removePairing(origin: string): ConfigShape {
  return updateConfig({
    pairings: store.get('pairings').filter((p) => p.origin !== origin),
  });
}

export function isPaired(): boolean {
  return store.get('pairings').length > 0;
}

export function getAllowedOrigins(): string[] {
  return store.get('pairings').map((p) => p.origin);
}

export function findPairingByToken(token: string): ConfigShape['pairings'][number] | null {
  return store.get('pairings').find((p) => p.token === token) ?? null;
}

export function getConfigPath(): string {
  return store.path;
}
