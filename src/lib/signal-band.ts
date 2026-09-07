/**
 * Turning a v2 signal's level into the band shown on the results screen.
 *
 * The API reports six levels: none, low, consider, moderate, elevated and
 * inconclusive. Those words are precise but they do not read as a scale — a row
 * saying "consider" next to one saying "moderate" gives no sense of which is
 * worse, and five flagged signals all reading "consider" looked like the screen
 * had failed to distinguish them.
 *
 * Bands are derived from `level`, never from `score`. That distinction matters:
 * the API documents level thresholds as "model-dependent; not a simple cutoff
 * on score alone", and a real apex run bears it out — cognitive load scored
 * 0.120 and came back "consider" (flagged) while head impact scored 0.144 and
 * came back "low" (not flagged). Banding the raw score would have labelled the
 * flagged signal Low and the unflagged one higher, overriding the model's own
 * per-sign calibration with a number that does not mean the same thing from one
 * sign to the next.
 */

export type SignalBand = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH" | "INCONCLUSIVE";

/**
 * The API's level vocabulary, mapped one-to-one. `none` stays its own band
 * rather than folding into LOW: the API means "no signal detected" by it, which
 * is a different statement from a weak signal.
 */
const LEVEL_TO_BAND: Record<string, SignalBand> = {
  none: "NONE",
  low: "LOW",
  consider: "MEDIUM",
  moderate: "HIGH",
  elevated: "VERY HIGH",
  inconclusive: "INCONCLUSIVE",
};

/**
 * How full the strength bar is drawn for each band, 0-100.
 *
 * The bar used to be the raw score while the word came from the level, so the
 * two could disagree — a shorter bar could carry a higher level. Driving both
 * from the band means they can never contradict each other.
 */
const BAND_FILL: Record<SignalBand, number> = {
  NONE: 0,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  "VERY HIGH": 100,
  INCONCLUSIVE: 0,
};

/**
 * Brand palette only, and all legible on the dark signal panel. Escalates
 * tan → green → yellow → orange → red. No lime, ever.
 */
const BAND_COLOR: Record<SignalBand, string> = {
  NONE: "#B79862",
  LOW: "#4CAF6E",
  MEDIUM: "#F5EF79",
  HIGH: "#FFC163",
  "VERY HIGH": "#FF6173",
  INCONCLUSIVE: "#CECECE",
};

/** Severity order, for ranking and for tests that assert the scale is monotonic. */
export const BAND_ORDER: SignalBand[] = ["NONE", "LOW", "MEDIUM", "HIGH", "VERY HIGH"];

/**
 * Band for an API level. An unrecognised or missing level reads INCONCLUSIVE
 * rather than NONE: if a future model adds a level this build has not seen,
 * saying "we could not read this" is honest, while saying "no signal detected"
 * would be a claim the data does not support.
 */
export function bandForLevel(level: string | null | undefined): SignalBand {
  return LEVEL_TO_BAND[(level || "").toLowerCase()] ?? "INCONCLUSIVE";
}

export function bandFill(band: SignalBand): number {
  return BAND_FILL[band];
}

export function bandColor(band: SignalBand): string {
  return BAND_COLOR[band];
}

/** Rank for sorting. Bands outside the severity scale sort to the bottom. */
export function bandRank(band: SignalBand): number {
  const index = BAND_ORDER.indexOf(band);
  return index === -1 ? -1 : index;
}

export type ResultAction = "NONE" | "MONITOR" | "ESCALATE" | "INCONCLUSIVE";

/**
 * Collapse the API's recommended_action to the three this screen reports.
 *
 * The API computes recommended_action itself across the whole signal set, using
 * a documented table: nothing at low or above -> none; 1+ low -> monitor;
 * 1+ consider -> consider; 1+ moderate or 2+ consider -> review; 1+ elevated ->
 * escalate, which takes precedence over everything else. That derivation is not
 * repeated here — the API's value is read and collapsed, so this cannot drift
 * from the vendor's logic if the table changes.
 *
 * consider and review both fold into MONITOR. review losing its distinct
 * meaning is the real cost of collapsing five values into three.
 *
 * inconclusive stays separate rather than folding into NONE: it means the audio
 * could not be read, which is not the same as nothing being found.
 */
const ACTION_COLLAPSE: Record<string, ResultAction> = {
  none: "NONE",
  monitor: "MONITOR",
  consider: "MONITOR",
  review: "MONITOR",
  escalate: "ESCALATE",
  inconclusive: "INCONCLUSIVE",
};

export function collapseAction(apiAction: string | null | undefined): ResultAction {
  return ACTION_COLLAPSE[(apiAction || "").toLowerCase()] ?? "INCONCLUSIVE";
}
