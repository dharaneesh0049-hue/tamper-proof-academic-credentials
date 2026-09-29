const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
};

export const api = {
  dashboard: () => request("/api/dashboard"),
  institutions: () => request("/api/institutions"),
  registerInstitution: (body) => request("/api/institutions", { method: "POST", body: JSON.stringify(body) }),
  setInstitutionStatus: (id, status) => request(`/api/institutions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  credentials: () => request("/api/credentials"),
  credential: (id) => request(`/api/credentials/${encodeURIComponent(id)}`),
  issueCredential: (body) => request("/api/credentials", { method: "POST", body: JSON.stringify(body) }),
  verify: (id) => request(`/api/credentials/${encodeURIComponent(id)}/verify`, { method: "POST" }),
  revoke: (id) => request(`/api/credentials/${encodeURIComponent(id)}/revoke`, { method: "POST" }),
  tamperDemo: (id) => request(`/api/credentials/${encodeURIComponent(id)}/tamper-demo`, { method: "POST" }),
  logs: () => request("/api/logs"),
  security: () => request("/api/security")
};
