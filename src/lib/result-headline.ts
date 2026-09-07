import { bandForLevel, bandRank, type SignalBand } from "@/lib/signal-band";

/**
 * The headline above the results, graded from the signals themselves.
 *
 * The brief was to lead with the positive: as long as a couple of signals are
 * doing well, say so rather than leading with what is wrong. Every rung below
 * is written to be constructive, so there is no outcome that reads as a verdict
 * against the user.
 *
 * What the ladder will not do is claim OPTIMAL FUNCTION while signals are
 * flagged high. On a real apex run, two signals sat at NONE/LOW while five were
 * flagged and two of those reached HIGH, with the API returning
 * recommended_action "review". A headline reading OPTIMAL ATHLETIC FUNCTION
 * would have printed directly above those five rows and contradicted them on
 * the same screen. So OPTIMAL is reserved for a genuinely clean result, and the
 * rungs beneath it stay warm without overclaiming: RESILIENT, STRONG, STEADY.
 *
 * To make OPTIMAL fire on the looser "two signals doing well" rule regardless
 * of what else is flagged, move the OPTIMAL_FUNCTION return into the
 * `strong >= STRONG_SIGNAL_FLOOR` branch below. That is the whole change.
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

/** HIGH or VERY HIGH — the levels that make an OPTIMAL claim indefensible. */
function isHigh(band: SignalBand): boolean {
  return bandRank(band) >= bandRank("HIGH");
}

export function headlineFor({ name, levels }: HeadlineInput): string {
  const bands = levels.map(bandForLevel);
  const readable = bands.filter((b) => b !== "INCONCLUSIVE");

  // Nothing readable: the recapture card carries this state, but the headline
  // must not imply a finding either way.
  if (readable.length === 0) return `${name} ASSESSMENT INCONCLUSIVE`;

  const strong = readable.filter(isStrong).length;
  const high = readable.filter(isHigh).length;
  const flagged = readable.length - strong;

  // Genuinely clean: nothing flagged at all.
  if (flagged === 0) return `OPTIMAL ${name} FUNCTION`;

  // Several signals reading well and nothing has reached HIGH.
  if (high === 0 && strong >= STRONG_SIGNAL_FLOOR) return `STRONG ${name} FOUNDATION`;

  // The brief's case: a couple of signals holding up even though others are
  // flagged. Warm, and true — a resilient baseline is not a claim that
  // everything is optimal.
  if (strong >= STRONG_SIGNAL_FLOOR) return `RESILIENT ${name} BASELINE`;

  // One signal holding.
  if (strong === 1) return `STEADY ${name} BASELINE`;

  // Nothing reading clean. Still framed as something to work with.
  return `${name} PROFILE IN FOCUS`;
}

/**
 * The graded vocabulary, strongest first. Kept here so the ladder above and any
 * copy review read from the same list.
 */
export const HEADLINE_LADDER = [
  { rung: "clean", template: "OPTIMAL {NAME} FUNCTION", when: "nothing flagged" },
  {
    rung: "mostly clean",
    template: "STRONG {NAME} FOUNDATION",
    when: `nothing at HIGH and ${STRONG_SIGNAL_FLOOR}+ reading well`,
  },
  {
    rung: "mixed, holding",
    template: "RESILIENT {NAME} BASELINE",
    when: `${STRONG_SIGNAL_FLOOR}+ reading well alongside flagged signals`,
  },
  { rung: "one holding", template: "STEADY {NAME} BASELINE", when: "exactly one reading well" },
  { rung: "none clean", template: "{NAME} PROFILE IN FOCUS", when: "nothing reading well" },
  {
    rung: "unreadable",
    template: "{NAME} ASSESSMENT INCONCLUSIVE",
    when: "no readable signals",
  },
] as const;
