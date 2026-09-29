import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Institutions from "./pages/Institutions";
import IssueCredential from "./pages/IssueCredential";
import Credentials from "./pages/Credentials";
import Verify from "./pages/Verify";
import Audit from "./pages/Audit";
import Security from "./pages/Security";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/institutions" element={<Institutions />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/credentials/issue" element={<IssueCredential />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:credentialId" element={<Verify />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/security" element={<Security />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
