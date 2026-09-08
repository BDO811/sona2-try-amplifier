import { isFlaggedLevel, levelOf } from "@/lib/signal-band";

/**
 * The headline above the results, graded from the signals themselves.
 *
 * The brief was to lead with the positive: as long as a couple of signals are
 * doing well, say so rather than leading with what is wrong. Every rung below
 * is written to be constructive, so there is no outcome that reads as a verdict
 * against the user.
 *
 * Two signals reading well lands on the "good" rung regardless of how high the
 * rest went, which is the brief. What that rung will not do is claim the whole
 * picture is optimal: on a real apex run two signals sat at LOW while five were
 * flagged, two of those at HIGH, with the API returning recommended_action
 * "review". So the good rung names a strong foundation, which stays true
 * printed above flagged rows, and OPTIMAL FUNCTION is kept for a clean result.
 *
 * Wording is separate from grading. RUNG_SCALE holds the label in use per rung
 * and RUNG_LABEL_VARIANTS the approved alternates, so changing a word needs no
 * change to how a result is graded.
 */

/** How many signals must be reading well before the headline leans positive. */
export const STRONG_SIGNAL_FLOOR = 2;

/** A signal the API would not flag: none or low. */
function isStrong(level: string): boolean {
  return !isFlaggedLevel(levelOf(level));
}

export type HeadlineRung = "clean" | "good" | "steady" | "focus" | "unreadable";

/**
 * Which rung a result lands on. Separated from the wording so the vocabulary
 * can be swapped without touching the grading.
 */
export function rungFor({ levels }: { levels: string[] }): HeadlineRung {
  const readable = levels.map(levelOf).filter((l) => l !== "inconclusive");

  // Nothing readable: the recapture card carries this state, but the headline
  // must not imply a finding either way.
  if (readable.length === 0) return "unreadable";

  const strong = readable.filter(isStrong).length;
  const flagged = readable.length - strong;

  if (flagged === 0) return "clean";
  // The brief: two signals reading well is a good outcome, even with others
  // flagged. Note this rung is reached regardless of how high the rest went,
  // so its wording must stay true when it sits above flagged rows — which is
  // why it names a strong foundation rather than an optimal whole.
  if (strong >= STRONG_SIGNAL_FLOOR) return "good";
  if (strong === 1) return "steady";
  return "focus";
}

/**
 * Approved alternates for the scale labels, strongest first within each rung.
 *
 * These were originally full phrases for a headline that sat under the scale
 * and repeated its grade in words. That line now names the subject only, so the
 * rung word in RUNG_SCALE below is the single place a grade is stated, and
 * these are the swap-in options for it.
 *
 * All are informational rather than diagnostic, and none carries a risk
 * verdict. OPTIMAL and PEAK are constrained by test to the clean rung.
 */
export const RUNG_LABEL_VARIANTS: Record<HeadlineRung, string[]> = {
  clean: ["OPTIMAL", "PEAK", "EXEMPLARY", "READY"],
  good: ["STRONG", "SOLID", "FAVORABLE", "RESILIENT", "WELL-REGULATED", "SOUND"],
  steady: ["STEADY", "MEASURED", "HOLDING", "PRESENT"],
  focus: ["NEEDS IMPROVEMENT", "IN TRANSITION", "UNDER OBSERVATION", "MONITORING"],
  unreadable: ["INCONCLUSIVE", "UNREADABLE", "INCOMPLETE"],
};

/**
 * The four gradeable rungs as a scale, strongest first, for OptionScale.
 * "unreadable" is not on the scale for the same reason INCONCLUSIVE is not a
 * band: it describes the recording, not the result.
 *
 * Colour carries good versus caution, not ordinality — left to right already
 * does that. Clean and good share a green because both are good outcomes, and
 * inventing a gradient between them would imply a gap the grading never makes.
 */
export const RUNG_SCALE: Array<{
  key: HeadlineRung;
  label: string;
  color: string;
  colorLight: string;
}> = [
  { key: "clean", label: "OPTIMAL", color: "#4CAF6E", colorLight: "#1E5631" },
  { key: "good", label: "STRONG", color: "#4CAF6E", colorLight: "#1E5631" },
  { key: "steady", label: "STEADY", color: "#F5EF79", colorLight: "#6D5200" },
  { key: "focus", label: "NEEDS IMPROVEMENT", color: "#FFC163", colorLight: "#8A3B08" },
];
