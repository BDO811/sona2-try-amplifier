const crypto = require("crypto");
const { Firestore } = require("@google-cloud/firestore");

const firestore = new Firestore();

/*
  Returns the wellness_demo_leads collection (every triage submission —
  name, contact info, and the demographic fields collected at intake) to the
  /admin page, gated on the bearer token admin-login issues. See that
  function's header comment for why this is a shared-password token rather
  than per-user Firebase Auth.

  Deliberately omits emailAttempts/emailError (notify-lead/notify-lead-sweep's
  own retry bookkeeping, not something an admin reviewing signups needs) and
  caps at MAX_RESULTS so this can't grow into an unbounded read as volume
  picks up without a pagination design, not because 500 is a real ceiling.
*/

const MAX_RESULTS = 500;

function getCorsOrigin(requestOrigin) {
  const fallback = "https://try.amplifierhealth.com";
  if (!requestOrigin) return fallback;
  if (requestOrigin.endsWith(".amplifierhealth.com") && requestOrigin.startsWith("https://")) return requestOrigin;
  if (/^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) return requestOrigin;
  return fallback;
}

function setCorsHeaders(req, res) {
  res.set("Access-Control-Allow-Origin", getCorsOrigin(req.headers.origin));
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function verifyToken(authHeader, secret) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return false;
  return true;
}

exports.adminLeads = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const tokenSecret = process.env.ADMIN_TOKEN_SECRET;
  if (!tokenSecret) {
    console.error("[admin-leads] ADMIN_TOKEN_SECRET not configured");
    res.status(500).json({ error: "Admin API is not configured." });
    return;
  }

  if (!verifyToken(req.headers.authorization, tokenSecret)) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  try {
    const snapshot = await firestore
      .collection("wellness_demo_leads")
      .orderBy("createdAt", "desc")
      .limit(MAX_RESULTS)
      .get();

    const leads = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        fullName: d.fullName ?? null,
        email: d.email ?? null,
        phone: d.phone ?? null,
        biologicalSex: d.biologicalSex ?? null,
        ageRange: d.ageRange ?? null,
        healthFocus: d.healthFocus ?? null,
        language: d.language ?? null,
        consentGiven: d.consentGiven ?? null,
        emailSent: d.emailSent ?? null,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({ leads, count: leads.length, truncated: leads.length === MAX_RESULTS });
  } catch (error) {
    console.error("[admin-leads] Firestore query failed:", error);
    res.status(500).json({ error: "Failed to load leads." });
  }
};
