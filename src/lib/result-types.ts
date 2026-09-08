import { AssessmentPathway } from "@/context/AssessmentContext";

/**
 * The shape the report screens read, and the display helper they share.
 *
 * These used to live in cognitive-api-visual-mapping alongside the v1
 * transform. That module was scoped to the BRAIN_AGE pathway by its own header
 * yet acted as the fallback for every pathway, and the app now runs entirely on
 * the v2 API, so it has been removed. The types stay because they describe what
 * the screens consume, not which API produced it.
 */

export interface LabMetric {
  label: string;
  value: string;
  unit: string;
  reference: string;
  status: "normal" | "elevated" | "low";
}

export interface BiomarkerDefinition {
  title: string;
  technicalName: string;
  value: string;
  unit: string;
  definition: string;
  clinicalContext: string;
  normalRange: string;
  /** Raw v2 level, so a screen can band it without matching back by name. */
  level?: string;
  /**
   * A pseudo z-score derived from `level`, not a statistic the API returns.
   * Still gates the clinical-context block on the detail page. Under review.
   */
  zScore?: number;
}

/** v2 `extended_metrics[]` entry — a bipolar sub-dimension score. */
export interface ExtendedMetric {
  metric_id: string;
  label: string;
  score_mean: number;
  score_std: number;
  low_anchor: string;
  high_anchor: string;
}

/** v2 `signals[]` entry, reduced to what the report screens need. */
export interface SignalSummary {
  name: string;
  label: string;
  score: number; // 0-1
  level: string;
  flagged: boolean;
}

export interface VisualizedResult {
  jobId: string;
  createdAt: string;
  status: string;
  /** Mirrors summary.overall_level, uppercased. */
  likelihoodTier: string;

  pathway: AssessmentPathway;
  /** Names the assessment. The grade lives on the scale, not here. */
  classification: string;

  labMetrics: LabMetric[];
  biomarkers: BiomarkerDefinition[];
  extendedMetrics?: ExtendedMetric[];
  signals?: SignalSummary[];

  recommendedAction?: string;
  flaggedCount?: number;
  totalSignals?: number;
  modelName?: string;
  /** Which rung of the assessment scale this result landed on. */
  headlineRung?: string;

  clinicalSubtext: string;
  keyStat: {
    label: string;
    value: string;
    suffix: string;
  };

  /**
   * Still rendered, still under review. `robustness` currently carries
   * audio_clarity/100 under a different name, and `frequencyResponse` is the
   * Nyquist of the capture rate rather than anything the API reports.
   */
  robustness?: number;

  signalQuality?: {
    /** v2 `audio_quality.audio_clarity`, 0-100. */
    audioClarity?: number;
    /** v2 `audio_quality.voice_percentage`, as a 0-1 fraction. */
    voicePercentage?: number;
    sampleRate: string;
    duration: number;
    /** Derived, not reported. Under review. */
    frequencyResponse?: string;
    /** Codes from `audio_quality.issues`, empty when the recording was clean. */
    issues?: string[];
  };
}

/**
 * Display wording for `summary.overall_level`.
 *
 * The keys are the six levels the v2 API documents. Anything else returns the
 * input unchanged rather than inventing a label for a level this build has not
 * seen.
 */
export function formatLikelihoodTierForDisplay(tier: string): string {
  const map: Record<string, string> = {
    NONE: "Nothing Detected",
    NO_RISK: "Nothing Detected",
    LOW: "Normal",
    CONSIDER: "Worth Considering",
    MODERATE: "Continue to Monitor",
    ELEVATED: "Review Recommended",
    HIGH: "Review Recommended",
    INCONCLUSIVE: "Inconclusive",
  };
  return map[tier.toUpperCase()] || tier;
}
