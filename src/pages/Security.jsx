import { useEffect, useState } from "react";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Security() {
  const [data, setData] = useState(null);
  useEffect(() => { api.security().then(setData); }, []);
  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">06 — SECURITY MODEL</div><h2>How trust is established</h2><p>A transparent verification chain designed for the hackathon demonstration.</p></div></div>
      <section className="security-architecture">
        <div className="arch-node">Credential data</div><div className="arrow">↓</div>
        <div className="arch-node">Canonical JSON</div><div className="arrow">↓</div>
        <div className="arch-node accent">SHA-256 hash</div><div className="arrow">↓</div>
        <div className="arch-node">Stored credential + audit log</div><div className="arrow">↓</div>
        <div className="arch-node accent">Recalculate + compare</div><div className="arrow">↓</div>
        <div className="arch-result">VERIFIED / TAMPERED / REVOKED / ISSUER INACTIVE</div>
      </section>
      <div className="security-cards">
        {data?.controls.map(c=><div className="panel security-card" key={c.name}><div className="panel-head"><h3>{c.name}</h3><StatusBadge value={c.state}/></div><p>{c.detail}</p></div>)}
      </div>
    </>
  );
}
