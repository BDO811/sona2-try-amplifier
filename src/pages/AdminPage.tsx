import { useCallback, useEffect, useState } from "react";
import {
  adminLogin,
  clearSession,
  fetchAdminLeads,
  loadStoredSession,
  type AdminLead,
} from "@/lib/admin-api-client";

/**
 * try.amplifierhealth.com/admin — password-gated list of every triage
 * submission (contact info + the demographic fields collected at intake).
 * Not linked from anywhere in the app; reached only by typing the URL.
 *
 * Auth is a single shared password checked server-side by adminLogin, which
 * issues a signed, time-limited token this page holds in sessionStorage and
 * sends as a bearer token to adminLeads. See admin-login/index.js for why
 * this is a shared-password token rather than per-user Firebase Auth.
 */

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Badge({ ok, yesLabel, noLabel }: { ok: boolean | null; yesLabel: string; noLabel: string }) {
  const color = ok === true ? "#1E5631" : ok === false ? "#8E1220" : "#8E8E86";
  const bg = ok === true ? "rgba(30,86,49,0.1)" : ok === false ? "rgba(142,18,32,0.08)" : "rgba(142,142,134,0.1)";
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}40` }}
    >
      {ok === null ? "—" : ok ? yesLabel : noLabel}
    </span>
  );
}

const AdminPage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const loadLeads = useCallback(async (activeToken: string) => {
    setLoadingLeads(true);
    setLoadError(null);
    const result = await fetchAdminLeads(activeToken);
    setLoadingLeads(false);
    if (result.ok === true) {
      setLeads(result.leads);
      setTruncated(result.truncated);
      return;
    }
    if (result.reason === "unauthorized") {
      setToken(null);
      setLeads(null);
      setLoginError("Your session expired. Log in again.");
    } else {
      setLoadError("Could not load submissions. Try refreshing.");
    }
  }, []);

  // Pick up an existing, still-valid session on load so a refresh doesn't
  // force the password to be typed again.
  useEffect(() => {
    const existing = loadStoredSession();
    if (existing) {
      setToken(existing.token);
      loadLeads(existing.token);
    }
  }, [loadLeads]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoggingIn(true);
      setLoginError(null);
      const result = await adminLogin(password, totpCode);
      setLoggingIn(false);
      if (result.ok === false) {
        setTotpCode("");
        setLoginError(result.error);
        return;
      }
      setPassword("");
      setTotpCode("");
      setToken(result.session.token);
      loadLeads(result.session.token);
    },
    [password, totpCode, loadLeads]
  );

  const handleLogout = useCallback(() => {
    clearSession();
    setToken(null);
    setLeads(null);
  }, []);

  const pageStyle: React.CSSProperties = {
    backgroundColor: "#DBCCB1",
    minHeight: "100vh",
    fontFamily: "ui-monospace, 'Courier New', monospace",
  };

  if (!token) {
    return (
      <div style={pageStyle} className="flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[360px] rounded-xl p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <h1 className="text-white text-xs uppercase tracking-widest font-semibold mb-1">
            Amplifier Admin
          </h1>
          <p className="text-white/50 text-[10px] mb-5">try.amplifierhealth.com/admin</p>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/15 outline-none focus:border-[#1E5631] mb-3"
          />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit authenticator code"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/15 outline-none focus:border-[#1E5631] mb-3 tracking-[0.3em]"
          />
          {loginError && <p className="text-[11px] mb-3" style={{ color: "#FF6173" }}>{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn || !password || totpCode.length !== 6}
            className="w-full rounded-lg py-2.5 text-xs uppercase tracking-widest font-semibold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#1E5631", color: "white" }}
          >
            {loggingIn ? "Checking…" : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={pageStyle} className="px-4 py-8 md:px-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-[#231200] text-sm uppercase tracking-widest font-semibold">
              Submissions
            </h1>
            <p className="text-[#2E2E2E] text-[11px] mt-0.5">
              {leads ? `${leads.length} total${truncated ? " (showing most recent 500)" : ""}` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadLeads(token)}
              disabled={loadingLeads}
              className="text-[10px] uppercase tracking-widest font-semibold text-[#231200] hover:opacity-70 disabled:opacity-40"
            >
              {loadingLeads ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-widest font-semibold text-[#8E1220] hover:opacity-70"
            >
              Log Out
            </button>
          </div>
        </div>

        {loadError && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-[11px]"
            style={{ backgroundColor: "rgba(142,18,32,0.08)", color: "#8E1220", border: "1px solid rgba(142,18,32,0.25)" }}
          >
            {loadError}
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(35,18,0,0.15)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: "rgba(35,18,0,0.06)" }}>
                  {["Submitted", "Name", "Email", "Phone", "Sex", "Age", "Focus", "Lang", "Consent", "Emailed"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-3 py-2.5 text-[9px] uppercase tracking-widest font-semibold text-[#2E2E2E] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {(leads ?? []).map((lead) => (
                  <tr key={lead.id} style={{ borderTop: "1px solid rgba(35,18,0,0.08)" }}>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#231200] font-medium whitespace-nowrap">
                      {lead.fullName || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] whitespace-nowrap">
                      {lead.email || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] whitespace-nowrap">
                      {lead.phone || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] capitalize whitespace-nowrap">
                      {lead.biologicalSex || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] whitespace-nowrap">
                      {lead.ageRange || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] capitalize whitespace-nowrap">
                      {lead.healthFocus || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#2E2E2E] uppercase whitespace-nowrap">
                      {lead.language || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge ok={lead.consentGiven} yesLabel="Yes" noLabel="No" />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge ok={lead.emailSent} yesLabel="Sent" noLabel="Failed" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leads && leads.length === 0 && (
            <p className="text-center text-[11px] text-[#2E2E2E] py-10">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
