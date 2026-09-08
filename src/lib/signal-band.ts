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
