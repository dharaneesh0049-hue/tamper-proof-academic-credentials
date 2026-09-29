import { useEffect, useState } from "react";
import { api } from "../api";

export default function Audit() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.logs().then(setLogs); }, []);

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">05 — AUDIT HISTORY</div><h2>Security event trail</h2><p>Every important credential lifecycle and verification action is recorded here.</p></div></div>
      <section className="panel table-wrap">
        <table><thead><tr><th>Time</th><th>Action</th><th>Credential</th><th>Details</th></tr></thead>
          <tbody>{logs.map(l=><tr key={l.id}><td>{new Date(l.timestamp).toLocaleString()}</td><td><b>{l.action.replaceAll("_"," ")}</b></td><td><code>{l.credentialId || "—"}</code></td><td>{l.details}</td></tr>)}</tbody>
        </table>
        {!logs.length && <div className="empty">No audit events yet.</div>}
      </section>
    </>
  );
}
