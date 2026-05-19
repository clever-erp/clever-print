import { useEffect, useState } from 'react';

export function AboutPage() {
  const [info, setInfo] = useState<{ version: string; configPath: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    window.cleverPrint.agentStatus().then(setInfo);
  }, []);

  async function check() {
    setChecking(true);
    setMsg(null);
    try {
      const r = (await window.cleverPrint.checkUpdates()) as {
        available: boolean;
        currentVersion: string;
        latestVersion: string | null;
        isDev: boolean;
      };
      if (r.isDev) {
        setMsg('En modo desarrollo no se buscan actualizaciones.');
      } else if (r.available && r.latestVersion) {
        setMsg(
          `Nueva versión ${r.latestVersion} disponible. Se descargará en segundo plano y se instalará al cerrar Clever Print.`,
        );
      } else if (r.latestVersion) {
        setMsg(`Ya estás en la última versión (${r.latestVersion}).`);
      } else {
        setMsg('No se pudo comprobar (revisa los registros).');
      }
    } catch (err) {
      setMsg(`Error: ${(err as Error).message}`);
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <h1>Acerca de</h1>
      <div className="card">
        <p>Clever Print — agente local de impresión para Clever ERP.</p>
        {info && (
          <>
            <p className="small muted">Versión {info.version}</p>
            <p className="small muted">Config: {info.configPath}</p>
          </>
        )}
        <div className="actions">
          <button className="primary" disabled={checking} onClick={check}>
            {checking ? 'Comprobando…' : 'Buscar actualizaciones'}
          </button>
        </div>
        {msg && <p className="small muted" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </>
  );
}
