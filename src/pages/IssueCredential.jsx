import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { api } from "../api";

export default function IssueCredential() {
  const [institutions, setInstitutions] = useState([]);
  const [created, setCreated] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentName: "", registerNumber: "", qualification: "", institutionId: "",
    issueDate: new Date().toISOString().slice(0, 10), grade: ""
  });

  useEffect(() => {
    api.institutions().then(setInstitutions).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function makeQr() {
      if (!created?.id) { setQrDataUrl(""); return; }
      try {
        // The backend provides a LAN URL so a phone on the same Wi-Fi can scan the QR.
        const verifyUrl = created.verificationUrl || `${window.location.origin}/verify/${encodeURIComponent(created.id)}`;
        const dataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 300, margin: 2, errorCorrectionLevel: "H"
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (e) {
        if (!cancelled) setError(`QR generation failed: ${e.message}`);
      }
    }
    makeQr();
    return () => { cancelled = true; };
  }, [created]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setCreated(null); setQrDataUrl("");
    try {
      const result = await api.issueCredential(form);
      setCreated(result);
      setForm({ ...form, studentName: "", registerNumber: "", qualification: "", grade: "" });
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">02 — CREDENTIAL ISSUANCE</div><h2>Issue a trusted credential</h2><p>Create the credential record, SHA-256 fingerprint and QR verification link.</p></div>
      </div>

      <div className="two-col issue-layout">
        <section className="panel form-panel">
          <h3>Student & qualification details</h3>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>Student name<input value={form.studentName} onChange={e=>setForm({...form,studentName:e.target.value})} required placeholder="Student full name" /></label>
              <label>Register number<input value={form.registerNumber} onChange={e=>setForm({...form,registerNumber:e.target.value})} required placeholder="23AD123" /></label>
              <label>Qualification<input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} required placeholder="B.Tech Artificial Intelligence & Data Science" /></label>
              <label>Institution<select value={form.institutionId} onChange={e=>setForm({...form,institutionId:e.target.value})} required><option value="">Select issuer</option>{institutions.map(i=><option key={i.id} value={i.id} disabled={i.status!=="ACTIVE"}>{i.name} — {i.status}</option>)}</select></label>
              <label>Issue date<input type="date" value={form.issueDate} onChange={e=>setForm({...form,issueDate:e.target.value})} required /></label>
              <label>Grade / result<input value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})} required placeholder="A+" /></label>
            </div>
            <button className="primary-btn" type="submit">Generate secure credential</button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </section>

        <section className="panel preview-panel">
          <div className="eyebrow">LIVE OUTPUT</div>
          <h3>Credential security package</h3>
          {!created ? <div className="empty large">Your Credential ID, SHA-256 hash and QR code will appear here after issuance.</div> :
            <div className="credential-preview">
              <div className="qr-card">
                {qrDataUrl ? <img src={qrDataUrl} alt="Credential verification QR code" /> : <div className="qr-loading">Generating QR…</div>}
              </div>
              <div className="qr-help">Scan this QR code from a phone connected to the same Wi-Fi as this computer.</div>
              <div className="result-line"><span>QR Verification URL</span><code>{created.verificationUrl || "Use the page URL"}</code></div>
              <div className="credential-id">{created.id}</div>
              <div className="result-line"><span>SHA-256</span><code>{created.hash}</code></div>
              <div className="result-line"><span>Status</span><b className="green-text">ACTIVE</b></div>
              <Link className="primary-btn full" to={`/verify/${created.id}`}>Open verification page →</Link>
            </div>
          }
        </section>
      </div>
    </>
  );
}
