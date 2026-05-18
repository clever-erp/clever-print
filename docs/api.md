# Clever Print — Local HTTP API

Base URL: `http://127.0.0.1:17777` (loopback only; falls back to 17778..17786 if busy).

All endpoints respond with `X-Agent-Version` header.

## `GET /health` — public

```json
{
  "ok": true,
  "name": "clever-print",
  "version": "0.1.0",
  "paired": true,
  "printerStatus": "online"
}
```

## `POST /pair` — public, rate-limited (3/min per origin)

Request:
```json
{ "origin": "https://tenant.cloudfront.net", "storeName": "La Gula", "userEmail": "kelvin@…" }
```
Response:
```json
{ "pairingId": "p_…", "expiresAt": "2026-05-18T18:31:00Z" }
```
Side-effect: agent raises its tray window showing the 6-digit code.

## `POST /pair/confirm` — public

Request: `{ "pairingId": "p_…", "code": "438192" }`.
Response on success: `{ "token": "<32-byte base64url>", "origin": "…" }`.

## `POST /unpair` — auth required

Forgets the paired origin attached to the supplied token.

## `GET /printers` — auth required

Returns Windows printers (PowerShell `Get-Printer`).

## `GET /status` — auth required

```json
{
  "printer": { "id": "SAT Q22US", "connectionType": "windows", "paperWidthMm": 80, "online": true, "lastError": null },
  "queue": { "pending": 0 },
  "agent": { "version": "0.1.0", "uptimeSec": 4123 }
}
```

## `POST /print` — auth required

```ts
type PrintRequest = {
  jobId?: string;
  copies?: number;
  cutPaper?: boolean;
  openCashDrawer?: boolean;
  order: Order;             // Order shape from clever-front/src/types/index.ts
  store: { name: string; tiktokUrl?: string | null };
  locale?: 'es-PE'|'es-MX'|'en-US';
  currency?: 'PEN'|'MXN'|'USD';
};
```

Response: `{ "jobId": "…", "status": "printed" | "queued" | "failed", "durationMs": 412, "error"?: string }`.

Idempotency: same `jobId` within 60s returns the cached result.

## `POST /test-print` — auth required

Prints a fixture receipt. No body.

## Auth & CORS

- `X-Pairing-Token` header (or `Authorization: Bearer …`) for all routes except `/health` and `/pair*`.
- Origin allowlist sourced from paired origins.
- Constant-time token comparison.
