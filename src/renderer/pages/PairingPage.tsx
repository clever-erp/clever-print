import { useEffect, useState } from 'react';
import type { ConfigShape, Pending } from '@shared/types';

export function PairingPage() {
  const [cfg, setCfg] = useState<ConfigShape | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);

  useEffect(() => {
    window.cleverPrint.getConfig().then(setCfg);
    window.cleverPrint.listPending().then(setPending);
    const unsub = window.cleverPrint.onPendingChanged((list) => setPending(list));
    return unsub;
  }, []);

  const awaiting = pending.filter((p) => p.status === 'awaiting');

  async function approve(p: Pending) {
    await window.cleverPrint.approvePairing(p.id);
  }
  async function reject(p: Pending) {
    await window.cleverPrint.rejectPairing(p.id);
  }
  async function remove(origin: string) {
    const next = await window.cleverPrint.removePairing(origin);
    setCfg(next);
  }

  return (
    <>
      <h1>Emparejamiento</h1>

      {awaiting.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h2 style={{ marginTop: 0 }}>Solicitudes pendientes</h2>
          {awaiting.map((p) => (
            <div key={p.id} style={{ marginBottom: 16 }}>
              <p className="small muted" style={{ margin: 0 }}>{p.storeName || 'Sin nombre'}</p>
              <p className="small" style={{ margin: '2px 0 8px' }}>{p.origin}</p>
              <div className="code">{p.code.slice(0, 3)} {p.code.slice(3)}</div>
              <p className="small muted" style={{ marginTop: 8 }}>
                Permite que este navegador imprima en este punto de venta. El código se ingresa en el navegador.
              </p>
              <div className="actions">
                <button className="primary" onClick={() => approve(p)}>Permitir</button>
                <button className="secondary" onClick={() => reject(p)}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Navegadores emparejados</h2>
        {(!cfg || cfg.pairings.length === 0) && (
          <p className="small muted">Ninguno.</p>
        )}
        {cfg?.pairings.map((p) => (
          <div key={p.origin} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div>{p.label || p.origin}</div>
              <div className="small muted">{p.origin} · desde {new Date(p.pairedAt).toLocaleDateString()}</div>
            </div>
            <button className="danger" onClick={() => remove(p.origin)}>Quitar</button>
          </div>
        ))}
      </div>
    </>
  );
}
