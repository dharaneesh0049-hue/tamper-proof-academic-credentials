import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ institutions: [], credentials: [], logs: [] }, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function logEvent(db, action, credentialId = null, details = "") {
  db.logs.unshift({
    id: crypto.randomUUID(),
    action,
    credentialId,
    details,
    timestamp: new Date().toISOString()
  });
}

function cleanCredential(c) {
  return {
    id: c.id,
    studentName: c.studentName,
    registerNumber: c.registerNumber,
    qualification: c.qualification,
    institutionId: c.institutionId,
    issueDate: c.issueDate,
    grade: c.grade,
    status: c.status,
    hash: c.hash,
    qrDataUrl: c.qrDataUrl,
    verificationUrl: c.verificationUrl,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
}

function canonicalPayload(input) {
  return JSON.stringify({
    studentName: input.studentName,
    registerNumber: input.registerNumber,
    qualification: input.qualification,
    institutionId: input.institutionId,
    issueDate: input.issueDate,
    grade: input.grade
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "localhost";
}

function verificationUrlFor(id) {
  return `http://${getLanIp()}:5173/verify/${encodeURIComponent(id)}`;
}


function makeCredentialId() {
  return `CRD-${new Date().getFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "TrustCert API", time: new Date().toISOString() });
});

app.get("/api/dashboard", (req, res) => {
  const db = readDb();
  const active = db.credentials.filter(c => c.status === "ACTIVE").length;
  const verifications = db.logs.filter(l => l.action === "VERIFICATION").length;
  res.json({
    institutions: db.institutions.length,
    credentials: db.credentials.length,
    activeCredentials: active,
    verificationCount: verifications,
    revoked: db.credentials.filter(c => c.status === "REVOKED").length,
    tamperEvents: db.logs.filter(l => l.action === "TAMPER_DEMO").length,
    recentLogs: db.logs.slice(0, 8)
  });
});

app.get("/api/institutions", (req, res) => {
  const db = readDb();
  res.json(db.institutions);
});

app.post("/api/institutions", (req, res) => {
  const { name, contact } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Institution name is required." });

  const db = readDb();
  const id = `INST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const institution = {
    id,
    name: name.trim(),
    contact: contact?.trim() || "",
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };

  db.institutions.unshift(institution);
  logEvent(db, "INSTITUTION_REGISTERED", null, `${institution.name} registered as ${id}`);
  writeDb(db);
  res.status(201).json(institution);
});

app.patch("/api/institutions/:id/status", (req, res) => {
  const db = readDb();
  const institution = db.institutions.find(i => i.id === req.params.id);
  if (!institution) return res.status(404).json({ message: "Institution not found." });

  const status = req.body.status;
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    return res.status(400).json({ message: "Status must be ACTIVE or INACTIVE." });
  }

  institution.status = status;
  logEvent(db, "INSTITUTION_STATUS_CHANGED", null, `${institution.id} changed to ${status}`);
  writeDb(db);
  res.json(institution);
});

app.get("/api/credentials", (req, res) => {
  const db = readDb();
  res.json(db.credentials.map(cleanCredential));
});

app.post("/api/credentials", async (req, res) => {
  const required = ["studentName", "registerNumber", "qualification", "institutionId", "issueDate", "grade"];
  for (const field of required) {
    if (!req.body[field]?.toString().trim()) {
      return res.status(400).json({ message: `${field} is required.` });
    }
  }

  const db = readDb();
  const institution = db.institutions.find(i => i.id === req.body.institutionId);
  if (!institution) return res.status(400).json({ message: "Selected institution does not exist." });
  if (institution.status !== "ACTIVE") {
    return res.status(400).json({ message: "Credentials cannot be issued by an inactive institution." });
  }

  const id = makeCredentialId();
  const payload = canonicalPayload(req.body);
  const hash = sha256(payload);
  const verifyUrl = verificationUrlFor(id);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "H"
  });

  const credential = {
    id,
    studentName: req.body.studentName.trim(),
    registerNumber: req.body.registerNumber.trim(),
    qualification: req.body.qualification.trim(),
    institutionId: req.body.institutionId,
    issueDate: req.body.issueDate,
    grade: req.body.grade.trim(),
    status: "ACTIVE",
    hash,
    qrDataUrl,
    verificationUrl: verifyUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.credentials.unshift(credential);
  logEvent(db, "CREDENTIAL_ISSUED", id, `Issued by ${institution.name}`);
  writeDb(db);
  res.status(201).json(cleanCredential(credential));
});

app.get("/api/credentials/:id", (req, res) => {
  const db = readDb();
  const credential = db.credentials.find(c => c.id === req.params.id);
  if (!credential) return res.status(404).json({ message: "Credential not found." });
  res.json(cleanCredential(credential));
});

app.post("/api/credentials/:id/verify", (req, res) => {
  const db = readDb();
  const credential = db.credentials.find(c => c.id === req.params.id);

  if (!credential) {
    logEvent(db, "VERIFICATION", req.params.id, "Credential not found.");
    writeDb(db);
    return res.status(404).json({
      result: "NOT_FOUND",
      message: "No credential exists with this Credential ID."
    });
  }

  const institution = db.institutions.find(i => i.id === credential.institutionId);

  // Rebuild the current credential payload. This is the tamper check.
  const currentHash = sha256(canonicalPayload(credential));
  const hashMatches = currentHash === credential.hash;
  const issuerActive = institution?.status === "ACTIVE";
  const credentialActive = credential.status === "ACTIVE";

  let result = "VERIFIED";
  let message = "Credential is authentic and the stored integrity hash matches.";

  if (!hashMatches) {
    result = "TAMPERED";
    message = "Credential data was modified after issuance. Current hash does not match the stored hash.";
  } else if (credential.status === "REVOKED") {
    result = "REVOKED";
    message = "Credential exists, but it has been revoked by the issuing institution.";
  } else if (!issuerActive) {
    result = "ISSUER_INACTIVE";
    message = "Credential hash is intact, but the issuing institution is currently inactive.";
  } else if (!credentialActive) {
    result = "INVALID_STATUS";
    message = "Credential has an invalid current status.";
  }

  logEvent(db, "VERIFICATION", credential.id, result);
  writeDb(db);

  res.json({
    result,
    message,
    credential: cleanCredential(credential),
    institution,
    storedHash: credential.hash,
    currentHash,
    hashMatches,
    issuerActive,
    credentialActive
  });
});

app.post("/api/credentials/:id/revoke", (req, res) => {
  const db = readDb();
  const credential = db.credentials.find(c => c.id === req.params.id);
  if (!credential) return res.status(404).json({ message: "Credential not found." });

  credential.status = "REVOKED";
  credential.updatedAt = new Date().toISOString();
  logEvent(db, "CREDENTIAL_REVOKED", credential.id, "Credential revoked by authorized demo administrator.");
  writeDb(db);
  res.json(cleanCredential(credential));
});

// Controlled demonstration endpoint.
// It intentionally changes the stored credential data without updating its original hash.
app.post("/api/credentials/:id/tamper-demo", (req, res) => {
  const db = readDb();
  const credential = db.credentials.find(c => c.id === req.params.id);
  if (!credential) return res.status(404).json({ message: "Credential not found." });

  credential.studentName = `${credential.studentName} (MODIFIED)`;
  credential.updatedAt = new Date().toISOString();
  logEvent(db, "TAMPER_DEMO", credential.id, "Demo mutation applied without changing original SHA-256 hash.");
  writeDb(db);

  res.json({
    message: "Demo tampering applied. Verify this credential to see the hash mismatch.",
    credential: cleanCredential(credential)
  });
});

app.get("/api/logs", (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

app.get("/api/security", (req, res) => {
  res.json({
    controls: [
      { name: "SHA-256 integrity", state: "ACTIVE", detail: "Credential data is hashed at issuance and recalculated during verification." },
      { name: "Issuer status validation", state: "ACTIVE", detail: "Verification checks whether the issuing institution is active." },
      { name: "Credential lifecycle", state: "ACTIVE", detail: "Credentials can move from ACTIVE to REVOKED." },
      { name: "Audit logging", state: "ACTIVE", detail: "Issuance, verification, tamper demo and revocation events are logged." },
      { name: "QR verification", state: "ACTIVE", detail: "Each credential receives a QR code that points to its verification route." },
      { name: "Demo persistence", state: "LOCAL", detail: "This academic demo stores data in server/data/db.json. Replace with a production DB before deployment." }
    ]
  });
});

app.listen(4000, "0.0.0.0", () => {
  console.log("TrustCert API running on port 4000");
  console.log(`QR verification URL uses: ${getLanIp()}:5173`);
});
