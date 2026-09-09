/**
 * Recommendations endpoint.
 *
 * Takes the bands a result landed on and returns written suggestions for the
 * ones that are not normal. The model call lives here rather than in the client
 * because the API key cannot ship in a static bundle.
 *
 * The key is mounted from Secret Manager as GEMINI_API_KEY. Nothing about the
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

/*
  Gemini via the Generative Language API, which has a free tier. Vertex AI would
  authenticate off the function's own service account and need no key at all,
  but it bills per call, so this uses the free endpoint instead.
*/
const MODEL = process.env.RECOMMENDATIONS_MODEL || "gemini-3.6-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/*
  Settled against the live API on 2026-09-09 rather than from the docs, because
  three things were not what the obvious configuration would have been:

  - The model list advertises gemini-2.5-flash, which then 404s as retired.
    gemini-2.0-flash is retired too. Only the 3.x line answers.
  - thinkingConfig.thinkingBudget = 0 is rejected outright by this model.
    thinkingLevel "low" is the accepted way to hold reasoning down.
  - Thinking tokens count against maxOutputTokens. At 1200 the whole budget went
    to reasoning and the reply truncated mid-sentence with MAX_TOKENS after 186
    characters. A real reply spends about 1060 thinking tokens and 205 on the
    text, so the ceiling has to sit well above the visible answer.
*/
const MAX_OUTPUT_TOKENS = 4096;
const THINKING_LEVEL = "low";

/*
  The endpoint returns 503 UNAVAILABLE "experiencing high demand" sporadically,
  seen repeatedly while testing. A user-initiated button that fails on a
  transient spike reads as broken, so retry the statuses that are worth
  retrying and leave the rest alone.
*/
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[recommendations] GEMINI_API_KEY is not mounted");
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
    const request = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Header rather than ?key=, so the key stays out of request URLs and
        // therefore out of any log or error that echoes one.
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(signs, assessment) }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          thinkingConfig: { thinkingLevel: THINKING_LEVEL },
        },
      }),
    };

    let upstream;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      upstream = await fetch(ENDPOINT, request);
      if (upstream.ok || !RETRY_STATUSES.has(upstream.status)) break;
      if (attempt === MAX_ATTEMPTS) break;
      const backoffMs = 400 * attempt;
      console.warn(`[recommendations] ${upstream.status}, retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
    }

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("[recommendations] upstream error", upstream.status, detail.slice(0, 400));
      return res.status(502).json({ error: "upstream_error", status: upstream.status });
    }

    const payload = await upstream.json();
    /*
      Gemini nests the text under candidates[].content.parts[]. A candidate can
      come back with no parts at all when generation stops early, so this reads
      defensively rather than indexing straight in.
    */
    const parts =
      (payload.candidates && payload.candidates[0] && payload.candidates[0].content
        ? payload.candidates[0].content.parts
        : null) || [];
    const text = parts
      .map((part) => (part && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (!text) {
      const reason =
        (payload.candidates && payload.candidates[0] && payload.candidates[0].finishReason) ||
        (payload.promptFeedback && payload.promptFeedback.blockReason) ||
        "empty_response";
      console.error("[recommendations] no text returned", reason);
      return res.status(502).json({ error: "empty_response", reason });
    }

    console.log(`[recommendations] ${signs.length} signs, ${text.length} chars`);
    return res.status(200).json({ text, signs: signs.length });
  } catch (error) {
    console.error("[recommendations] failed", error);
    return res.status(500).json({ error: "failed" });
  }
};
