# TrustCert — Tamper-Proof Academic Credential Verification

Advanced hackathon demo built with React + Vite + Express + SHA-256 + QR verification.

## Run on Windows

1. Install Node.js LTS.
2. Open CMD in this project folder.
3. Run:

```cmd
npm install --legacy-peer-deps
npm run dev
```

4. Open `http://localhost:5173`.

The dev command starts both the frontend (`5173`) and API (`4000`).

## QR code

QR codes are generated in the browser after a credential is issued. The QR points to the current app origin plus `/verify/<credential-id>`.

For phone scanning on the same Wi-Fi network, open the app using your PC's LAN IP, for example `http://192.168.1.10:5173`, then issue the credential. The QR will encode that LAN URL.

## Demo flow

Institution Registration → Credential Issuance → QR + SHA-256 → Verify → Tamper Demo → TAMPERED → Revoke → REVOKED → Audit History.

## Routes

- `/` Dashboard
- `/institutions` Institution Registration
- `/credentials/issue` Credential Issuance
- `/credentials` Credential Registry
- `/verify` Verification
- `/verify/:credentialId` Direct QR Verification
- `/audit` Audit History
- `/security` Security Model
