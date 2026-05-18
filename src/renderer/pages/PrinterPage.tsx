import { useEffect, useState } from 'react';
import type { ConfigShape, ConnectionType, PaperWidthMm, PrinterProfile, CodePage } from '@shared/types';

interface DiscoveredPrinter {
  id: string;
  name: string;
  transport: string;
  default?: boolean;
}

export function PrinterPage() {
  const [cfg, setCfg] = useState<ConfigShape | null>(null);
  const [printers, setPrinters] = useState<DiscoveredPrinter[]>([]);
  const [connectionType, setConnectionType] = useState<ConnectionType>('windows');
  const [identifier, setIdentifier] = useState('');
  const [paperWidthMm, setPaperWidthMm] = useState<PaperWidthMm>(80);
  const [profile, setProfile] = useState<PrinterProfile>('EPSON');
  const [codePage, setCodePage] = useState<CodePage>('PC850');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    window.cleverPrint.getConfig().then((c) => {
      setCfg(c);
      if (c.printer) {
        setConnectionType(c.printer.connectionType);
        setIdentifier(c.printer.identifier);
        setPaperWidthMm(c.printer.paperWidthMm);
        setProfile(c.printer.profile);
        setCodePage(c.printer.codePage);
      }
    });
    refreshPrinters();
  }, []);

  function refreshPrinters() {
    window.cleverPrint.listPrinters().then(setPrinters);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const next = await window.cleverPrint.setConfig({
        printer: {
          connectionType,
          identifier: identifier.trim(),
          paperWidthMm,
          profile,
          codePage,
          cutPaper: cfg?.printer?.cutPaper ?? true,
          openCashDrawer: cfg?.printer?.openCashDrawer ?? false,
        },
      });
      setCfg(next);
      setMsg('Configuración guardada');
    } catch (err) {
      setMsg(`Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setMsg(null);
    try {
      const r = await window.cleverPrint.testPrint();
      setMsg(r.status === 'printed' ? 'Impresión de prueba enviada' : `Error: ${r.error ?? 'desconocido'}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <h1>Impresora</h1>
      <div className="card">
        <label>Tipo de conexión</label>
        <select value={connectionType} onChange={(e) => setConnectionType(e.target.value as ConnectionType)}>
          <option value="windows">Windows (impresora instalada)</option>
          <option value="network">Red (TCP/IP)</option>
          <option value="usb">USB directo</option>
          <option value="serial">Serial (COM)</option>
        </select>

        {connectionType === 'windows' && (
          <>
            <label style={{ marginTop: 12 }}>Impresora de Windows</label>
            <div className="row">
              <select
                style={{ flex: 1 }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              >
                <option value="">— Selecciona —</option>
                {printers.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}{p.default ? ' (predeterminada)' : ''}</option>
                ))}
              </select>
              <button className="secondary" onClick={refreshPrinters}>Recargar</button>
            </div>
          </>
        )}

        {connectionType === 'network' && (
          <>
            <label style={{ marginTop: 12 }}>Host:puerto (ej. 192.168.1.50:9100)</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="192.168.1.50:9100" />
          </>
        )}

        {connectionType === 'usb' && (
          <>
            <label style={{ marginTop: 12 }}>USB (vacío = autodetección)</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="usb" />
          </>
        )}

        {connectionType === 'serial' && (
          <>
            <label style={{ marginTop: 12 }}>Puerto serie</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="COM3" />
          </>
        )}

        <label style={{ marginTop: 12 }}>Ancho de papel</label>
        <select value={paperWidthMm} onChange={(e) => setPaperWidthMm(Number(e.target.value) as PaperWidthMm)}>
          <option value={80}>80 mm</option>
          <option value={58}>58 mm</option>
        </select>

        <label style={{ marginTop: 12 }}>Perfil ESC/POS</label>
        <select value={profile} onChange={(e) => setProfile(e.target.value as PrinterProfile)}>
          <option value="EPSON">EPSON (SAT, XPrinter, Bixolon, Citizen, Epson TM)</option>
          <option value="STAR">STAR</option>
        </select>

        <label style={{ marginTop: 12 }}>Página de códigos</label>
        <select value={codePage} onChange={(e) => setCodePage(e.target.value as CodePage)}>
          <option value="PC850">PC850 (recomendado para español)</option>
          <option value="PC437">PC437 (EE. UU.)</option>
          <option value="WPC1252">Windows 1252</option>
        </select>

        <div className="actions">
          <button className="primary" disabled={saving || !identifier.trim()} onClick={save}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button className="secondary" disabled={testing || !cfg?.printer} onClick={test}>
            {testing ? 'Imprimiendo…' : 'Imprimir prueba'}
          </button>
        </div>
        {msg && <p className="small muted" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </>
  );
}
