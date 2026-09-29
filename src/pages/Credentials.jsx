import { useEffect, useState } from "react";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { Link } from "react-router-dom";

export default function Credentials() {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");

  const load = () => api.credentials().then(setItems).catch(e => setNotice(e.message));
  useEffect(() => { load(); }, []);

  async function action(fn, success) {
    try { await fn(); setNotice(success); load(); } catch (e) { setNotice(e.message); }
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">03 — CREDENTIAL REGISTRY</div><h2>Issued credentials</h2><p>Manage verification, revocation and the controlled tampering demonstration.</p></div>
        <Link className="primary-btn" to="/credentials/issue">+ Issue</Link>
      </div>
      {notice && <div className="notice">{notice}</div>}
      <section className="panel table-wrap">
        <table>
          <thead><tr><th>Credential ID</th><th>Student</th><th>Qualification</th><th>Status</th><th>Security</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(c => <tr key={c.id}>
              <td><code>{c.id}</code></td>
              <td><b>{c.studentName}</b><small>{c.registerNumber}</small></td>
              <td>{c.qualification}<small>{c.issueDate} · {c.grade}</small></td>
              <td><StatusBadge value={c.status}/></td>
              <td><span className="hash-mini">{c.hash.slice(0,12)}…</span></td>
              <td className="actions">
                <Link className="ghost-btn" to={`/verify/${c.id}`}>Verify</Link>
                {c.status === "ACTIVE" && <button className="ghost-btn danger" onClick={()=>action(()=>api.revoke(c.id),"Credential revoked.")}>Revoke</button>}
                <button className="ghost-btn warn" onClick={()=>action(()=>api.tamperDemo(c.id),"Tamper demo applied. Now verify it.")}>Tamper test</button>
              </td>
            </tr>)}
          </tbody>
        </table>
        {!items.length && <div className="empty">No credentials yet.</div>}
      </section>
      <div className="demo-callout"><b>🔥 Tampering Demo</b><span>Click “Tamper test” to intentionally modify the student data without updating the original SHA-256. Then verify the credential and show the hash mismatch.</span></div>
    </>
  );
}
