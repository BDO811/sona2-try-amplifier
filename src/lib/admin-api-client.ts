/**
 * Client for the admin-login / admin-leads Cloud Functions behind
 * try.amplifierhealth.com/admin. Same hardcoded-URL-with-env-override pattern
 * as notify-lead-client and leadgen-api-client — see notify-lead-client.ts
 * for why the default must not live only in .env.
 *
 * The session token is kept in sessionStorage, not localStorage: it should
 * not outlive the browser tab any longer than it has to on a machine someone
 * else might use.
 */

const DEFAULT_ADMIN_LOGIN_URL =
  "https://us-central1-amits-playground-po.cloudfunctions.net/adminLogin";
const DEFAULT_ADMIN_LEADS_URL =
  "https://us-central1-amits-playground-po.cloudfunctions.net/adminLeads";

const ADMIN_LOGIN_URL =
  (import.meta.env.VITE_ADMIN_LOGIN_URL as string | undefined) || DEFAULT_ADMIN_LOGIN_URL;
const ADMIN_LEADS_URL =
  (import.meta.env.VITE_ADMIN_LEADS_URL as string | undefined) || DEFAULT_ADMIN_LEADS_URL;

const SESSION_KEY = "amplifier_admin_session";

export interface AdminSession {
  token: string;
  expiresAt: number;
}

export interface AdminLead {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  biologicalSex: string | null;
  ageRange: string | null;
  healthFocus: string | null;
  language: string | null;
  consentGiven: boolean | null;
  emailSent: boolean | null;
  createdAt: string | null;
}

export function loadStoredSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.token || !parsed.expiresAt || Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export type AdminLoginResult =
  | { ok: true; session: AdminSession }
  | { ok: false; error: string };

/** Password plus a 6-digit TOTP code from an authenticator app. */
export async function adminLogin(password: string, totpCode: string): Promise<AdminLoginResult> {
  try {
    const response = await fetch(ADMIN_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, totpCode }),
    });
    const data = (await response.json()) as AdminSession & { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error || "Login failed." };
    }
    storeSession(data);
    return { ok: true, session: data };
  } catch (error) {
    console.error("[admin-api-client] Login failed:", error);
    return { ok: false, error: "Could not reach the server. Try again." };
  }
}

export type AdminLeadsResult =
  | { ok: true; leads: AdminLead[]; truncated: boolean }
  | { ok: false; reason: "unauthorized" | "error" };

export async function fetchAdminLeads(token: string): Promise<AdminLeadsResult> {
  try {
    const response = await fetch(ADMIN_LEADS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      clearSession();
      return { ok: false, reason: "unauthorized" };
    }
    if (!response.ok) return { ok: false, reason: "error" };
    const data = (await response.json()) as { leads: AdminLead[]; truncated: boolean };
    return { ok: true, leads: data.leads, truncated: data.truncated };
  } catch (error) {
    console.error("[admin-api-client] Fetching leads failed:", error);
    return { ok: false, reason: "error" };
  }
}
