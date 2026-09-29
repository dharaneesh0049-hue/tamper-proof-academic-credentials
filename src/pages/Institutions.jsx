import { useEffect, useState } from "react";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Institutions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", contact: "" });
  const [message, setMessage] = useState("");

  const load = () => api.institutions().then(setItems).catch(e => setMessage(e.message));
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.registerInstitution(form);
      setForm({ name: "", contact: "" });
      setMessage("Institution registered successfully.");
      load();
    } catch (e) { setMessage(e.message); }
  }

  async function toggle(item) {
    try {
      await api.setInstitutionStatus(item.id, item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      load();
    } catch (e) { setMessage(e.message); }
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">01 — INSTITUTION REGISTRATION</div><h2>Issuer registry</h2><p>Register credential-issuing institutions and control their active status.</p></div>
      </div>

      <div className="two-col">
        <section className="panel form-panel">
          <h3>Register institution</h3>
          <form onSubmit={submit}>
            <label>Institution name<input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Velalar College of Engineering and Technology" /></label>
            <label>Contact / email<input value={form.contact} onChange={e => setForm({...form,contact:e.target.value})} placeholder="admin@institution.edu" /></label>
            <button className="primary-btn" type="submit">Register institution</button>
          </form>
          {message && <div className="notice">{message}</div>}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Registered institutions</h3><span className="muted">{items.length} total</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>Institution ID</th><th>Name</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{items.map(i => <tr key={i.id}><td><code>{i.id}</code></td><td><b>{i.name}</b><small>{i.contact || "—"}</small></td><td><StatusBadge value={i.status}/></td><td><button className="ghost-btn" onClick={() => toggle(i)}>{i.status === "ACTIVE" ? "Set inactive" : "Activate"}</button></td></tr>)}</tbody>
            </table>
            {!items.length && <div className="empty">Register an institution to begin issuing credentials.</div>}
          </div>
        </section>
      </div>
    </>
  );
}
