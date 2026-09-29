import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.dashboard().then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  if (error) return <div className="error-box">{error}<br/><small>Run <b>npm run dev</b> from the project folder.</small></div>;
  if (!data) return <div className="loading">Loading TrustCert dashboard…</div>;

  return (
    <>
      <div className="hero">
        <div>
          <div className="eyebrow">OVERVIEW</div>
          <h2>One place to issue, verify and protect academic credentials.</h2>
          <p>Track institutional trust, credential lifecycle, integrity hashes and verification activity from a single dashboard.</p>
        </div>
        <Link className="primary-btn" to="/credentials/issue">+ Issue Credential</Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Institution count" value={data.institutions} icon="◎" />
        <StatCard label="Credential count" value={data.credentials} icon="▣" />
        <StatCard label="Active credentials" value={data.activeCredentials} icon="✓" tone="green" />
        <StatCard label="Verification count" value={data.verificationCount} icon="⌕" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">SECURITY MODEL</div>
              <h3>Integrity controls</h3>
            </div>
            <StatusBadge value="ACTIVE" />
          </div>
          <div className="security-list">
            <div><span>01</span><b>Issuer trust</b><small>Institution status is checked before trust is granted.</small></div>
            <div><span>02</span><b>SHA-256 fingerprint</b><small>Stored hash is compared with a newly calculated hash.</small></div>
            <div><span>03</span><b>Lifecycle status</b><small>ACTIVE and REVOKED states are visible to verifiers.</small></div>
            <div><span>04</span><b>Audit trail</b><small>Issuance, verification and security events are recorded.</small></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">RECENT ACTIVITY</div>
              <h3>Verification & security events</h3>
            </div>
            <Link to="/audit" className="text-link">View all</Link>
          </div>
          <div className="activity-list">
            {data.recentLogs.length === 0 ? <div className="empty">No activity yet. Issue your first credential.</div> :
              data.recentLogs.map(log => (
                <div className="activity" key={log.id}>
                  <span className="activity-dot" />
                  <div><b>{log.action.replaceAll("_", " ")}</b><small>{log.credentialId || log.details}</small></div>
                  <time>{new Date(log.timestamp).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</time>
                </div>
              ))
            }
          </div>
        </section>
      </div>
    </>
  );
}
