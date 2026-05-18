# Resources

Place the following binary assets here before the first `pnpm dist`:

| File | Purpose | Size |
|---|---|---|
| `icon.ico` | Windows app + installer icon | 256×256 multi-res (16/32/48/64/128/256) |
| `icon.png` | macOS / Linux fallback | 512×512 PNG |
| `tray-idle.png` | Tray icon — idle / paired | 32×32 PNG (transparent) |
| `tray-busy.png` | Tray icon — printing | 32×32 PNG (transparent) |
| `tray-error.png` | Tray icon — error | 32×32 PNG (transparent) |
| `installer-header.bmp` | NSIS installer banner (optional) | 150×57 BMP |

In dev mode the tray will fall back to an empty icon if these are missing; the
app still works.
