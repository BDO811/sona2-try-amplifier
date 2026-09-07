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
 * result.extended_metrics. The longest list, for the stage that absorbs the
 * wait.
 *
 * Ordered by confidence. The first thirteen are the metrics a real captured
 * pulse job returned (see fixtures-v2-pulse-response.json), with the API's own
 * labels; the rest are documented known metric IDs that job did not include.
 * Reading order therefore starts with what the API demonstrably reports.
 *
 * These are not split per model: pulse is a general wellness pipeline and still
 * returns the behavioural sub-dimensions, so the set travels across models.
 */
const EXTENDED_METRIC_DETAILS = [
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
  "WORRY & RUMINATION",
  "OVERWHELM",
  "RESTLESSNESS & AGITATION",
  "IRRITABILITY",
  "APPREHENSION & FEAR",
  "SENSE OF CONTROL",
  "OUTLOOK",
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
    { text: "RESOLVING SUB-DIMENSIONS...", details: EXTENDED_METRIC_DETAILS },
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
