/**
 * Recommendations endpoint.
 *
 * Takes the bands a result landed on and returns written suggestions for the
 * ones that are not normal. The model call lives here rather than in the client
 * because the API key cannot ship in a static bundle.
 *
 * The key is mounted from Secret Manager as ANTHROPIC_API_KEY. Nothing about the
 * caller is stored: the request carries sign names and bands, never audio, never
 * an email, and nothing is written to Firestore.
 */

const ALLOWED_ORIGINS = [
  "https://try.amplifierhealth.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

/** Bands worth writing about. NORMAL and INCONCLUSIVE are not actionable. */
const ACTIONABLE_BANDS = new Set(["LOW", "MODERATE", "ELEVATED"]);

const MODEL = process.env.RECOMMENDATIONS_MODEL || "claude-sonnet-4-6";
const MAX_SIGNS = 12;

function cleanString(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/**
 * The prompt. Written to produce practical, specific suggestions tied to the
 * signs that came back, and to avoid restating the reading back at the reader,
 * which is already on the screen above the button.
 */
function buildPrompt(signs, assessment) {
  const lines = signs
    .map((s) => `- ${s.label} (${s.band.toLowerCase()})`)
    .join("\n");

  return [
    `A voice assessment returned these readings on the ${assessment} model:`,
    "",
    lines,
    "",
    "Write suggestions for improving each one. Requirements:",
    "- One short paragraph per reading, in the order listed.",
    "- Open each paragraph with the reading's name, then the suggestion.",
    "- Be specific and practical: what to change, how much, how often.",
    "- Do not restate the score or the band; the reader can already see it.",
    "- Do not diagnose, and do not tell the reader what condition they have.",
    "- No preamble, no closing summary, no bullet characters, no headings.",
    "- No em dashes or en dashes anywhere in the text.",
  ].join("\n");
}

exports.recommendations = async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[recommendations] ANTHROPIC_API_KEY is not mounted");
    return res.status(503).json({ error: "not_configured" });
  }

  const body = req.body || {};
  const assessment = cleanString(body.assessment, 40) || "wellness";

  const signs = (Array.isArray(body.signs) ? body.signs : [])
    .map((s) => ({
      label: cleanString(s && s.label, 60),
      band: cleanString(s && s.band, 20).toUpperCase(),
    }))
    .filter((s) => s.label && ACTIONABLE_BANDS.has(s.band))
    .slice(0, MAX_SIGNS);

  if (signs.length === 0) {
    // Nothing outside the normal range, so there is nothing to suggest.
    return res.status(200).json({ text: "", signs: 0 });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: "user", content: buildPrompt(signs, assessment) }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("[recommendations] upstream error", upstream.status, detail.slice(0, 400));
      return res.status(502).json({ error: "upstream_error" });
    }

    const payload = await upstream.json();
    const text = (payload.content || [])
      .filter((block) => block && block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    console.log(`[recommendations] ${signs.length} signs, ${text.length} chars`);
    return res.status(200).json({ text, signs: signs.length });
  } catch (error) {
    console.error("[recommendations] failed", error);
    return res.status(500).json({ error: "failed" });
  }
};
