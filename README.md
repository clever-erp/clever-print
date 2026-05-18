# Clever Print

Local print agent for Clever ERP. Runs as a Windows tray app and prints
ESC/POS receipts to a thermal printer over USB or network.

## Install (end user)

Download the latest `clever-print-Setup-x.y.z.exe` from
[Releases](https://github.com/clever-erp/clever-print/releases) and run it.
The installer is per-user (no admin prompt). After install:

1. The tray icon appears.
2. Open the Clever Print config window from the tray, select your printer
   on the **Impresora** tab, and click **Imprimir prueba**.
3. In Clever ERP (the browser), go to **Configuración → Impresión** and click
   **Emparejar este navegador**. Read the 6-digit code from the tray window
   and enter it in the browser.
4. Done. **Imprimir** in Pedidos now prints silently.

## Develop

```bash
pnpm install
pnpm dev
```

## Build installer

```bash
pnpm dist:win
```

Output: `dist/clever-print-Setup-x.y.z.exe`.
