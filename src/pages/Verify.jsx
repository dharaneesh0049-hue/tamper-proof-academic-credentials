import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";

const resultMap = {
  VERIFIED: ["verified", "✓", "Credential Verified"],
  TAMPERED: ["tampered", "!", "Tampering Detected"],
  REVOKED: ["revoked", "×", "Credential Revoked"],
  ISSUER_INACTIVE: ["inactive", "!", "Issuer Inactive"],
  INVALID_STATUS: ["tampered", "!", "Invalid Credential Status"],
  NOT_FOUND: ["not-found", "?", "Credential Not Found"]
};

export default function Verify() {
  const { credentialId: routeId } = useParams();
  const [id, setId] = useState(routeId || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verify(e) {
    e?.preventDefault();
    if (!id.trim()) return;
    setLoading(true); setResult(null);
    try {
      setResult(await api.verify(id.trim()));
    } catch (e) {
      setResult({ result: "NOT_FOUND", message: e.message });
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">04 — CREDENTIAL VERIFICATION</div><h2>Verify authenticity</h2><p>Enter a Credential ID to perform issuer, lifecycle and SHA-256 integrity checks.</p></div>
      </div>

      <section className="verify-box">
        <form onSubmit={verify}>
          <div className="search-input"><span>⌕</span><input value={id} onChange={e=>setId(e.target.value)} placeholder="Enter Credential ID — CRD-2026-XXXXXXXXXX" /></div>
          <button className="primary-btn" disabled={loading}>{loading ? "Checking…" : "Verify credential"}</button>
        </form>
      </section>

      {result && <VerificationResult result={result} />}
    </>
  );
}

function VerificationResult({ result }) {
  const [cls, icon, title] = resultMap[result.result] || resultMap.NOT_FOUND;
  return (
    <section className={`verification-result ${cls}`}>
      <div className="result-top">
        <div className="result-icon">{icon}</div>
        <div><div className="eyebrow">VERIFICATION RESULT</div><h3>{title}</h3><p>{result.message}</p></div>
      </div>

      {result.credential && (
        <>
          <div className="result-grid">
            <div><span>Credential ID</span><b>{result.credential.id}</b></div>
            <div><span>Student</span><b>{result.credential.studentName}</b></div>
            <div><span>Qualification</span><b>{result.credential.qualification}</b></div>
            <div><span>Institution</span><b>{result.institution?.name || result.credential.institutionId}</b></div>
            <div><span>Institution status</span><StatusBadge value={result.institution?.status || "UNKNOWN"}/></div>
            <div><span>Credential status</span><StatusBadge value={result.credential.status}/></div>
          </div>

          <div className="hash-compare">
            <div><span>Stored SHA-256</span><code>{result.storedHash}</code></div>
            <div><span>Current SHA-256</span><code>{result.currentHash}</code></div>
            <div className={result.hashMatches ? "match" : "mismatch"}>{result.hashMatches ? "✓ Hash match — data integrity confirmed" : "⚠ Hash mismatch — data was modified"}</div>
          </div>
        </>
      )}
    </section>
  );
}
