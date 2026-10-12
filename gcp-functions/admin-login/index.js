const crypto = require("crypto");

/*
  Password-gated admin area for try.amplifierhealth.com/admin. One shared
  password (ADMIN_PASSWORD, Secret Manager) rather than per-user accounts —
  this is a single-operator tool, not a multi-admin system, so Firebase Auth
  or a users table would be infrastructure for a problem that doesn't exist
  yet. The password itself never reaches the browser's storage or the
  frontend bundle; only this function sees it, compared with a timing-safe
  equality check so a wrong guess can't be narrowed down by response timing.

  Second factor is standard TOTP (RFC 6238, the same algorithm behind Google
  Authenticator / Authy / 1Password's "time-based" entries) against
  ADMIN_TOTP_SECRET, so a leaked password alone can't get in. Implemented
  directly on Node's crypto rather than an npm package since the whole
  algorithm is ~20 lines of HMAC-SHA1 + dynamic truncation.

  On success, issues a signed, time-limited token the admin page holds in
  sessionStorage and sends back as `Authorization: Bearer <token>` to
  admin-leads. The token is `${expiryMs}.${hmacBase64url}`, verified by
  recomputing the HMAC over the expiry with the same ADMIN_TOKEN_SECRET — no
  server-side session store, so this function and admin-leads can scale to
  zero independently and still agree on whether a token is valid.
*/

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

function getCorsOrigin(requestOrigin) {
  const fallback = "https://try.amplifierhealth.com";
  if (!requestOrigin) return fallback;
  if (requestOrigin.endsWith(".amplifierhealth.com") && requestOrigin.startsWith("https://")) return requestOrigin;
  if (/^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) return requestOrigin;
  return fallback;
}

function setCorsHeaders(req, res) {
  res.set("Access-Control-Allow-Origin", getCorsOrigin(req.headers.origin));
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function signToken(expiresAt, secret) {
  const payload = String(expiresAt);
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function constantTimeStringEqual(a, b) {
  // timingSafeEqual throws on length mismatch rather than returning false, and
  // the length mismatch itself is not secret, so pad instead of early-returning.
  const bufA = Buffer.from(a.padEnd(b.length, "\0"));
  const bufB = Buffer.from(b.padEnd(a.length, "\0"));
  return bufA.length === bufB.length && a.length === b.length && crypto.timingSafeEqual(bufA, bufB);
}

function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of base32.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpAtCounter(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(truncated % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

// Checks the current 30s step plus one step of drift on either side, so a
// code entered right at a step boundary (or a phone clock a few seconds off)
// still verifies.
function verifyTotp(secretBase32, suppliedCode) {
  if (!/^\d{6}$/.test(suppliedCode)) return false;
  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  for (const drift of [0, -1, 1]) {
    if (totpAtCounter(secretBase32, counter + drift) === suppliedCode) return true;
  }
  return false;
}

exports.adminLogin = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const tokenSecret = process.env.ADMIN_TOKEN_SECRET;
  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  if (!adminPassword || !tokenSecret || !totpSecret) {
    console.error("[admin-login] ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, or ADMIN_TOTP_SECRET not configured");
    res.status(500).json({ error: "Admin login is not configured." });
    return;
  }

  const suppliedPassword = typeof req.body?.password === "string" ? req.body.password : "";
  const suppliedCode = typeof req.body?.totpCode === "string" ? req.body.totpCode.trim() : "";

  const passwordMatches = constantTimeStringEqual(suppliedPassword, adminPassword);
  const codeMatches = passwordMatches && verifyTotp(totpSecret, suppliedCode);

  if (!passwordMatches || !codeMatches) {
    // Small fixed delay so a brute-force script gains nothing by scripting
    // around network jitter; not a rate limiter, just removes the cheapest signal.
    await new Promise((resolve) => setTimeout(resolve, 300));
    res
      .status(401)
      .json({ error: passwordMatches ? "Incorrect or expired authenticator code." : "Incorrect password." });
    return;
  }

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = signToken(expiresAt, tokenSecret);
  res.status(200).json({ token, expiresAt });
};
