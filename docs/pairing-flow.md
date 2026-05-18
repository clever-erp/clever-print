# Pairing flow

```
┌────────────┐                                  ┌──────────────────┐
│  clever-   │                                  │   clever-print   │
│   front    │                                  │  (tray app)      │
└─────┬──────┘                                  └─────────┬────────┘
      │                                                    │
      │  GET /health                                       │
      │ ─────────────────────────────────────────────────► │
      │  ◄────────── { ok, paired: false, version }        │
      │                                                    │
      │  POST /pair { origin, storeName, userEmail }       │
      │ ─────────────────────────────────────────────────► │
      │                                                    │
      │                          [tray window pops up      │
      │                           showing 6-digit code]    │
      │  ◄────────── { pairingId, expiresAt }              │
      │                                                    │
      │  user reads code from tray, types into browser     │
      │                                                    │
      │  POST /pair/confirm { pairingId, code }            │
      │ ─────────────────────────────────────────────────► │
      │  ◄────────── { token, origin }                     │
      │                                                    │
      │  POST /print  (X-Pairing-Token: <token>)           │
      │ ─────────────────────────────────────────────────► │
      │  ◄────────── { jobId, status: 'printed' }          │
```

Token lifetime: until the user clicks **Desemparejar** in either side.
Code lifetime: 120 seconds after `POST /pair`.
