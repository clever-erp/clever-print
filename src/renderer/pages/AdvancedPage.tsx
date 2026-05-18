import { useEffect, useState } from 'react';
import type { ConfigShape } from '@shared/types';

export function AdvancedPage() {
  const [cfg, setCfg] = useState<ConfigShape | null>(null);
  const [port, setPort] = useState(17777);
  const [autostart, setAutostart] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    window.cleverPrint.getConfig().then((c) => {
      setCfg(c);
      setPort(c.httpPort);
      setAutostart(c.autostart);
    });
  }, []);

  async function save() {
    const next = await window.cleverPrint.setConfig({ httpPort: port, autostart });
    setCfg(next);
    setMsg('Guardado. Reinicia Clever Print para aplicar el puerto.');
  }

  return (
    <>
      <h1>Avanzado</h1>
      <div className="card">
        <label>Puerto HTTP (loopback)</label>
        <input type="number" min={1024} max={65535} value={port} onChange={(e) => setPort(Number(e.target.value))} />
        <p className="small muted" style={{ marginTop: 4 }}>
          El agente escucha en http://127.0.0.1:{port}. Cambiarlo requiere reiniciar.
        </p>

        <label style={{ marginTop: 16 }}>
          <input type="checkbox" checked={autostart} onChange={(e) => setAutostart(e.target.checked)} style={{ width: 'auto', marginRight: 8 }} />
          Iniciar con Windows
        </label>

        <div className="actions">
          <button className="primary" onClick={save}>Guardar</button>
          <button className="secondary" onClick={() => window.cleverPrint.openLogsFolder()}>
            Abrir carpeta de registros
          </button>
        </div>
        {msg && <p className="small muted" style={{ marginTop: 12 }}>{msg}</p>}
        {cfg && <p className="small muted" style={{ marginTop: 12 }}>Nivel de log: {cfg.logLevel}</p>}
      </div>
    </>
  );
}
