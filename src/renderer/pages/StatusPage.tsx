import { useEffect, useState } from 'react';
import type { ConfigShape } from '@shared/types';

export function StatusPage() {
  const [cfg, setCfg] = useState<ConfigShape | null>(null);
  const [agent, setAgent] = useState<{ version: string; configPath: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    window.cleverPrint.getConfig().then(setCfg);
    window.cleverPrint.agentStatus().then(setAgent);
  }, []);

  const pairedCount = cfg?.pairings.length ?? 0;
  const configured = !!cfg?.printer;

  return (
    <>
      <h1>Estado</h1>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Impresora</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {cfg?.printer
                ? `${cfg.printer.identifier} · ${cfg.printer.paperWidthMm}mm · ${cfg.printer.profile}`
                : 'Sin configurar'}
            </p>
          </div>
          <span className={`pill ${configured ? 'online' : 'unconf'}`}>
            {configured ? 'Configurada' : 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Emparejamiento</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {pairedCount === 0
                ? 'Ningún navegador emparejado'
                : `${pairedCount} navegador(es) emparejado(s)`}
            </p>
          </div>
          <span className={`pill ${pairedCount > 0 ? 'online' : 'unconf'}`}>
            {pairedCount > 0 ? 'Listo' : 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Servidor local</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              http://127.0.0.1:{cfg?.httpPort ?? 17777}
            </p>
          </div>
          <span className="pill online">En línea</span>
        </div>
      </div>

      <div className="actions">
        <button
          className="primary"
          disabled={testing || !configured}
          onClick={async () => {
            setTesting(true);
            setResult(null);
            try {
              const r = await window.cleverPrint.testPrint();
              setResult(r.status === 'printed' ? 'Impresión enviada' : `Error: ${r.error ?? 'desconocido'}`);
            } finally {
              setTesting(false);
            }
          }}
        >
          {testing ? 'Imprimiendo…' : 'Imprimir prueba'}
        </button>
        <button className="secondary" onClick={() => window.cleverPrint.openLogsFolder()}>
          Abrir registros
        </button>
      </div>
      {result && <p className="small muted" style={{ marginTop: 12 }}>{result}</p>}
      {agent && <p className="small muted" style={{ marginTop: 16 }}>Versión {agent.version}</p>}
    </>
  );
}
