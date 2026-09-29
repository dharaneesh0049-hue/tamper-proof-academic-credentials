import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["Dashboard", "/"],
  ["Institutions", "/institutions"],
  ["Issue Credential", "/credentials/issue"],
  ["Credentials", "/credentials"],
  ["Verify", "/verify"],
  ["Audit History", "/audit"],
  ["Security Model", "/security"]
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <div>
            <strong>TrustCert</strong>
            <span>Academic Integrity</span>
          </div>
        </div>

        <nav>
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <span className="nav-dot" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-mini">
            <span className="live-dot" />
            Security model active
          </div>
          <small>Hackathon demo build</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">TAMPER-PROOF ACADEMIC CREDENTIALS</div>
            <h1>Credential Trust Center</h1>
          </div>
          <NavLink to="/verify" className="top-action">Verify credential →</NavLink>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
