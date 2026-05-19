// Minimal Windows raw-spooler driver for node-thermal-printer.
// Replaces @thiagoelg/node-printer (native node-gyp module) with a pure
// PowerShell shell-out that calls winspool.drv directly. Why:
//   - no native compile → no node-gyp, no MSVC, no electron-rebuild
//   - smaller installer, faster customer install
//   - one less moving part in CI (the dependency historically fails to
//     build on fresh windows-latest runners because of C++20 template
//     lookup tightening)
// Trade-off: ~200ms PowerShell start-up per print — fine for POS.

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../logger';

interface PrintDirectArgs {
  data: Buffer | string;
  printer: string;
  type?: 'RAW' | 'TEXT' | string;
  options?: Record<string, unknown>;
  success?: (jobId: string) => void;
  error?: (err: Error) => void;
}

// Sends raw bytes to a Windows printer via winspool.drv OpenPrinter +
// StartDocPrinter("RAW") + WritePrinter. Reads bytes from $args[1]
// (a temp file we write per call).
const RAW_PRINT_PS = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CleverPrintRaw {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFO {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDatatype;
    }
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr pd);
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr h, int lvl, [In] DOCINFO di);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr h, IntPtr buf, int sz, out int written);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr h);
}
"@

$printerName = $args[0]
$dataPath = $args[1]
$bytes = [System.IO.File]::ReadAllBytes($dataPath)

$h = [IntPtr]::Zero
if (-not [CleverPrintRaw]::OpenPrinter($printerName, [ref] $h, [IntPtr]::Zero)) {
  throw "OpenPrinter failed for '$printerName' (err $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
}
try {
  $di = New-Object CleverPrintRaw+DOCINFO
  $di.pDocName  = 'Clever Print'
  $di.pDatatype = 'RAW'
  if (-not [CleverPrintRaw]::StartDocPrinter($h, 1, $di)) { throw "StartDocPrinter failed (err $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error()))" }
  try {
    if (-not [CleverPrintRaw]::StartPagePrinter($h)) { throw "StartPagePrinter failed" }
    $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
    try {
      [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
      $written = 0
      if (-not [CleverPrintRaw]::WritePrinter($h, $ptr, $bytes.Length, [ref] $written)) { throw "WritePrinter failed" }
    } finally {
      [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
    }
    [CleverPrintRaw]::EndPagePrinter($h) | Out-Null
  } finally {
    [CleverPrintRaw]::EndDocPrinter($h) | Out-Null
  }
} finally {
  [CleverPrintRaw]::ClosePrinter($h) | Out-Null
}
Write-Output 'OK'
`;

async function sendRaw(printer: string, data: Buffer): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'cleverprint-'));
  const file = join(dir, 'job.bin');
  try {
    await writeFile(file, data);
    await new Promise<void>((resolve, reject) => {
      const ps = spawn(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', RAW_PRINT_PS, printer, file],
        { windowsHide: true },
      );
      let stderr = '';
      ps.stderr.on('data', (d) => { stderr += d.toString(); });
      ps.on('error', reject);
      ps.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr.trim() || `powershell exit ${code}`));
      });
    });
  } finally {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (err) {
      logger.debug('Temp cleanup failed', err);
    }
  }
}

// node-thermal-printer calls `driver.printDirect(args)` synchronously and
// expects `args.success(jobId)` or `args.error(err)` to be invoked later.
// We mimic the @thiagoelg/node-printer API surface that node-thermal-printer
// touches; everything else is optional.
export const windowsRawDriver = {
  getPrinters(): unknown[] {
    return [];
  },
  printDirect(args: PrintDirectArgs): boolean {
    const buf =
      typeof args.data === 'string'
        ? Buffer.from(args.data, 'binary')
        : Buffer.from(args.data);
    void sendRaw(args.printer, buf).then(
      () => args.success?.(String(Date.now())),
      (err: Error) => args.error?.(err),
    );
    return true;
  },
};

export default windowsRawDriver;
