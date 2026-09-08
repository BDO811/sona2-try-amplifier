import { bandForLevel, type SignalBand } from "@/lib/signal-band";

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
 * Wording is separate from grading. HEADLINE_COPY holds the line in use per
 * rung; HEADLINE_VARIANTS holds the approved alternatives. Swapping copy is a
 * one-line edit and needs no change to how a result is graded.
 */

/** How many signals must be reading well before the headline leans positive. */
export const STRONG_SIGNAL_FLOOR = 2;

export interface HeadlineInput {
  /** Domain word, already uppercased: ATHLETIC, WELLNESS, COGNITIVE... */
  name: string;
  /** Raw API level per signal, in any order. */
  levels: string[];
}

/** A signal at NONE or LOW is not flagged and is reading well. */
function isStrong(band: SignalBand): boolean {
  return band === "NONE" || band === "LOW";
}

export type HeadlineRung = "clean" | "good" | "steady" | "focus" | "unreadable";

/**
 * Which rung a result lands on. Separated from the wording so the vocabulary
 * can be swapped without touching the grading.
 */
export function rungFor({ levels }: { levels: string[] }): HeadlineRung {
  const readable = levels.map(bandForLevel).filter((b) => b !== "INCONCLUSIVE");

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

/** The wording in use per rung. Swap from HEADLINE_VARIANTS below. */
export const HEADLINE_COPY: Record<HeadlineRung, string> = {
  clean: "OPTIMAL {NAME} FUNCTION",
  good: "STRONG {NAME} FOUNDATION",
  steady: "STEADY {NAME} BASELINE",
  focus: "{NAME} PROFILE IN FOCUS",
  unreadable: "{NAME} ASSESSMENT INCONCLUSIVE",
};

/**
 * Approved alternatives per rung, strongest first within each. Any of these can
 * be dropped into HEADLINE_COPY above; all are informational rather than
 * diagnostic, and none carries a risk verdict.
 */
export const HEADLINE_VARIANTS: Record<HeadlineRung, string[]> = {
  clean: [
    "OPTIMAL {NAME} FUNCTION",
    "PEAK {NAME} CONDITION",
    "EXEMPLARY {NAME} PROFILE",
    "{NAME} READINESS CONFIRMED",
    "{NAME} FUNCTION OPTIMAL",
  ],
  good: [
    "STRONG {NAME} FOUNDATION",
    "SOLID {NAME} FOUNDATION",
    "FAVORABLE {NAME} PROFILE",
    "RESILIENT {NAME} BASELINE",
    "WELL-REGULATED {NAME} PROFILE",
    "SOUND {NAME} CONDITIONING",
    "{NAME} CAPACITY INTACT",
    "{NAME} RESILIENCE CONFIRMED",
  ],
  steady: [
    "STEADY {NAME} BASELINE",
    "MEASURED {NAME} PROFILE",
    "{NAME} BASELINE HOLDING",
    "{NAME} FOUNDATION PRESENT",
  ],
  focus: [
    "{NAME} PROFILE IN FOCUS",
    "{NAME} PROFILE IN TRANSITION",
    "ACTIVE {NAME} MONITORING",
    "{NAME} PROFILE UNDER OBSERVATION",
  ],
  unreadable: [
    "{NAME} ASSESSMENT INCONCLUSIVE",
    "{NAME} SIGNALS UNREADABLE",
    "{NAME} ASSESSMENT INCOMPLETE",
  ],
};

export function headlineFor({ name, levels }: HeadlineInput): string {
  return HEADLINE_COPY[rungFor({ levels })].replace("{NAME}", name);
}

/**
 * The four gradeable rungs as a scale, strongest first, for OptionScale.
 * "unreadable" is not on the scale for the same reason INCONCLUSIVE is not a
 * band: it describes the recording, not the result.
 *
 * Colour carries good versus caution, not ordinality — left to right already
 * does that. Clean and good share a green because both are good outcomes, and
 * inventing a gradient between them would imply a gap the grading never makes.
 */
export const RUNG_SCALE: Array<{ key: HeadlineRung; label: string; color: string }> = [
  { key: "clean", label: "OPTIMAL", color: "#4CAF6E" },
  { key: "good", label: "STRONG", color: "#4CAF6E" },
  { key: "steady", label: "STEADY", color: "#F5EF79" },
  { key: "focus", label: "IN FOCUS", color: "#FFC163" },
];
