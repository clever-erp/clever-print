import { useEffect, useState } from 'react';
import { StatusPage } from './pages/StatusPage';
import { PrinterPage } from './pages/PrinterPage';
import { PairingPage } from './pages/PairingPage';
import { AdvancedPage } from './pages/AdvancedPage';
import { AboutPage } from './pages/AboutPage';

type PageId = 'status' | 'printer' | 'pairing' | 'advanced' | 'about';

const PAGES: { id: PageId; label: string }[] = [
  { id: 'status', label: 'Estado' },
  { id: 'printer', label: 'Impresora' },
  { id: 'pairing', label: 'Emparejamiento' },
  { id: 'advanced', label: 'Avanzado' },
  { id: 'about', label: 'Acerca de' },
];

export function App() {
  const [page, setPage] = useState<PageId>('status');

  useEffect(() => {
    return window.cleverPrint.onNavigate((p) => {
      if (PAGES.some((x) => x.id === p)) setPage(p as PageId);
    });
  }, []);

  return (
    <div className="app">
      <aside>
        <div className="brand">Clever Print</div>
        <nav>
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={page === p.id ? 'active' : ''}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        {page === 'status' && <StatusPage />}
        {page === 'printer' && <PrinterPage />}
        {page === 'pairing' && <PairingPage />}
        {page === 'advanced' && <AdvancedPage />}
        {page === 'about' && <AboutPage />}
      </main>
    </div>
  );
}
