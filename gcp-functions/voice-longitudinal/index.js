/**
 * Longitudinal proxy for the Amplifier v2 group endpoints.
 *
 * POST { email, jobId }          -> registers that job into the user's group
 * GET  ?email=...[&signal=...]   -> the group's longitudinal trajectory
 *
 * The API key is server-side, which is the whole reason this exists: the group
 * endpoints cannot be called from a static bundle.
 *
 * Group identity is the SHA-256 of the normalized email, the same derivation
 * the voice-history function uses, so the two agree on who a subject is and the
 * plaintext address never reaches the Amplifier API. The API's own requirement
 * is that a group represents a single subject, which is exactly what that hash
 * gives.
 *
 * There is no authentication in front of this, matching voice-history. Anyone
 * who knows an email can read that email's trajectory. Acceptable for a demo,
 * not for anything carrying real identifiable history.
 */

const crypto = require("node:crypto");
const https = require("node:https");
const dns = require("node:dns");

/*
  Same IPv4 pinning as the recommendations function. Cloud Run has no IPv6
  egress; leaving resolution to chance cost 30-plus seconds per new connection
  there, and this function calls the same class of upstream.
*/
dns.setDefaultResultOrder("ipv4first");

const agent = new https.Agent({ keepAlive: true, keepAliveMsecs: 30_000, family: 4 });

const ALLOWED_ORIGIN_SUFFIX = ".amplifierhealth.com";
const PRIVATE_ORIGIN =
  /^http:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function originAllowed(origin) {
  if (!origin) return false;
  if (origin.startsWith("https://") && origin.endsWith(ALLOWED_ORIGIN_SUFFIX)) return true;
  if (origin === "https://bdo811.github.io") return true;
  return PRIVATE_ORIGIN.test(origin);
}

/** Matches voice-history exactly. Diverging would split one subject in two. */
function subjectKey(email) {
  return crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
}

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers, agent, family: 4, timeout: 60_000 }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = null;
        }
        resolve({ status: res.statusCode, body: parsed, raw: data });
      });
    });
    req.on("timeout", () => req.destroy(new Error("upstream timeout")));
    req.on("error", reject);
    if (body) req.end(body);
    else req.end();
  });
}

exports.voiceLongitudinal = async (req, res) => {
  const origin = req.headers.origin;
  if (originAllowed(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  const API_URL = process.env.AMPLIFIER_API_URL;
  const ACCOUNT_ID = process.env.AMPLIFIER_ACCOUNT_ID;
  const API_KEY = process.env.AMPLIFIER_API_KEY;
  if (!API_URL || !ACCOUNT_ID || !API_KEY) {
    console.error("[voice-longitudinal] Missing upstream configuration");
    return res.status(500).json({ error: "not_configured" });
  }

  const auth = {
    "X-Account-ID": ACCOUNT_ID,
    "X-API-Key": API_KEY,
    "content-type": "application/json",
  };

  try {
    if (req.method === "POST") {
      const { email, jobId } = req.body || {};
      if (!email || !jobId) return res.status(400).json({ error: "email_and_job_required" });

      const groupId = subjectKey(email);

      /*
        Create then add. A group that already exists answers 409, which is the
        documented response and the normal case after a user's first recording,
        so it is treated as success rather than retried or reported.
      */
      const created = await request(
        "POST",
        `${API_URL}/v2/groups`,
        auth,
        JSON.stringify({ group_id: groupId })
      );
      if (created.status !== 201 && created.status !== 409) {
        console.error("[voice-longitudinal] group create failed", created.status, created.raw.slice(0, 200));
        return res.status(502).json({ error: "group_create_failed", status: created.status });
      }

      const added = await request(
        "POST",
        `${API_URL}/v2/groups/${groupId}/jobs`,
        auth,
        JSON.stringify({ job_ids: [jobId] })
      );
      if (added.status < 200 || added.status >= 300) {
        console.error("[voice-longitudinal] add job failed", added.status, added.raw.slice(0, 200));
        return res.status(502).json({ error: "add_job_failed", status: added.status });
      }

      console.log(`[voice-longitudinal] registered job into group ${groupId.slice(0, 8)}…`);
      return res.status(200).json({ status: "ok", added: added.body && added.body.added });
    }

    if (req.method === "GET") {
      const email = req.query && req.query.email;
      if (!email) return res.status(400).json({ error: "email_required" });

      const groupId = subjectKey(email);
      const params = new URLSearchParams();
      // Documented passthroughs. Repeatable signal is preserved as repeats.
      for (const key of ["from", "to"]) {
        if (req.query[key]) params.append(key, req.query[key]);
      }
      const signals = [].concat(req.query.signal || []);
      for (const s of signals) if (s) params.append("signal", s);

      const qs = params.toString();
      const upstream = await request(
        "GET",
        `${API_URL}/v2/groups/${groupId}/longitudinal${qs ? `?${qs}` : ""}`,
        auth
      );

      /*
        A group with no jobs yet answers 404, which is the first-visit case and
        not an error worth surfacing as one.
      */
      if (upstream.status === 404) {
        return res.status(200).json({ status: "empty", group_id: null, signals: [] });
      }
      if (upstream.status < 200 || upstream.status >= 300) {
        console.error("[voice-longitudinal] fetch failed", upstream.status, upstream.raw.slice(0, 200));
        return res.status(502).json({ error: "fetch_failed", status: upstream.status });
      }

      /*
        "running" means the trajectory is still computing upstream. It is passed
        through rather than polled here, so the caller decides whether to wait
        instead of holding a request open against the function timeout.
      */
      const payload = upstream.body || {};
      // The group id is the subject hash; there is no reason to hand it back.
      delete payload.group_id;
      return res.status(200).json(payload);
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("[voice-longitudinal] failed", error);
    return res.status(500).json({ error: "failed" });
  }
};
