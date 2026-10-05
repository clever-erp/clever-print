# clever-print — Local thermal print agent

## Purpose
Desktop tray app installed on each restaurant's POS PC. Listens on
`http://127.0.0.1:17777` and prints ESC/POS receipts to a thermal printer
(USB, network, or Windows spooler). Replaces the browser print dialog so
clicking "Imprimir" in `clever-front` prints silently.

## Architecture
- Electron 31 main process — tray icon, lifecycle, autostart, auto-update.
- Hono HTTP server on loopback. Origin-allowlist CORS + pairing-token auth.
- `node-thermal-printer` for ESC/POS rendering (EPSON profile, PC850).
- electron-store persists config in `%APPDATA%\clever-print\config.json`.
- React renderer = config window (Status, Printer, Pairing, Advanced, About).

## Key commands
```
pnpm install
pnpm dev          # electron-vite dev (HMR for renderer)
pnpm build        # compile main + preload + renderer to out/
pnpm dist:win     # produces dist/clever-print-Setup-x.y.z.exe via NSIS
pnpm test         # vitest unit tests (escposRenderer, pairing)
```

## HTTP API contract
See `docs/api.md`. Routes: `/health` (public), `/pair`, `/pair/confirm`,
`/unpair`, `/printers`, `/status`, `/print`, `/test-print` (token required).

## Pairing
Frontend `POST /pair` → tray window pops up showing a 6-digit code → user
enters code in frontend → `POST /pair/confirm` returns a 32-byte token →
stored in browser `localStorage.cleverPrint.token` and persisted to
electron-store on agent side (origin added to CORS allowlist).

## Print job shape
Mirrors `Order` from `clever-front/src/types/index.ts`. See `src/shared/types.ts`.

## Release
`.github/workflows/release.yml` builds the Windows installer on `v*` tags (or a manual dispatch). It does **not** run on push to main. Releases are published at `clever-erp/clever-print/releases`, which is where the front's download link points.

## Receipt rules (merchant is under NRUS)
- The ticket (`src/main/printing/escposRenderer.ts`) is a non-fiscal **"RECIBO DE PEDIDO"**, not a SUNAT boleta. It intentionally has no RUC, serie/correlativo, NRUS legend or DNI field. A comment block marks where boleta fields could be added later.
- **No IGV line.** NRUS doesn't charge IGV.
- **No customer phone** on the ticket (Ley 29733: the courier handles the slip). Staff can see the phone in the dashboard.
- If asked to "make it a real boleta", first point out that this means SUNAT electronic issuance, with series and correlative-number authorization. It is not just a formatting change.

## Gotchas
- **Don't use `node-thermal-printer`'s `tableCustom`.** Its float cell widths overflow by 1–2 characters and wrap the last column. Use the local `formatItemRow(col1, col2, col3, width)` helper in `escposRenderer.ts`. `leftRight` is fine.
- **Native modules:** use the PowerShell P/Invoke driver `src/main/printing/windowsRawDriver.ts` for the Windows raw spooler. Don't bring back `@thiagoelg/node-printer`, which breaks on CI's node-gyp 11. A new native dependency must be maintained (a commit in the last 12 months) and must ship prebuilds for Node ≥22 and Electron ≥31. Otherwise, prefer shelling out from plain JS.
- On Windows dev machines with Python 3.12, if a node-gyp ≤9 rebuild fails with `No module named 'distutils'`, run `pip install setuptools`. Don't pin @electron/rebuild or override node-gyp.
