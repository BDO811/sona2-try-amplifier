/**
 * Presenting a v2 signal's level, using the API's own display vocabulary.
 *
 * The six levels and their display labels come straight from the Display
 * Guidelines at docs.amplifierhealth.com/guides/interpreting-results:
 *
 *   none          Within normal range     Neutral
 *   low           Faint indicator         Informational
 *   consider      Worth considering       Informational / Caution
 *   moderate      Notable indicator       Caution
 *   elevated      Significant indicator   Alert
 *   inconclusive  Analysis inconclusive   Neutral
 *
 * These replace an invented NONE/LOW/MEDIUM/HIGH/VERY HIGH ramp. That ramp read
 * as a severity scale the API does not publish, and it renamed levels the docs
 * name explicitly — "MEDIUM" for `consider`, "HIGH" for `moderate` — which
 * overstated two of the six.
 *
 * Levels are read from `level`, never derived from `score`. The docs are
 * explicit on both halves of that: score is "for internal use only; use level
 * for display", and score-to-level is "a distribution-based calibration unique
 * to each model, rather than fixed numeric ranges". A real apex run bears it
 * out — anxiety scored 0.359 and came back `consider` while cognitive load
 * scored 0.273 and came back `moderate`.
 */

export type SignalLevel =
  | "none"
  | "low"
  | "consider"
  | "moderate"
  | "elevated"
  | "inconclusive";

/** The documented display label per level, verbatim. */
const LEVEL_LABEL: Record<SignalLevel, string> = {
  none: "Within normal range",
  low: "Faint indicator",
  consider: "Worth considering",
  moderate: "Notable indicator",
  elevated: "Significant indicator",
  inconclusive: "Analysis inconclusive",
};

/** The documented UI treatment per level. */
export type UiTreatment = "neutral" | "informational" | "caution" | "alert";

const LEVEL_TREATMENT: Record<SignalLevel, UiTreatment> = {
  none: "neutral",
  low: "informational",
  // The docs give "Informational / Caution" here; caution is the safer read of
  // the two, and `consider` is the lowest level that sets flagged = true.
  consider: "caution",
  moderate: "caution",
  elevated: "alert",
  inconclusive: "neutral",
};

/**
 * Colour per UI treatment rather than per level, so the four documented
 * treatments drive the palette and two levels sharing a treatment share a
 * colour. Brand palette only, no lime.
 *
 * Two grounds: the dark data canvas, and the beige page. Every light value is
 * measured above 4.5:1 against #DBCCB1, where the dark ramp collapses —
 * #FFC163 is 1.02:1 there.
 */
const TREATMENT_COLOR: Record<UiTreatment, { dark: string; light: string }> = {
  neutral: { dark: "#B79862", light: "#665233" },
  informational: { dark: "#4CAF6E", light: "#1E5631" },
  caution: { dark: "#FFC163", light: "#8A3B08" },
  alert: { dark: "#FF6173", light: "#8E1220" },
};

export type Surface = "dark" | "light";

/** The severity order the docs list the levels in, excluding inconclusive. */
export const LEVEL_ORDER: SignalLevel[] = ["none", "low", "consider", "moderate", "elevated"];

/**
 * Normalise an API level. An unrecognised or missing value reads inconclusive
 * rather than none: if a future model adds a level this build has not seen,
 * "analysis inconclusive" is honest, while "within normal range" would be a
 * claim the data does not support.
 */
export function levelOf(level: string | null | undefined): SignalLevel {
  const key = (level || "").toLowerCase();
  return (LEVEL_ORDER as string[]).includes(key) || key === "inconclusive"
    ? (key as SignalLevel)
    : "inconclusive";
}

export function levelLabel(level: SignalLevel): string {
  return LEVEL_LABEL[level];
}

export function levelTreatment(level: SignalLevel): UiTreatment {
  return LEVEL_TREATMENT[level];
}

/**
 * The band shown on screen, merged down from the six API levels.
 *
 *   none      ->  NORMAL
 *   low       ->  NORMAL
 *   consider  ->  LOW
 *   moderate  ->  MODERATE
 *   elevated  ->  ELEVATED
 *
 * This merge has a useful property: it lands exactly on the API's own `flagged`
 * boundary. none and low are the two levels the API does not flag, and they are
 * the two that become NORMAL, so NORMAL means unflagged and every other band
 * means flagged. Nothing has to be explained twice.
 *
 * Note the deliberate rename: the level the docs call `consider` displays as
 * LOW. That is a display choice, not a reinterpretation - the underlying level
 * is unchanged and still what everything is derived from.
 *
 * inconclusive stays outside the scale. It describes the recording, not a
 * position on it.
 */
export type DisplayBand = "NORMAL" | "LOW" | "MODERATE" | "ELEVATED" | "INCONCLUSIVE";

/**
 * The merge, then the naming.
 *
 *   none, low  ->  NORMAL     not flagged
 *   consider   ->  LOW        flagged
 *   moderate   ->  MODERATE   flagged
 *   elevated   ->  ELEVATED   flagged
 *
 * The merge lands exactly on the API's `flagged` boundary: NORMAL is precisely
 * the two levels the API does not flag, so NORMAL means unflagged and every
 * other band means flagged, with nothing to explain twice.
 *
 * One deliberate rename: the level the docs call `consider` displays as LOW.
 * That is a display choice, not a reinterpretation, and the underlying level is
 * still the only thing any band is derived from. levelLabel() below returns the
 * documented wording and is what a staff-facing view should use.
 */
const LEVEL_TO_BAND: Record<SignalLevel, DisplayBand> = {
  none: "NORMAL",
  low: "NORMAL",
  consider: "LOW",
  moderate: "MODERATE",
  elevated: "ELEVATED",
  inconclusive: "INCONCLUSIVE",
};

/** The four graded bands, in order. */
export const BAND_ORDER: DisplayBand[] = ["NORMAL", "LOW", "MODERATE", "ELEVATED"];

export function bandOf(level: SignalLevel): DisplayBand {
  return LEVEL_TO_BAND[level];
}

export function bandOfLevel(level: string | null | undefined): DisplayBand {
  return bandOf(levelOf(level));
}

export function bandRank(band: DisplayBand): number {
  return BAND_ORDER.indexOf(band);
}

/**
 * Four distinct colours rather than the docs' treatment grouping.
 *
 * The docs give consider and moderate a shared "Caution" treatment, but this
 * scale shows them as separate bands (LOW and MODERATE), so a shared colour
 * would make two named bands look identical. Brand palette, both grounds, every
 * light value measured above 4.5:1 against the beige page.
 */
const BAND_COLOR: Record<DisplayBand, { dark: string; light: string }> = {
  NORMAL: { dark: "#4CAF6E", light: "#1E5631" },
  LOW: { dark: "#F5EF79", light: "#6D5200" },
  MODERATE: { dark: "#FFC163", light: "#8A3B08" },
  ELEVATED: { dark: "#FF6173", light: "#8E1220" },
  INCONCLUSIVE: { dark: "#CECECE", light: "#565656" },
};

/**
 * Signs that only ever display as flagged at the top of the scale.
 *
 * head-impact is the case: a head trauma reading is a serious claim, so it is
 * shown as ELEVATED or not at all. Anything below that displays NORMAL.
 *
 * INCONCLUSIVE is never rewritten to NORMAL. Unreadable audio is not evidence
 * that nothing was found, and claiming otherwise would be the one genuinely
 * misleading outcome here.
 */
const FLAG_ONLY_WHEN_ELEVATED = new Set(["head-impact"]);

/**
 * The band to display for a given sign, applying any per-sign override.
 *
 * Use this rather than bandOfLevel anywhere a band reaches a screen, a count or
 * the grade. Applying the override in only some of those places is what would
 * produce a row reading NORMAL while the header counted it as a flag.
 */
export function bandForSignal(
  name: string | null | undefined,
  level: string | null | undefined
): DisplayBand {
  const band = bandOfLevel(level);
  if (band === "INCONCLUSIVE") return band;
  if (FLAG_ONLY_WHEN_ELEVATED.has((name || "").toLowerCase())) {
    return band === "ELEVATED" ? "ELEVATED" : "NORMAL";
  }
  return band;
}

/**
 * The word shown for a band on a given sign.
 *
 * head-impact reads NONE rather than NORMAL where it is gated: "no impact
 * detected" is the plain statement, and NORMAL invites the reading that a
 * normal amount of head trauma was found.
 *
 * The band itself stays NORMAL, so the flag count, the grade and the sentence
 * are unaffected. Only the label differs.
 */
const NONE_INSTEAD_OF_NORMAL = new Set(["head-impact"]);

export function bandLabelForSignal(
  name: string | null | undefined,
  band: DisplayBand
): string {
  if (band === "NORMAL" && NONE_INSTEAD_OF_NORMAL.has((name || "").toLowerCase())) {
    return "NONE";
  }
  return band;
}

/** True when a displayed band counts as a flag. NORMAL is the only one that does not. */
/**
 * The lowest band at which a sign is treated as flagged, as a display word.
 *
 * LOW for every sign, since the API sets `flagged` from `consider` up and
 * `consider` displays as LOW. Signs held back by an override flag only at the
 * band the override allows, so the card can state its own threshold instead of
 * the reader inferring one rule for all seven rows.
 */
export function flaggingThresholdBand(name: string | null | undefined): DisplayBand {
  return FLAG_ONLY_WHEN_ELEVATED.has((name || "").toLowerCase()) ? "ELEVATED" : "LOW";
}

/** "Flags at LOW and above", or "Flags at ELEVATED" where that is the only flagging band. */
export function flaggingThresholdText(name: string | null | undefined): string {
  const band = flaggingThresholdBand(name);
  return band === "ELEVATED" ? "Flags at ELEVATED" : `Flags at ${band} and above`;
}

export function isFlaggedBand(band: DisplayBand): boolean {
  return band === "LOW" || band === "MODERATE" || band === "ELEVATED";
}

export function bandColor(band: DisplayBand, surface: Surface = "dark"): string {
  return BAND_COLOR[band][surface];
}

/** The four graded bands as a scale, for OptionScale. */
export function bandScaleOptions(): Array<{
  key: DisplayBand;
  label: string;
  color: string;
  colorLight: string;
}> {
  return BAND_ORDER.map((band) => ({
    key: band,
    label: band,
    color: bandColor(band, "dark"),
    colorLight: bandColor(band, "light"),
  }));
}

export function levelColor(level: SignalLevel, surface: Surface = "dark"): string {
  return TREATMENT_COLOR[LEVEL_TREATMENT[level]][surface];
}

/** Rank for sorting. inconclusive sorts below every graded level. */
export function levelRank(level: SignalLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

/** True when the API would set flagged: consider, moderate or elevated. */
export function isFlaggedLevel(level: SignalLevel): boolean {
  return level === "consider" || level === "moderate" || level === "elevated";
}

/**
 * The five graded levels as a scale, in the documented order, for OptionScale.
 * inconclusive is absent: it describes the recording, not a position on the
 * scale, so an unreadable signal lights nothing.
 */
export function levelScaleOptions(): Array<{
  key: SignalLevel;
  label: string;
  color: string;
  colorLight: string;
}> {
  return LEVEL_ORDER.map((level) => ({
    key: level,
    label: LEVEL_LABEL[level],
    color: levelColor(level, "dark"),
    colorLight: levelColor(level, "light"),
  }));
}

export type ResultAction = "none" | "monitor" | "consider" | "review" | "escalate" | "inconclusive";

/**
 * The API's recommended_action, passed through rather than collapsed.
 *
 * It is derived server-side from the full distribution of signal levels, per a
 * documented table (1+ elevated always wins). Reimplementing or collapsing it
 * here would let this drift from the vendor's logic, so the value is only
 * normalised.
 */
const ACTIONS: ResultAction[] = ["none", "monitor", "consider", "review", "escalate", "inconclusive"];

export function actionOf(action: string | null | undefined): ResultAction {
  const key = (action || "").toLowerCase();
  return ACTIONS.includes(key as ResultAction) ? (key as ResultAction) : "inconclusive";
}

/** Documented meaning of each action, for display next to the result. */
const ACTION_LABEL: Record<ResultAction, string> = {
  none: "No action warranted",
  monitor: "Routine follow-up",
  consider: "Clinician discretion",
  review: "Clinical follow-up recommended",
  escalate: "Prompt clinical escalation",
  inconclusive: "Collect a new sample",
};

export function actionLabel(action: ResultAction): string {
  return ACTION_LABEL[action];
}
