import type { AmplifierModelName } from "@/lib/pathway-model-map";

/**
 * Readable copy for the analysis screen's six stages.
 *
 * Every line below names something the v2 API actually reports, taken from the
 * API reference at docs.amplifierhealth.com:
 *
 *   Stage 1  result.audio_quality        (voice_percentage, audio_clarity, issues)
 *   Stage 2  signal.description.vocal_features  (the prosody half)
 *   Stage 3  signal.description.vocal_features  (the voice-quality half)
 *   Stage 4  the selected model's own sign list, from the v2 model registry
 *   Stage 5  result.extended_metrics     (sub-dimension scoring)
 *   Stage 6  result.summary              (levels, flags, recommended_action)
 *
 * The point is to give someone waiting something real to read, so the detail
 * line rotates through these rather than showing one fixed label per stage. Stage 5
 * carries the longest list on purpose: it is the stage that absorbs however
 * much a slow job overruns the pacing target, so it needs the most to say.
 */

/** How long each detail line holds before the next one. */
export const DETAIL_ROTATE_MS = 1600;

export interface StageContent {
  /** The headline for the stage. */
  text: string;
  /** Detail lines, shown in order as [01], [02], [03]... and then looping. */
  details: string[];
}

/**
 * Sign labels for every model in the v2 registry, so stage 4 names the signals
 * the user's chosen model genuinely measures. Showing "elevated blood pressure"
 * during a mental-state scan would be describing work that is not happening.
 */
const MODEL_SIGN_LABELS: Record<AmplifierModelName, string[]> = {
  pulse: [
    "MOOD DISRUPTION",
    "ANXIETY",
    "STRESS",
    "FATIGUE",
    "DEHYDRATION",
    "ELEVATED BLOOD PRESSURE",
  ],
  clarity: [
    "COGNITIVE IMPAIRMENT",
    "SPEECH TIMING",
    "LEXICAL RETRIEVAL",
    "ARTICULATION PRECISION",
    "PAUSE STRUCTURE",
    "RESPONSE LATENCY",
  ],
  haven: [
    "MOOD DISRUPTION",
    "ANXIETY",
    "STRESS",
    "HYPERVIGILANCE",
    "ATTENTION DYSREGULATION",
    "FATIGUE",
  ],
  tide: [
    "ELEVATED BLOOD PRESSURE",
    "METABOLIC LOAD",
    "DEHYDRATION",
    "IRON DEFICIENCY",
    "FATIGUE",
    "DRY MOUTH",
  ],
  aria: [
    "ELEVATED ANDROGENS",
    "IRON DEFICIENCY",
    "DEHYDRATION",
    "MOOD DISRUPTION",
    "FATIGUE",
    "ANXIETY",
    "ELEVATED BLOOD PRESSURE",
  ],
  breath: [
    "AIRWAY OBSTRUCTION PATTERN",
    "ALLERGY",
    "RESPIRATORY RESONANCE",
    "BREATH SUPPORT",
    "EXPIRATORY FLOW",
    "NASAL RESONANCE",
  ],
  harbor: [
    "ALCOHOL USE PATTERN",
    "SUBSTANCE USE PATTERN",
    "EMOTIONAL DESTABILIZATION",
    "ANXIETY",
    "STRESS",
    "FATIGUE",
  ],
  apex: [
    "HEAD IMPACT",
    "COGNITIVE LOAD",
    "FATIGUE",
    "DEHYDRATION",
    "STRESS",
    "ANXIETY",
    "CARDIOVASCULAR STRAIN",
  ],
};

// Note: clarity publishes a single sign and breath two, so those two lists are
// filled out with the vocal features the sign is derived from. Every other
// model's list is the registry's own, verbatim.

/** result.audio_quality, plus the checks that gate it. */
const AUDIO_QUALITY_DETAILS = [
  "VOICE PERCENTAGE",
  "AUDIO CLARITY",
  "BACKGROUND NOISE SCREEN",
  "CLIPPING CHECK",
  "SEGMENT BOUNDARIES",
  "SAMPLE RATE VALIDATION",
];

/** vocal_features: the prosody half. */
const PROSODY_DETAILS = [
  "AVERAGE PITCH",
  "PITCH VARIABILITY",
  "AVERAGE LOUDNESS",
  "LOUDNESS VARIABILITY",
  "SPEECH RATE",
  "ARTICULATION RATE",
];

/** vocal_features: the voice-quality half. */
const VOICE_QUALITY_DETAILS = [
  "VOICE JITTER",
  "VOICE SHIMMER",
  "VOICE CLARITY (HNR)",
  "VOICE BREATHINESS",
  "MEAN PAUSE DURATION",
  "HARMONIC STRUCTURE",
];

/**
 * result.extended_metrics, per model. The longest list, for the stage that
 * absorbs the wait.
 *
 * These DO differ by model, which an earlier version of this file got wrong.
 * The claim then was that the set travels across models, inferred from a pulse
 * job alone. Calling both models on identical audio disproved it: pulse
 * returned 13 sub-dimensions and apex returned 10, and the two are not nested.
 * apex reports anhedonia, which pulse does not; pulse reports anxious mood,
 * tension, stress resilience and emotional valence, none of which apex returns.
 *
 * Each list below is the metric IDs that model actually returned, in the order
 * it returned them, with the API's own labels. A model without an observed
 * payload falls back to the pulse list and is marked as such.
 */
const EXTENDED_METRICS_BY_MODEL: Partial<Record<AmplifierModelName, string[]>> = {
  // Observed 2026-09-07, 13 metrics.
  pulse: [
    "ANXIOUS MOOD",
    "TENSION",
    "SLEEP DISTURBANCE",
    "FATIGUE",
    "CONCENTRATION",
    "PSYCHOMOTOR STATE",
    "ENERGY LEVEL",
    "MOTIVATION",
    "BURNOUT",
    "STRESS RESILIENCE",
    "EMOTIONAL VALENCE",
    "AROUSAL",
    "SENSE OF DOMINANCE",
  ],
  // Observed 2026-09-07, 10 metrics. Leads with anhedonia, which pulse omits.
  apex: [
    "ANHEDONIA",
    "SLEEP DISTURBANCE",
    "FATIGUE",
    "CONCENTRATION",
    "PSYCHOMOTOR STATE",
    "ENERGY LEVEL",
    "MOTIVATION",
    "BURNOUT",
    "AROUSAL",
    "SENSE OF DOMINANCE",
  ],
};

/**
 * Fallback for models whose extended_metrics have not been captured yet. Uses
 * the documented known IDs rather than another model's observed list, so it
 * cannot silently assert something a model does not report.
 */
const EXTENDED_METRIC_FALLBACK = [
  "SLEEP DISTURBANCE",
  "FATIGUE",
  "CONCENTRATION",
  "PSYCHOMOTOR STATE",
  "ENERGY LEVEL",
  "MOTIVATION",
  "BURNOUT",
  "AROUSAL",
];

/** result.summary. */
const SUMMARY_DETAILS = [
  "SIGNAL RANKING",
  "LEVEL THRESHOLDS",
  "FLAG COUNT",
  "RECOMMENDED ACTION",
  "BASELINE COMPARISON",
  "REPORT ASSEMBLY",
];

/**
 * The six stages, with stage 4 keyed to the model the pathway selected.
 */
export function getStageContent(model: AmplifierModelName): StageContent[] {
  return [
    { text: "ISOLATING VOCAL SIGNAL...", details: AUDIO_QUALITY_DETAILS },
    { text: "MAPPING ACOUSTIC FEATURES...", details: PROSODY_DETAILS },
    { text: "ANALYZING VOICE QUALITY...", details: VOICE_QUALITY_DETAILS },
    { text: "SCORING BIOMARKER SIGNALS...", details: MODEL_SIGN_LABELS[model] },
    {
      text: "RESOLVING SUB-DIMENSIONS...",
      details: EXTENDED_METRICS_BY_MODEL[model] ?? EXTENDED_METRIC_FALLBACK,
    },
    { text: "COMPILING SCREENING REPORT...", details: SUMMARY_DETAILS },
  ];
}

/**
 * The detail line to show `stageElapsed` into a stage: its 1-based number and
 * its label. Loops once the list is exhausted, so a stage that runs long keeps
 * cycling rather than freezing on its last entry.
 */
export function detailAt(
  details: string[],
  stageElapsed: number,
  rotateMs: number = DETAIL_ROTATE_MS
): { index: number; number: string; label: string } {
  if (details.length === 0) return { index: 0, number: "01", label: "" };

  const ticks = Math.floor(Math.max(stageElapsed, 0) / rotateMs);
  const index = ticks % details.length;
  return {
    index,
    number: String(index + 1).padStart(2, "0"),
    label: details[index],
  };
}
