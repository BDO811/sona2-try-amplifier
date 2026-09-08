/**
 * ============================================================================
 * AMPLIFIER V2 API → VISUAL MAPPING
 * ============================================================================
 *
 * The legacy L5 v1 API (`/api/v1/{type}/analyze-audio-sync`) returned
 * `result.explanations.feature_explanations.features` — a z-score table that
 * `cognitive-api-visual-mapping.ts` knows how to render.
 *
 * The v2 API (`/v2/models/{model}/analyze` → `/v2/jobs/{id}`) returns a
 * completely different, richer shape:
 *
 *   result.signals[]         one entry per sign the model measures
 *                            { name, label, score 0-1, level, flagged }
 *   result.summary           { overall_level, recommended_action, flagged_count,
 *                              primary_signals[], description: { summary,
 *                              vocal_features[] } }
 *   result.extended_metrics  bipolar sub-dimensions with score_mean/score_std
 *                            and low/high anchors (empty when voice % is low)
 *   result.audio_quality     { voice_percentage, audio_clarity, issues[] }
 *
 * Condition jobs return `result.signal` (singular) with no `summary`.
 *
 * This module maps that into the same `VisualizedResult` the report components
 * already render, so the v2 output shows the full biomarker panel, vocal-feature
 * lab grid and detailed report rather than a bare pass/fail.
 */

import { AssessmentPathway } from "@/context/AssessmentContext";
import { headlineFor, rungFor } from "@/lib/result-headline";
import {
  VisualizedResult,
  LabMetric,
  BiomarkerDefinition,
} from "@/lib/cognitive-api-visual-mapping";

// ============================================================================
// v2 response types
// ============================================================================

export interface V2Signal {
  name: string;
  label?: string;
  model_id?: string;
  score: number; // 0-1
  level: string; // none | low | consider | moderate | elevated | inconclusive
  flagged: boolean;
  recommended_action?: string;
  description?: {
    summary?: string;
    vocal_features?: V2VocalFeature[];
  };
}

export interface V2VocalFeature {
  feature: string;
  label: string;
  value: number;
  unit: string;
  value_interpretation: string;
}

export interface V2ExtendedMetric {
  metric_id: string;
  label: string;
  score_mean: number;
  score_std: number;
  low_anchor: string;
  high_anchor: string;
}

export interface V2AudioQuality {
  voice_percentage?: number;
  audio_clarity?: number;
  issues?: string[];
}

export interface V2Result {
  signals?: V2Signal[];
  signal?: V2Signal;
  extended_metrics?: V2ExtendedMetric[];
  audio_quality?: V2AudioQuality;
  summary?: {
    primary_signals?: string[];
    overall_level?: string;
    recommended_action?: string;
    flagged_count?: number;
    description?: {
      summary?: string;
      vocal_features?: V2VocalFeature[];
    };
  };
}

export interface V2JobDetail {
  job_id: string;
  status: string;
  created_at?: string | null;
  completed_at?: string | null;
  result?: V2Result | null;
  audio_duration_seconds?: number;
  audio_sample_rate?: number;
  model_name?: string;
  job_type?: string;
  api_version?: string;
}

/**
 * True when a job payload is a v2 response rather than a legacy v1 one.
 * v1 puts everything under `result.explanations`; v2 always carries at least
 * one of `signals` / `signal` / `audio_quality`.
 */
export function isV2Result(result: unknown): result is V2Result {
  if (!result || typeof result !== "object") return false;
  const r = result as Record<string, unknown>;
  return Array.isArray(r.signals) || !!r.signal || !!r.audio_quality;
}

// ============================================================================
// Sign reference copy
// ============================================================================

interface SignCopy {
  definition: string;
  context: string;
}

/**
 * Plain-language copy for every sign the v2 models can return. Keyed by the
 * external sign name (`signal.name`).
 */
const SIGN_COPY: Record<string, SignCopy> = {
  "mood-disruption": {
    definition:
      "A shift in the emotional colouring of speech: flatter melody, slower pacing and reduced dynamic range are the patterns most often associated with low mood.",
    context:
      "Mood shows up in voice before it shows up in what someone says. This signal reads prosody rather than content.",
  },
  anxiety: {
    definition:
      "Vocal markers of anticipatory arousal, typically faster and less regular speech, raised pitch and tighter breath support.",
    context:
      "Anxious speech tends to carry higher pitch variability and shorter, more frequent pauses than the same speaker's baseline.",
  },
  stress: {
    definition:
      "Acute load on the voice production system: increased muscular tension in the larynx measurably changes pitch and timing.",
    context:
      "This is a state measure, not a trait. It reflects the speaker at the moment of recording.",
  },
  fatigue: {
    definition:
      "Reduced vocal effort and stamina: lower loudness, softer onsets and a drift in pitch control across a sustained sample.",
    context:
      "Fatigue degrades the fine motor control of the vocal folds, which is why it is audible before it is reportable.",
  },
  dehydration: {
    definition:
      "Reduced mucosal lubrication of the vocal folds, which shows up as increased cycle-to-cycle irregularity and a drier, harsher timbre.",
    context:
      "Hydration state changes vocal fold viscosity directly, making it one of the more mechanically grounded voice signals.",
  },
  "elevated-blood-pressure": {
    definition:
      "Cardiovascular load expressed through voice: changes in phonation stability that track with vascular tone.",
    context:
      "A screening signal only. It does not replace a cuff measurement and is not a diagnosis.",
  },
  "cognitive-load": {
    definition:
      "The processing demand carried while speaking, read from pause structure, filled hesitations and articulation rate.",
    context: "Higher load lengthens planning pauses and slows articulation.",
  },
  "cognitive-impairment": {
    definition:
      "Patterns in timing, word-finding pauses and articulatory precision associated with reduced cognitive function.",
    context: "A screening signal intended to prompt formal assessment, not to substitute for one.",
  },
  "head-impact": {
    definition:
      "Motor-speech disruption consistent with recent head trauma: altered articulation timing and reduced pitch control.",
    context: "Designed for sideline and post-incident screening contexts.",
  },
  "cardiovascular-strain": {
    definition:
      "Respiratory and phonatory markers of cardiovascular effort, including breath-group length and loudness decay.",
    context: "Reflects exertional load at the time of the sample.",
  },
  "iron-deficiency": {
    definition:
      "Voice changes associated with reduced oxygen-carrying capacity, principally reduced vocal stamina and loudness.",
    context: "A screening signal that pairs with, rather than replaces, a serum ferritin test.",
  },
  "elevated-androgens": {
    definition:
      "Structural voice changes associated with androgen exposure, chiefly a lowered fundamental frequency.",
    context: "Reads slow, structural change rather than a same-day state.",
  },
  "metabolic-load": {
    definition:
      "Voice markers tracking metabolic stress, including changes in phonation stability and breath support.",
    context: "A composite signal rather than a single-analyte proxy.",
  },
  "dry-mouth": {
    definition:
      "Reduced oral lubrication, audible as increased friction noise and altered articulation of consonants.",
    context: "Commonly medication-related and often reversible.",
  },
  "airway-obstruction-pattern": {
    definition:
      "Respiratory markers consistent with restricted airflow: shortened breath groups and altered loudness contours.",
    context: "A screening signal for obstructive patterns, not a spirometry substitute.",
  },
  allergy: {
    definition:
      "Upper-airway inflammation expressed through changes in resonance and nasality.",
    context: "Tracks the inflammatory state at the time of the sample.",
  },
  "alcohol-use-pattern": {
    definition:
      "Motor-speech markers associated with alcohol exposure, including reduced articulatory precision and timing control.",
    context: "Reads pattern over time rather than a single-point intoxication level.",
  },
  "substance-use-pattern": {
    definition:
      "Speech-motor and prosodic markers associated with substance exposure.",
    context: "A pattern-level signal intended for longitudinal monitoring.",
  },
  "emotional-destabilization": {
    definition:
      "Volatility in the emotional contour of speech across a sample, rather than a single sustained state.",
    context: "Measures variance in affect, which is distinct from average mood.",
  },
  hypervigilance: {
    definition:
      "Sustained elevated arousal expressed through pitch, timing and breath patterns.",
    context: "Distinguished from anxiety by its persistence across the whole sample.",
  },
  "attention-dysregulation": {
    definition:
      "Irregular pacing and pause structure associated with unstable attentional control.",
    context: "Reads the rhythm of speech planning rather than its content.",
  },
};

const DEFAULT_SIGN_COPY: SignCopy = {
  definition:
    "A voice-derived signal produced by the Amplifier frontier voice model from acoustic properties of the sample.",
  context: "Screening output. Interpret alongside clinical context, not on its own.",
};

// ============================================================================
// Vocal feature reference ranges (from the v2 vocal-feature reference)
// ============================================================================

const FEATURE_REFERENCE: Record<string, string> = {
  pitch_mean: "85-255 Hz",
  pitch_variability: "0.05-0.25",
  loudness_mean: "-30 to -10 dB",
  loudness_variability: "0.30-0.80",
  speech_rate: "3.5-7.5 syl/s",
  articulation_rate: "4.0-8.0 syl/s",
  pause_duration_mean: "0.15-0.60 s",
  voice_jitter: "< 1.0 %",
  voice_shimmer: "< 3.8 dB",
  voice_clarity_hnr: "> 7 dB",
  voice_breathiness: "20-35 dB",
};

/** Short labels so the lab grid stays legible at its smallest type size. */
const FEATURE_SHORT_LABEL: Record<string, string> = {
  pitch_mean: "PITCH",
  pitch_variability: "PITCH VAR",
  loudness_mean: "LOUDNESS",
  loudness_variability: "LOUD VAR",
  speech_rate: "SPEECH RATE",
  articulation_rate: "ARTIC RATE",
  pause_duration_mean: "PAUSE",
  voice_jitter: "JITTER",
  voice_shimmer: "SHIMMER",
  voice_clarity_hnr: "HNR",
  voice_breathiness: "BREATHINESS",
};

// ============================================================================
// Level helpers
// ============================================================================

/** v2 `level` → the likelihood tier the report components already understand. */
export function v2LevelToLikelihoodTier(level: string | undefined): string {
  switch ((level || "").toLowerCase()) {
    case "none":
      return "NO_RISK";
    case "low":
      return "LOW";
    case "consider":
    case "moderate":
      return "MODERATE";
    case "elevated":
      return "HIGH";
    case "inconclusive":
      return "INCONCLUSIVE";
    default:
      return "INCONCLUSIVE";
  }
}

/**
 * Pseudo z-score used purely to drive the existing colour logic in
 * BiometricLabGrid / DetailedAnalysisView (< 2 green, < 3 amber, else red).
 * v2 does not publish z-scores, so this encodes severity, not standard
 * deviations, and is never surfaced as a number to the user.
 */
function levelToColorScore(level: string | undefined): number | undefined {
  switch ((level || "").toLowerCase()) {
    case "none":
      return 0.4;
    case "low":
      return 1.2;
    case "consider":
      return 2.2;
    case "moderate":
      return 2.6;
    case "elevated":
      return 3.4;
    default:
      return undefined;
  }
}

const LEVEL_RANK: Record<string, number> = {
  none: 0,
  low: 1,
  inconclusive: 1,
  consider: 2,
  moderate: 3,
  elevated: 4,
};

/** Highest-severity level across a set of signals. */
function worstLevel(signals: V2Signal[]): string | undefined {
  let worst: string | undefined;
  let worstRank = -1;
  for (const s of signals) {
    const rank = LEVEL_RANK[(s.level || "").toLowerCase()] ?? -1;
    if (rank > worstRank) {
      worstRank = rank;
      worst = s.level;
    }
  }
  return worst;
}

function formatFeatureValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  if (abs >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function interpretationToStatus(interpretation: string): "normal" | "elevated" | "low" {
  const i = (interpretation || "").toLowerCase();
  if (i.includes("within")) return "normal";
  if (i.includes("reduced") || i.includes("low")) return "low";
  return "elevated";
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ============================================================================
// Mappers
// ============================================================================

export function mapVocalFeaturesToLabMetrics(features: V2VocalFeature[]): LabMetric[] {
  return features.map((f) => {
    const status = interpretationToStatus(f.value_interpretation);
    return {
      label: FEATURE_SHORT_LABEL[f.feature] || f.label?.toUpperCase() || titleCase(f.feature),
      value: formatFeatureValue(f.value),
      unit: f.unit || "",
      reference: FEATURE_REFERENCE[f.feature] || f.value_interpretation || "—",
      status,
      // Vocal features are descriptive, not severity-graded — keep them out of
      // the red band so a merely "reduced" pause length does not read as alarming.
      zScore: status === "normal" ? 0.5 : 2.2,
    };
  });
}

export function mapSignalsToBiomarkers(signals: V2Signal[]): BiomarkerDefinition[] {
  return signals.map((s) => {
    const copy = SIGN_COPY[s.name] || DEFAULT_SIGN_COPY;
    const level = (s.level || "").toLowerCase();
    const pct = Number.isFinite(s.score) ? Math.round(s.score * 100) : 0;

    const clinicalContext = s.flagged
      ? `Flagged at ${level} level (${pct}% signal strength). ${copy.context}`
      : `Below the flagging threshold at ${level} level (${pct}% signal strength). ${copy.context}`;

    return {
      title: s.label || titleCase(s.name),
      technicalName: s.name,
      value: String(pct),
      unit: "%",
      definition: copy.definition,
      clinicalContext,
      normalRange: "Below flagging threshold",
      zScore: levelToColorScore(s.level),
    };
  });
}

/**
 * Transform a completed v2 job into the `VisualizedResult` the report
 * components render.
 */
export function transformV2ResultToVisualization(
  job: V2JobDetail,
  pathway: AssessmentPathway
): VisualizedResult {
  const result = job.result || {};

  // Condition jobs carry a single `signal`; model and use-case jobs carry `signals[]`.
  const signals: V2Signal[] = Array.isArray(result.signals)
    ? result.signals
    : result.signal
      ? [result.signal]
      : [];

  const summary = result.summary;
  const overallLevel = summary?.overall_level || worstLevel(signals);
  const likelihoodTier = v2LevelToLikelihoodTier(overallLevel);

  const audioQuality = result.audio_quality || {};
  const voicePercentage = audioQuality.voice_percentage;
  const audioClarity = audioQuality.audio_clarity;
  const issues = audioQuality.issues || [];

  // Vocal features live on the summary for model/use-case jobs and on the
  // signal itself for condition jobs.
  const vocalFeatures =
    summary?.description?.vocal_features ||
    result.signal?.description?.vocal_features ||
    signals[0]?.description?.vocal_features ||
    [];

  const labMetrics = mapVocalFeaturesToLabMetrics(vocalFeatures);
  // Most-severe signal first, so the reveal screen leads with what matters.
  const orderedSignals = [...signals].sort(
    (a, b) =>
      (LEVEL_RANK[(b.level || "").toLowerCase()] ?? -1) -
        (LEVEL_RANK[(a.level || "").toLowerCase()] ?? -1) || b.score - a.score
  );
  const biomarkers = mapSignalsToBiomarkers(orderedSignals);

  const flaggedCount = summary?.flagged_count ?? signals.filter((s) => s.flagged).length;

  const score = calculateWellnessScore(signals, likelihoodTier);
  // One source of levels for both the phrase and the scale, so the lit rung
  // and the wording can never disagree.
  const signalLevels = signals.map((s) => s.level || "");
  const classification = getV2Classification(likelihoodTier, pathway, signalLevels);
  const headlineRung = signalLevels.length > 0 ? rungFor({ levels: signalLevels }) : undefined;

  const clinicalSubtext =
    summary?.description?.summary ||
    result.signal?.description?.summary ||
    buildFallbackSubtext(orderedSignals, flaggedCount);

  const sampleRate = job.audio_sample_rate
    ? `${Math.round(job.audio_sample_rate / 1000)}kHz`
    : "48kHz";

  return {
    jobId: job.job_id,
    createdAt: job.created_at || job.completed_at || new Date().toISOString(),
    status: job.status,
    likelihoodTier,
    pathway: pathway || "WELLNESS",
    score,
    classification,
    headlineRung,
    labMetrics,
    biomarkers,
    extendedMetrics: result.extended_metrics || [],
    signals: orderedSignals.map((s) => ({
      name: s.name,
      label: s.label || titleCase(s.name),
      score: s.score,
      level: s.level,
      flagged: s.flagged,
    })),
    recommendedAction: summary?.recommended_action || result.signal?.recommended_action,
    flaggedCount,
    totalSignals: signals.length,
    modelName: job.model_name,
    clinicalSubtext,
    keyStat: {
      label: "Signals Flagged",
      value: String(flaggedCount),
      suffix: signals.length ? ` / ${signals.length}` : "",
    },
    confidence: Math.round(
      typeof audioClarity === "number" ? Math.max(0, Math.min(100, audioClarity)) : 90
    ),
    robustness: typeof audioClarity === "number" ? audioClarity / 100 : undefined,
    flaggingExplanation: issues.length ? issues.join(" · ") : undefined,
    signalQuality: {
      // v2 has no SI-SDR figure. It reports `audio_clarity` on a 0-100 scale,
      // which is a different quantity — surfaced separately as audioClarity so
      // it is never mislabelled as a dB signal-to-noise ratio.
      snr: 0,
      audioClarity,
      frequencyResponse: job.audio_sample_rate
        ? `${Math.round(job.audio_sample_rate / 2000)}kHz`
        : "24kHz",
      sampleRate,
      duration: job.audio_duration_seconds || 0,
      // v2 reports voice_percentage as 0-100; the report screens expect the
      // 0-1 fraction the legacy v1 field used.
      voicePercentage: typeof voicePercentage === "number" ? voicePercentage / 100 : undefined,
    },
  };
}

/**
 * Wellness score, 0-100, where higher is better. Driven by the actual signal
 * scores rather than by the tier alone, so two "moderate" results with clearly
 * different signal strength do not display an identical number.
 */
function calculateWellnessScore(signals: V2Signal[], likelihoodTier: string): number {
  if (likelihoodTier === "INCONCLUSIVE") return 50;
  const scored = signals.filter((s) => Number.isFinite(s.score));
  if (!scored.length) {
    const fallback: Record<string, number> = { NO_RISK: 95, LOW: 75, MODERATE: 50, HIGH: 25 };
    return fallback[likelihoodTier] ?? 50;
  }
  // Weight the worst signal against the mean so a single strong signal is not
  // washed out by five quiet ones, then invert (high signal = low wellness).
  const max = Math.max(...scored.map((s) => s.score));
  const mean = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  const burden = max * 0.6 + mean * 0.4;
  return Math.max(1, Math.min(99, Math.round((1 - burden) * 100)));
}

function pathwayDomainName(pathway: AssessmentPathway): string {
  return pathway === "BRAIN_AGE"
    ? "COGNITIVE"
    : pathway === "LONGEVITY"
      ? "RESPIRATORY"
      : pathway === "MENTAL_HEALTH"
        ? "AFFECTIVE"
        : pathway === "FERTILITY"
          ? "HORMONAL"
          : pathway === "SPORTS"
            ? "ATHLETIC"
            : "WELLNESS";
}

/**
 * The headline leads with what is holding up rather than what is wrong, graded
 * from the signals themselves. See lib/result-headline.ts for the ladder and
 * for why OPTIMAL is withheld when signals are flagged high.
 *
 * `levels` are the raw API levels. Passing none falls back to naming the
 * assessment, which is the only honest headline without signal data.
 */
export function getV2Classification(
  likelihoodTier: string,
  pathway: AssessmentPathway,
  levels: string[] = []
): string {
  const name = pathwayDomainName(pathway);
  if (levels.length === 0) return `${name} SIGNALS`;
  return headlineFor({ name, levels });
}

function buildFallbackSubtext(signals: V2Signal[], flaggedCount: number): string {
  if (!signals.length) return "No voice signals were returned for this sample.";
  if (flaggedCount === 0) {
    return `Voice analysis found no elevated signals across ${signals.length} measured markers.`;
  }
  const names = signals
    .filter((s) => s.flagged)
    .map((s) => s.label || titleCase(s.name))
    .join(", ");
  return `Voice analysis identified ${flaggedCount} elevated ${
    flaggedCount === 1 ? "signal" : "signals"
  } (${names}). The detected voice patterns may warrant further review.`;
}
