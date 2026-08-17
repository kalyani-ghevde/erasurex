# ErasureX — Adaptive Sanitization & IT Asset Trust Platform
### Interactive prototype (SIH-style demo)

A clickable, functional prototype of a Blancco-style data erasure console:
scan a device → analyze it → run a sanitization simulation → get an
independent PASS/FAIL validation → receive a signed digital certificate →
verify it on a public portal → review the full audit log.

---

## How to run

No build step, no server, no install required.

1. Unzip the project.
2. Double-click `index.html` (or open it in Chrome/Edge/Firefox).
3. Use the sidebar to navigate: **Dashboard → Scan Devices → Reports → Verification Portal**.

> The dashboard chart uses Chart.js from a CDN — it needs internet the
> first time it loads. Everything else (scanning, wiping, certificates,
> verification, storage) runs 100% offline, in the browser.

### Suggested demo flow for judges
1. **Dashboard** — empty state, trust metrics at 0.
2. **Scan Devices** → click "Scan for devices" → click any detected drive.
3. **Capability Analysis** → see the auto-recommended NIST 800-88 method → "Start sanitization".
4. **Sanitization** → watch the animated offline-first wipe log and progress bar.
5. **Validation** → PASS (~85% of runs) issues a certificate; FAIL shows **"NO PROOF = NO CERTIFICATE"**.
6. **Certificate** → certificate ID, SHA-256 proof hash, and a scan-style verification pattern.
7. **Verification Portal** → paste the certificate ID → instantly verified.
8. **Reports & Audit** → full chain-of-custody log, exportable as CSV.

---

## Project structure

```
erasurex-prototype/
├── index.html          all views (dashboard, scan, detail, wipe, result, certificate, reports, verify)
├── css/
│   └── styles.css      full UI styling (sidebar console layout, cards, progress, certificate, tables)
├── js/
│   ├── data.js         mock device pool, NIST-aligned method definitions, localStorage persistence, SHA-256 hashing
│   ├── icons.js         dependency-free inline SVG icon set
│   ├── qr.js             deterministic offline "verification pattern" generator (QR-code stand-in)
│   └── app.js            routing + all interactive logic (scan, wipe simulation, validation, certificate, verify, reports)
└── README.md
```

---

## Technologies used in this prototype

| Layer | Technology | Why |
|---|---|---|
| Structure | HTML5 | Zero-build, opens directly in any browser |
| Styling | Hand-written CSS3 (Grid + Flexbox, CSS variables) | Full control of the Blancco-style console look, no framework overhead |
| Logic | Vanilla JavaScript (ES6) | No build tooling needed — the whole app is 4 small JS files |
| Charts | Chart.js (CDN) | Quick, polished PASS/FAIL doughnut chart on the dashboard |
| Cryptographic proof | Web Crypto API (`crypto.subtle.digest`, SHA-256) | Real, browser-native hashing — not a fake string, an actual SHA-256 digest of the certificate data |
| Storage | `localStorage` | Simulates a persistence layer so certificates/reports survive a refresh, with zero backend |
| Verification pattern | Custom deterministic canvas generator | Works fully offline with no external QR library dependency |

This is intentionally a **frontend-only, offline-capable simulation** —
enough to demo the full user journey and trust model convincingly without
needing real device access or a server.

---

## What a production build would add

| Area | Production technology |
|---|---|
| Device access | Native sanitization agent (C/C++ or Rust) calling `hdparm`/ATA Secure Erase, NVMe Sanitize command set, and Android ADB/FBE key destruction — the offline-first bootable ISO shown in the concept diagram |
| Backend API | Node.js (NestJS/Express) or Python (FastAPI) exposing REST/gRPC endpoints for device intake, validation, and certificate issuance |
| Database | PostgreSQL for asset passports, chain-of-custody, and audit logs; object storage (S3-compatible) for certificate PDFs and evidence artifacts |
| Certificates | Real X.509/PKI-signed PDF certificates (e.g. via `pdf-lib` or a signing service), tamper-evident with a public key published on the verification portal |
| QR codes | Standards-compliant QR generation (`qrcode` npm package) encoding a signed verification URL |
| Auth & multi-tenant | OAuth2/OIDC for Organization / Technician / Recycler / Verifier / Admin roles, matching the restricted-module structure from the architecture diagram |
| Integrations | LinkedIn/GitHub/email connectors, payment gateway for enterprise billing, cloud storage for evidence backup, web analytics |
| Deployment | Containerized (Docker) services behind an API gateway, CI/CD pipeline, encrypted-at-rest database with key management (KMS) |

---

## Notes for the demo

- Every "wipe" is a **simulation** — no real disk is touched. It exists to demonstrate the workflow, trust model, and certificate lifecycle.
- The verification pattern on the certificate is a deterministic, dependency-free stand-in for a real QR code so the prototype works with zero internet — swap in a QR library for production.
- Validation results are randomized (~85% PASS) to let you demonstrate both the success path and the **"NO PROOF = NO CERTIFICATE"** failure path in a live demo.
