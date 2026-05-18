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
