/**
 * ============================================================================
 * COGNITIVE / BRAIN HEALTH API VISUAL MAPPING
 * ============================================================================
 * 
 * IMPORTANT: This module is SPECIFICALLY for the BRAIN_AGE pathway
 * (Cognitive/Brain Health assessment). It transforms raw API results from
 * the MaaS cognitive analysis API into a structured format for display
 * in the Dashboard (Reveal) and Detailed Analysis pages.
 * 
 * The transformation logic, feature descriptions, and clinical context are
 * all designed for cognitive decline detection and brain health assessment.
 * 
 * DO NOT use this for other pathways (LONGEVITY, MENTAL_HEALTH, FERTILITY)
 * as they require different transformation logic and feature sets.
 */

import { AssessmentPathway } from "@/context/AssessmentContext";
// Feature descriptions for COGNITIVE/BRAIN HEALTH pathway (BRAIN_AGE)
import featureDescriptions from "@/assets/feature_descriptions.json";
// Clinical context for COGNITIVE/BRAIN HEALTH pathway (BRAIN_AGE) - feature-specific high/low context
import featureContextCognitive from "@/assets/feature_context_cognitive.json";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiResult {
  job_id: string;
  status: string;
  created_at: string;
  result: {
    explanations?: {
      feature_explanations?: {
        error: string | null;
        features: Record<string, FeatureData>;
        status: string;
      };
    };
    likelihood_tier?: string;
    internal?: any;
  };
}

export interface FeatureData {
  feature_value: number;
  z_score_0: number;
  z_score_1: number;
  z_score_difference: number;
  median_distance_0: number;
  median_distance_1: number;
  median_distance_difference?: number;
  rank?: number;
  contradictory_flag?: boolean;
  ri_stats_0: {
    mean: number;
    median: number;
    std: number;
    iqr: number;
  };
  ri_stats_1: {
    mean: number;
    median: number;
    std: number;
    iqr: number;
  };
}

export interface FeatureDescription {
  feature_group: string;
  label: string;
  description: string;
  technical_description: string;
  units: string;
  clinical_context_high?: string;
  clinical_context_low?: string;
}

export interface LabMetric {
  label: string;
  value: string;
  unit: string;
  reference: string;
  status: "normal" | "elevated" | "low";
  zScore?: number; // Optional z-score for color determination
}

export interface BiomarkerDefinition {
  title: string;
  technicalName: string;
  value: string;
  unit: string;
  definition: string;
  clinicalContext: string;
  normalRange: string;
  zScore?: number; // Optional z-score for color determination
  /**
   * Raw v2 API level, carried so the detailed view can band a biomarker
   * directly instead of matching it back to a signal by name. Absent on v1
   * results, which have no level to carry.
   */
  level?: string;
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
  // Job metadata
  jobId: string;
  createdAt: string;
  status: string;
  likelihoodTier: string;
  
  // Pathway-specific data
  pathway: AssessmentPathway;
  score: number; // 0-100
  classification: string; // "OPTIMAL", "STABLE", "ELEVATED"
  
  // Lab metrics for BiometricLabGrid
  labMetrics: LabMetric[];
  
  // Biomarker definitions for DetailedAnalysisView
  biomarkers: BiomarkerDefinition[];

  // v2-only: bipolar sub-dimension metrics (empty on v1 results and when the
  // sample's voice percentage is below the API's quality threshold)
  extendedMetrics?: ExtendedMetric[];

  // v2-only: the raw per-sign signal read, kept alongside `biomarkers` so the
  // reveal screen can rank and bar-chart signals without re-parsing strings
  signals?: SignalSummary[];
  recommendedAction?: string;
  flaggedCount?: number;
  totalSignals?: number;
  modelName?: string;
  /** Which rung of the headline ladder this result landed on. */
  headlineRung?: string;

  // Clinical insights
  clinicalSubtext: string;
  keyStat: {
    label: string;
    value: string;
    suffix: string;
  };
  
  // Confidence and quality
  confidence: number; // 0-100 (deprecated, use robustness)
  robustness?: number; // 0-1 from flagging_results.robustness
  flaggingExplanation?: string; // Explanation from flagging_results.explanation
  signalQuality?: {
    snr: number;
    /** v2 only: 0-100 clarity score. Distinct from `snr`, which is a dB SI-SDR. */
    audioClarity?: number;
    frequencyResponse: string;
    sampleRate: string;
    duration: number;
    pesq?: number;
    stoi?: number;
    voicePercentage?: number;
  };
}

// ============================================================================
// Feature Name Mappings
// ============================================================================

/**
 * Maps API feature names to biomarker identifiers
 */
const FEATURE_MAPPINGS = {
  // Jitter features
  jitter: [
    "opensmile_egemapsv02_functional.jitterLocal_sma3nz_amean",
    "opensmile_egemapsv02_functional.jitterLocal_sma3nz_stddevNorm",
  ],
  
  // Shimmer features
  shimmer: [
    "opensmile_egemapsv02_functional.shimmerLocaldB_sma3nz_amean",
    "opensmile_egemapsv02_functional.shimmerLocaldB_sma3nz_stddevNorm",
  ],
  
  // HNR (Harmonics-to-Noise Ratio)
  hnr: [
    "opensmile_egemapsv02_functional.HNRdBACF_sma3nz_amean",
    "opensmile_egemapsv02_functional.HNRdBACF_sma3nz_stddevNorm",
  ],
  
  // F0 (Fundamental Frequency)
  f0: [
    "opensmile_egemapsv02_functional.F0semitoneFrom27.5Hz_sma3nz_amean",
    "opensmile_egemapsv02_functional.F0semitoneFrom27.5Hz_sma3nz_stddevNorm",
    "opensmile_egemapsv02_functional.F0semitoneFrom27.5Hz_sma3nz_percentile50.0",
  ],
  
  // Valence (emotional tone)
  valence: [
    "valence_arousal_dominance_statistics_wavlm_vad_odyssey2024.valence.mean",
    "valence_arousal_dominance_statistics_wavlm_vad_odyssey2024.valence.median",
  ],
  
  // Arousal (energy level)
  arousal: [
    "valence_arousal_dominance_statistics_wavlm_vad_odyssey2024.arousal.mean",
    "valence_arousal_dominance_statistics_wavlm_vad_odyssey2024.arousal.median",
  ],
  
  // Formant frequencies
  f1: [
    "opensmile_egemapsv02_functional.F1amplitudeLogRelF0_sma3nz_amean",
  ],
  f2: [
    "opensmile_egemapsv02_functional.F2amplitudeLogRelF0_sma3nz_amean",
  ],
  f3: [
    "opensmile_egemapsv02_functional.F3amplitudeLogRelF0_sma3nz_amean",
  ],
  
  // Spectral features
  spectralCentroid: [
    "librosa_spectral_statistics.centroid.max",
    "librosa_spectral_statistics.centroid.mean",
  ],
  
  // MFCC features (for cognitive latency estimation)
  mfcc: [
    "librosa_mfcc_statistics.mfcc_1.q25",
    "librosa_mfcc_statistics.mfcc_3.max",
    "librosa_mfcc_statistics.mfcc_4.q75",
  ],
};

// ============================================================================
// Reference Ranges
// ============================================================================

const REFERENCE_RANGES = {
  jitter: { normal: "<0.8%", elevated: ">=0.8%" },
  shimmer: { normal: "<3.0dB", elevated: ">=3.0dB" },
  hnr: { normal: ">15dB", low: "<=15dB" },
  f0_male: { normal: "85-180Hz", low: "<85Hz", elevated: ">180Hz" },
  f0_female: { normal: "165-255Hz", low: "<165Hz", elevated: ">255Hz" },
  valence: { normal: ">0.1", low: "<=0.1" },
  arousal: { normal: "0.3-0.7", low: "<0.3", elevated: ">0.7" },
  latency: { normal: "<120ms", elevated: ">=120ms" },
  hrv: { normal: ">65ms", low: "<=65ms" },
  breathRate: { normal: "12-16/min", elevated: ">16/min", low: "<12/min" },
  rsa: { normal: ">0.85", low: "<=0.85" },
  cardiacCoupling: { normal: ">0.5", low: "<=0.5" },
  pauseRatio: { normal: "<0.3", elevated: ">=0.3" },
  prosody: { normal: ">0.7", low: "<=0.7" },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get feature description from JSON
 */
function getFeatureDescription(featureName: string): FeatureDescription | null {
  const desc = (featureDescriptions as Record<string, FeatureDescription>)[featureName];
  return desc || null;
}

/**
 * Convert semitones (above A0 = 27.5 Hz) to Hz
 * Formula: Hz = 27.5 * 2^(semitones/12)
 */
function semitonesToHz(semitones: number): number {
  return 27.5 * Math.pow(2, semitones / 12);
}

/**
 * Calculate normal range from RI stats using mean ± 2*std
 * Returns format: "[min, max]" for clarity
 * If units are "semitones", converts to Hz before formatting
 */
function calculateNormalRange(riStats: { mean: number; std: number; median: number; iqr: number }, units?: string): string {
  let min = riStats.mean - 2 * riStats.std;
  let max = riStats.mean + 2 * riStats.std;
  
  // Convert semitones to Hz if needed
  if (units === "semitones") {
    min = semitonesToHz(min);
    max = semitonesToHz(max);
  }
  
  // Format as [min, max] for clarity instead of mean ± 2*std
  return `[${min.toFixed(2)}, ${max.toFixed(2)}]`;
}

/**
 * Determine status from z-score
 * More lenient thresholds:
 * - Normal (green): |z_score| < 2.0
 * - Elevated/Low (orange): 2.0 <= |z_score| < 3.0
 * - Elevated/Low (red): |z_score| >= 3.0
 */
function determineStatusFromZScore(zScore: number): "normal" | "elevated" | "low" {
  const absZScore = Math.abs(zScore);
  
  if (absZScore < 2.0) {
    return "normal";
  }
  
  // For values >= 2.0, determine if elevated or low based on sign
  // Orange for 2.0-3.0, red for >= 3.0
  // But we'll use "elevated" for positive, "low" for negative
  // The color will be determined by the absolute value in the component
  if (absZScore >= 3.0) {
    // Red zone - use direction to determine elevated vs low
    return zScore > 0 ? "elevated" : "low";
  } else {
    // Orange zone (2.0 <= |z| < 3.0) - use direction to determine elevated vs low
    return zScore > 0 ? "elevated" : "low";
  }
}

/**
 * Get clinical context from feature_context_cognitive.json
 */
function getClinicalContextFromJSON(featureName: string): { clinical_context_high?: string; clinical_context_low?: string } | null {
  const context = (featureContextCognitive as Record<string, { clinical_context_high?: string; clinical_context_low?: string }>)[featureName];
  return context || null;
}

/**
 * Generate clinical context from z-score
 * Only shows context if |z-score| >= 2.0 (out of normal range)
 * Uses feature-specific context from feature_context_cognitive.json
 */
function generateClinicalContext(featureName: string, zScore: number, featureDesc: FeatureDescription | null): string {
  const absZScore = Math.abs(zScore);
  
  // Only show clinical context if out of normal range (|z| >= 2.0)
  if (absZScore < 2.0) {
    return ""; // Return empty string - context won't be displayed
  }
  
  // Get clinical context from feature_context_cognitive.json
  const clinicalContext = getClinicalContextFromJSON(featureName);
  
  if (clinicalContext) {
    // Use high context if z-score is positive (above mean), low context if negative (below mean)
    if (zScore > 0 && clinicalContext.clinical_context_high) {
      return clinicalContext.clinical_context_high;
    } else if (zScore < 0 && clinicalContext.clinical_context_low) {
      return clinicalContext.clinical_context_low;
    }
  }
  
  // Fallback to generic message if no specific context found
  if (absZScore < 3.0) {
    return "Your result indicates moderate deviation from normal range. Further assessment may be warranted.";
  } else {
    return "Your result shows significant deviation from normal range. Clinical evaluation is recommended.";
  }
}

/**
 * Format feature value with appropriate decimals
 */
function formatFeatureValue(value: number, units: string): string {
  // Convert semitones to Hz if needed
  let displayValue = value;
  let displayUnits = units;
  
  if (units === "semitones") {
    displayValue = semitonesToHz(value);
    displayUnits = "Hz";
  }
  
  // Determine decimal places based on units and value magnitude
  if (displayUnits === "none" || displayUnits === "") {
    return displayValue.toFixed(2);
  }
  if (Math.abs(displayValue) < 0.01) {
    return displayValue.toExponential(2);
  }
  if (Math.abs(displayValue) < 1) {
    return displayValue.toFixed(3);
  }
  if (Math.abs(displayValue) < 10) {
    return displayValue.toFixed(2);
  }
  if (Math.abs(displayValue) < 100) {
    return displayValue.toFixed(1);
  }
  return Math.round(displayValue).toString();
}

/**
 * Calculate frequency range from sample rate (upper bound is half the sample rate)
 * @param sampleRate - Sample rate string like "48kHz"
 * @returns Frequency range string like "20Hz - 8kHz"
 */
function calculateFrequencyRange(sampleRate: string): string {
  // Extract numeric value from sample rate string (e.g., "48kHz" -> 48)
  const match = sampleRate.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return "20Hz - 8kHz"; // Default fallback
  }
  
  const sampleRateValue = parseFloat(match[1]);
  const maxFrequency = sampleRateValue / 2; // Nyquist frequency (half the sample rate)
  
  // Format based on magnitude
  if (maxFrequency >= 1000) {
    return `20Hz - ${(maxFrequency / 1000).toFixed(0)}kHz`;
  } else {
    return `20Hz - ${maxFrequency.toFixed(0)}Hz`;
  }
}

/**
 * Extract audio quality from internal object
 */
function extractAudioQuality(internal: any): { snr: number; frequencyResponse: string; sampleRate: string; duration: number; pesq?: number; stoi?: number; voicePercentage?: number } | undefined {
  if (!internal?.audio_quality) {
    return undefined;
  }
  
  const aq = internal.audio_quality;
  const sampleRate = "48kHz"; // Default or from metadata
  const frequencyRange = calculateFrequencyRange(sampleRate);
  
  return {
    snr: aq.si_sdr_mean || 0,
    frequencyResponse: frequencyRange, // Calculated from sample rate (half the sample rate)
    sampleRate: sampleRate,
    duration: aq.duration_seconds || 0,
    pesq: aq.pesq_mean,
    stoi: aq.stoi_mean,
    voicePercentage: aq.voice_percentage_mean,
  };
}

/**
 * Extract flagging results (robustness and explanation) from internal object
 */
function extractFlaggingResults(internal: any): { robustness?: number; explanation?: string } {
  if (!internal?.flagging_results) {
    return {};
  }
  
  const fr = internal.flagging_results;
  return {
    robustness: fr.robustness,
    explanation: fr.explanation || undefined,
  };
}

/**
 * Find feature value by matching feature name patterns
 */
function findFeatureValue(
  features: Record<string, FeatureData>,
  patterns: string[]
): number | null {
  for (const pattern of patterns) {
    for (const [featureName, featureData] of Object.entries(features)) {
      if (featureName.includes(pattern) || featureName === pattern) {
        return featureData.feature_value;
      }
    }
  }
  return null;
}

/**
 * Get feature data by matching patterns
 */
function findFeatureData(
  features: Record<string, FeatureData>,
  patterns: string[]
): FeatureData | null {
  for (const pattern of patterns) {
    for (const [featureName, featureData] of Object.entries(features)) {
      if (featureName.includes(pattern) || featureName === pattern) {
        return featureData;
      }
    }
  }
  return null;
}

/**
 * Determine status based on value and reference range
 */
function determineStatus(
  value: number,
  normalRange: { normal?: string; elevated?: string; low?: string }
): "normal" | "elevated" | "low" {
  // Parse reference ranges (simplified - would need more robust parsing)
  if (normalRange.normal) {
    if (normalRange.normal.startsWith("<")) {
      const threshold = parseFloat(normalRange.normal.slice(1));
      return value < threshold ? "normal" : "elevated";
    } else if (normalRange.normal.startsWith(">")) {
      const threshold = parseFloat(normalRange.normal.slice(1));
      return value > threshold ? "normal" : "low";
    } else if (normalRange.normal.includes("-")) {
      const [min, max] = normalRange.normal.split("-").map(parseFloat);
      if (value >= min && value <= max) return "normal";
      return value < min ? "low" : "elevated";
    }
  }
  return "normal";
}

/**
 * Calculate pathway score from feature z-scores
 */
function calculatePathwayScore(
  pathway: AssessmentPathway,
  features: Record<string, FeatureData>
): number {
  // Extract relevant features for the pathway
  let relevantZScores: number[] = [];
  
  switch (pathway) {
    case "BRAIN_AGE":
      // Use jitter, shimmer, MFCC features for cognitive assessment
      const jitterData = findFeatureData(features, FEATURE_MAPPINGS.jitter);
      const shimmerData = findFeatureData(features, FEATURE_MAPPINGS.shimmer);
      const mfccData = findFeatureData(features, FEATURE_MAPPINGS.mfcc);
      
      if (jitterData) relevantZScores.push(Math.abs(jitterData.z_score_0));
      if (shimmerData) relevantZScores.push(Math.abs(shimmerData.z_score_0));
      if (mfccData) relevantZScores.push(Math.abs(mfccData.z_score_0));
      break;
      
    case "LONGEVITY":
      // Use HNR, spectral features for respiratory assessment
      const hnrData = findFeatureData(features, FEATURE_MAPPINGS.hnr);
      const spectralData = findFeatureData(features, FEATURE_MAPPINGS.spectralCentroid);
      
      if (hnrData) relevantZScores.push(Math.abs(hnrData.z_score_0));
      if (spectralData) relevantZScores.push(Math.abs(spectralData.z_score_0));
      break;
      
    case "MENTAL_HEALTH":
      // Use valence, arousal for affective assessment
      const valenceData = findFeatureData(features, FEATURE_MAPPINGS.valence);
      const arousalData = findFeatureData(features, FEATURE_MAPPINGS.arousal);
      
      if (valenceData) relevantZScores.push(Math.abs(valenceData.z_score_0));
      if (arousalData) relevantZScores.push(Math.abs(arousalData.z_score_0));
      break;
      
    case "FERTILITY":
      // Use F0, formant features for hormonal assessment
      const f0Data = findFeatureData(features, FEATURE_MAPPINGS.f0);
      const f1Data = findFeatureData(features, FEATURE_MAPPINGS.f1);
      
      if (f0Data) relevantZScores.push(Math.abs(f0Data.z_score_0));
      if (f1Data) relevantZScores.push(Math.abs(f1Data.z_score_0));
      break;
      
    case "WELLNESS":
      // Use HNR, shimmer, F0 for wellness screening (fatigue/breathiness/stamina)
      const wellnessHnr = findFeatureData(features, FEATURE_MAPPINGS.hnr);
      const wellnessShimmer = findFeatureData(features, FEATURE_MAPPINGS.shimmer);
      const wellnessF0 = findFeatureData(features, FEATURE_MAPPINGS.f0);

      if (wellnessHnr) relevantZScores.push(Math.abs(wellnessHnr.z_score_0));
      if (wellnessShimmer) relevantZScores.push(Math.abs(wellnessShimmer.z_score_0));
      if (wellnessF0) relevantZScores.push(Math.abs(wellnessF0.z_score_0));
      break;
  }
  
  if (relevantZScores.length === 0) {
    // Cannot calculate score without required features
    throw new Error(`Missing required features for ${pathway} pathway score calculation`);
  }
  
  // Calculate score: lower z-scores (closer to normal) = higher score
  // Z-score of 0 = perfect (100), z-score of 2 = concerning (50), z-score of 4+ = critical (0)
  const avgZScore = relevantZScores.reduce((a, b) => a + b, 0) / relevantZScores.length;
  const score = Math.max(0, Math.min(100, 100 - (avgZScore * 12.5))); // Scale: 0 z-score = 100, 2 z-score = 75, 4 z-score = 50, 8 z-score = 0
  
  return Math.round(score);
}

/**
 * Format likelihood tier for display
 * Consumer-friendly language for brain health assessment (no "risk" terminology)
 */
export function formatLikelihoodTierForDisplay(tier: string): string {
  const tierMap: Record<string, string> = {
    "NO_RISK": "Optimal",
    "LOW": "Normal",
    "MODERATE": "Continue to Monitor",
    "HIGH": "Review Recommended",
    "INCONCLUSIVE": "Inconclusive",
  };
  
  return tierMap[tier.toUpperCase()] || tier;
}

/**
 * Generate classification from likelihood tier
 */
function getClassificationFromLikelihoodTier(tier: string, pathway: AssessmentPathway): string {
  const pathwayName = pathway === "BRAIN_AGE" ? "COGNITIVE" 
    : pathway === "LONGEVITY" ? "RESPIRATORY"
    : pathway === "MENTAL_HEALTH" ? "AFFECTIVE"
    : pathway === "FERTILITY" ? "HORMONAL"
    : pathway === "WELLNESS" ? "WELLNESS"
    : "BIOMETRIC";
  
  // Matches the v2 headline: name what was measured, not a verdict on it. Kept
  // in step deliberately, so the legacy path cannot reintroduce risk wording.
  return `${pathwayName} SIGNALS`;
}

/**
 * Calculate score from likelihood tier
 */
function calculateScoreFromLikelihoodTier(tier: string): number {
  const tierMap: Record<string, number> = {
    "NO_RISK": 95,
    "LOW": 75,
    "MODERATE": 50,
    "HIGH": 25,
    "INCONCLUSIVE": 50,
  };
  
  return tierMap[tier.toUpperCase()] || 50;
}

/**
 * Map API likelihood tier to confidence tier
 */
function mapApiLikelihoodToConfidenceTier(apiTier: string): string {
  const mapping: Record<string, string> = {
    "NO_RISK": "CONFIDENT",
    "LOW": "LIKELY",
    "MODERATE": "POSSIBLE",
    "HIGH": "UNLIKELY",
    "INCONCLUSIVE": "INCONCLUSIVE",
  };
  
  return mapping[apiTier.toUpperCase()] || "INCONCLUSIVE";
}

/**
 * Map likelihood tier to confidence score
 */
function mapLikelihoodTierToConfidence(tier: string | undefined): number {
  if (!tier) return 95;
  
  // First map API tier to confidence tier if needed
  const confidenceTier = mapApiLikelihoodToConfidenceTier(tier);
  
  const tierMap: Record<string, number> = {
    "CONFIDENT": 95,
    "LIKELY": 85,
    "POSSIBLE": 75,
    "INCONCLUSIVE": 65,
    "UNLIKELY": 45,
  };
  
  return tierMap[confidenceTier.toUpperCase()] || 75;
}

// ============================================================================
// Ranked Feature Transformer (New API Structure)
// ============================================================================

/**
 * Transform ranked features from API into lab metrics and biomarkers
 * Uses feature_descriptions.json for labels/units/descriptions
 * Uses ri_stats_0 for normal ranges
 */
function transformRankedFeatures(
  features: Record<string, FeatureData>
): { labMetrics: LabMetric[]; biomarkers: BiomarkerDefinition[] } {
  const labMetrics: LabMetric[] = [];
  const biomarkers: BiomarkerDefinition[] = [];
  
  // Sort features: always-included (rank: null) first, then ranked features (1-6)
  const sortedFeatures = Object.entries(features).sort((a, b) => {
    const rankA = a[1].rank;
    const rankB = b[1].rank;
    
    // If both are null (always-included), maintain original order
    if (rankA === null && rankB === null) {
      return 0;
    }
    // If only A is null (always-included), A comes first
    if (rankA === null && rankB !== null) {
      return -1;
    }
    // If only B is null (always-included), B comes first
    if (rankA !== null && rankB === null) {
      return 1;
    }
    // Both have ranks, sort by rank
    return rankA - rankB;
  });
  
  for (const [featureName, featureData] of sortedFeatures) {
    const featureDesc = getFeatureDescription(featureName);
    
    // Skip if no description found (optional - could use fallback)
    if (!featureDesc) {
      console.warn(`[Transform] Feature not found in descriptions: ${featureName}`);
      continue;
    }
    
    // Calculate normal range from RI stats (using ri_stats_0)
    // Pass units to convert semitones to Hz if needed
    const normalRange = calculateNormalRange(featureData.ri_stats_0, featureDesc.units);
    
    // Determine status from z-score
    const status = determineStatusFromZScore(featureData.z_score_0);
    
    // Format value (will convert semitones to Hz if needed)
    const formattedValue = formatFeatureValue(featureData.feature_value, featureDesc.units);
    
    // Determine display unit (Hz if converted from semitones, otherwise original)
    const displayUnit = featureDesc.units === "semitones" ? "Hz" : featureDesc.units;
    
    // Create LabMetric
    labMetrics.push({
      label: featureDesc.label.toUpperCase(),
      value: formattedValue,
      unit: displayUnit,
      reference: normalRange,
      status,
      zScore: featureData.z_score_0, // Include z-score for color determination
    });
    
    // Create BiomarkerDefinition
    const clinicalContext = generateClinicalContext(featureName, featureData.z_score_0, featureDesc);
    
    // Simplify technical name (remove long prefixes)
    const technicalName = featureName
      .split('.')
      .slice(-2)
      .join('.')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // displayUnit already declared above, reuse it
    
    biomarkers.push({
      title: featureDesc.label,
      technicalName,
      value: formattedValue,
      unit: displayUnit,
      definition: featureDesc.description, // Use non-technical description instead of technical_description
      clinicalContext,
      normalRange,
      zScore: featureData.z_score_0, // Include z-score for color determination
    });
  }
  
  return { labMetrics, biomarkers };
}

// ============================================================================
// Pathway-Specific Transformers
// ============================================================================

function transformBrainAge(
  features: Record<string, FeatureData>,
  score: number
): { labMetrics: LabMetric[]; biomarkers: BiomarkerDefinition[] } {
  // Extract values - require essential features
  const jitterValue = findFeatureValue(features, FEATURE_MAPPINGS.jitter);
  const shimmerData = findFeatureData(features, FEATURE_MAPPINGS.shimmer);
  const hnrValue = findFeatureValue(features, FEATURE_MAPPINGS.hnr);
  const mfccData = findFeatureData(features, FEATURE_MAPPINGS.mfcc);
  
  // Require essential features for brain age pathway
  if (jitterValue === null || !shimmerData || hnrValue === null || !mfccData) {
    throw new Error("Missing required features for BRAIN_AGE pathway transformation");
  }
  
  const shimmerValue = shimmerData.feature_value;
  
  // Estimate cognitive latency from MFCC features (simplified)
  const latencyValue = Math.abs(mfccData.z_score_0) * 30 + 120;
  
  // Calculate motor stability (inverse of jitter variance)
  const motorStability = Math.max(0, 1 - (jitterValue / 2));
  
  // Estimate processing speed (words per minute) from speech features
  const processingSpeed = Math.max(100, 150 - (latencyValue - 120) * 2);
  
  const labMetrics: LabMetric[] = [
    {
      label: "JITTER VARIANCE",
      value: jitterValue.toFixed(2),
      unit: "%",
      reference: REFERENCE_RANGES.jitter.normal,
      status: determineStatus(jitterValue, REFERENCE_RANGES.jitter),
    },
    {
      label: "SHIMMER INDEX",
      value: shimmerValue.toFixed(2),
      unit: "dB",
      reference: REFERENCE_RANGES.shimmer.normal,
      status: determineStatus(shimmerValue, REFERENCE_RANGES.shimmer),
    },
    {
      label: "COGNITIVE LATENCY",
      value: Math.round(latencyValue).toString(),
      unit: "ms",
      reference: REFERENCE_RANGES.latency.normal,
      status: determineStatus(latencyValue, REFERENCE_RANGES.latency),
    },
    {
      label: "HNR RATIO",
      value: hnrValue.toFixed(1),
      unit: "dB",
      reference: REFERENCE_RANGES.hnr.normal,
      status: determineStatus(hnrValue, REFERENCE_RANGES.hnr),
    },
    {
      label: "MOTOR STABILITY",
      value: motorStability.toFixed(2),
      unit: "σ",
      reference: "Norm: <1.0σ",
      status: motorStability < 1.0 ? "normal" : "elevated",
    },
    {
      label: "PROCESSING SPEED",
      value: Math.round(processingSpeed).toString(),
      unit: "wpm",
      reference: "Norm: >130wpm",
      status: processingSpeed > 130 ? "normal" : "low",
    },
  ];
  
  const biomarkers: BiomarkerDefinition[] = [
    {
      title: "Vocal Jitter",
      technicalName: "Micro-tremors",
      value: jitterValue.toFixed(2),
      unit: "%",
      definition: "Jitter measures cycle-to-cycle variations in vocal fold vibration frequency. Elevated levels correlate with neuromotor fatigue, reduced fine motor control, or laryngeal stress.",
      clinicalContext: jitterValue >= 0.8
        ? "Your result indicates slight deviation from optimal range, suggesting potential cognitive fatigue or stress-related vocal tension."
        : "Your jitter values are within normal parameters, indicating stable vocal fold vibration.",
      normalRange: REFERENCE_RANGES.jitter.normal,
    },
    {
      title: "Shimmer Index",
      technicalName: "Amplitude Perturbation",
      value: shimmerValue.toFixed(2),
      unit: "dB",
      definition: "Shimmer quantifies cycle-to-cycle variations in vocal amplitude. It reflects the stability of the respiratory support system and glottal closure patterns.",
      clinicalContext: shimmerValue < 3.0
        ? "Your shimmer values are within normal parameters, indicating stable respiratory-phonatory coordination."
        : "Elevated shimmer detected, suggesting potential respiratory or glottal instability.",
      normalRange: REFERENCE_RANGES.shimmer.normal,
    },
    {
      title: "Cognitive Latency",
      technicalName: "Response Time Index",
      value: Math.round(latencyValue).toString(),
      unit: "ms",
      definition: "Measures the delay between auditory stimulus and vocal response initiation. Extended latency may indicate cognitive processing load or attention deficits.",
      clinicalContext: latencyValue >= 120
        ? "Elevated latency detected. Consider cognitive wellness screening if persistent across multiple assessments."
        : "Latency within optimal range, indicating efficient cognitive processing.",
      normalRange: REFERENCE_RANGES.latency.normal,
    },
    {
      title: "HNR Ratio",
      technicalName: "Harmonics-to-Noise",
      value: hnrValue.toFixed(1),
      unit: "dB",
      definition: "The harmonic-to-noise ratio indicates the proportion of periodic (voiced) energy versus aperiodic (noise) energy in the voice signal. Higher values indicate cleaner phonation.",
      clinicalContext: hnrValue > 15
        ? "Your HNR is within healthy range, suggesting efficient vocal fold vibration without excessive turbulence."
        : "Reduced HNR detected, indicating increased noise in vocal signal.",
      normalRange: REFERENCE_RANGES.hnr.normal,
    },
  ];
  
  return { labMetrics, biomarkers };
}

function transformLongevity(
  features: Record<string, FeatureData>,
  score: number
): { labMetrics: LabMetric[]; biomarkers: BiomarkerDefinition[] } {
  const hnrValue = findFeatureValue(features, FEATURE_MAPPINGS.hnr);
  const spectralData = findFeatureData(features, FEATURE_MAPPINGS.spectralCentroid);
  
  // Require essential features - throw error if missing
  if (hnrValue === null || !spectralData) {
    throw new Error("Missing required features for LONGEVITY pathway transformation");
  }
  
  // Estimate HRV from spectral features (simplified)
  const hrvValue = Math.abs(spectralData.z_score_0) * 10 + 50;
  
  // Estimate breath rate from spectral centroid
  const breathRate = 12 + Math.abs(spectralData.z_score_0) * 3;
  
  // Estimate RSA from spectral features
  const rsaValue = 0.85 - Math.abs(spectralData.z_score_0) * 0.05;
  
  // Estimate cardiac coupling
  const cardiacCoupling = 0.5 - Math.abs(spectralData.z_score_0) * 0.03;
  
  // Resonance frequency (formant-based)
  const resonanceFreq = 4.0 + (hnrValue - 15) * 0.1;
  
  // Spectral entropy (simplified)
  const spectralEntropy = 0.7 - Math.abs(spectralData.z_score_0) * 0.01;
  
  const labMetrics: LabMetric[] = [
    {
      label: "HRV PROXY",
      value: Math.round(hrvValue).toString(),
      unit: "ms",
      reference: REFERENCE_RANGES.hrv.normal,
      status: determineStatus(hrvValue, REFERENCE_RANGES.hrv),
    },
    {
      label: "BREATH RATE",
      value: Math.round(breathRate).toString(),
      unit: "/min",
      reference: REFERENCE_RANGES.breathRate.normal,
      status: determineStatus(breathRate, REFERENCE_RANGES.breathRate),
    },
    {
      label: "RESPIRATORY SINUS",
      value: rsaValue.toFixed(2),
      unit: "ratio",
      reference: REFERENCE_RANGES.rsa.normal,
      status: determineStatus(rsaValue, REFERENCE_RANGES.rsa),
    },
    {
      label: "RESONANCE FREQ",
      value: resonanceFreq.toFixed(1),
      unit: "Hz",
      reference: "Norm: 4-6Hz",
      status: resonanceFreq >= 4 && resonanceFreq <= 6 ? "normal" : "elevated",
    },
    {
      label: "SPECTRAL ENTROPY",
      value: spectralEntropy.toFixed(2),
      unit: "bits",
      reference: "Norm: <0.75",
      status: spectralEntropy < 0.75 ? "normal" : "elevated",
    },
    {
      label: "CARDIAC COUPLING",
      value: cardiacCoupling.toFixed(2),
      unit: "r²",
      reference: REFERENCE_RANGES.cardiacCoupling.normal,
      status: determineStatus(cardiacCoupling, REFERENCE_RANGES.cardiacCoupling),
    },
  ];
  
  const biomarkers: BiomarkerDefinition[] = [
    {
      title: "HRV Proxy",
      technicalName: "Heart Rate Variability Estimation",
      value: Math.round(hrvValue).toString(),
      unit: "ms",
      definition: "Voice-derived estimation of heart rate variability through respiratory sinus arrhythmia patterns embedded in speech. Lower values may indicate reduced autonomic flexibility.",
      clinicalContext: hrvValue <= 65
        ? "Below optimal threshold. Reduced HRV is associated with cardiovascular strain and chronic stress response."
        : "HRV within optimal range, indicating good autonomic flexibility.",
      normalRange: REFERENCE_RANGES.hrv.normal,
    },
    {
      title: "Breath Rate",
      technicalName: "Respiratory Frequency",
      value: Math.round(breathRate).toString(),
      unit: "/min",
      definition: "Speech-derived estimation of baseline respiratory rate. Elevated rates may indicate sympathetic nervous system activation or respiratory inefficiency.",
      clinicalContext: breathRate > 16
        ? "Slightly elevated. Consider stress management protocols or respiratory function assessment."
        : breathRate < 12
        ? "Below typical range. May indicate respiratory depression or fatigue."
        : "Breath rate within normal parameters.",
      normalRange: REFERENCE_RANGES.breathRate.normal,
    },
    {
      title: "Respiratory Sinus Arrhythmia",
      technicalName: "RSA Coefficient",
      value: rsaValue.toFixed(2),
      unit: "ratio",
      definition: "Measures the coupling between respiration and heart rate variation. A key marker of parasympathetic tone and vagal efficiency.",
      clinicalContext: rsaValue <= 0.85
        ? "Below optimal range, suggesting reduced vagal tone. Breathing exercises may help improve this marker."
        : "RSA within optimal range, indicating good vagal tone.",
      normalRange: REFERENCE_RANGES.rsa.normal,
    },
    {
      title: "Cardiac Coupling",
      technicalName: "Voice-Heart Coherence",
      value: cardiacCoupling.toFixed(2),
      unit: "r²",
      definition: "Correlation coefficient between vocal prosody patterns and estimated cardiac rhythms. Higher values indicate better cardiorespiratory synchronization.",
      clinicalContext: cardiacCoupling <= 0.5
        ? "Reduced coupling detected. This may indicate autonomic dysregulation or chronic stress patterns."
        : "Good cardiac coupling detected, indicating healthy cardiorespiratory synchronization.",
      normalRange: REFERENCE_RANGES.cardiacCoupling.normal,
    },
  ];
  
  return { labMetrics, biomarkers };
}

function transformMentalHealth(
  features: Record<string, FeatureData>,
  score: number
): { labMetrics: LabMetric[]; biomarkers: BiomarkerDefinition[] } {
  const valenceData = findFeatureData(features, FEATURE_MAPPINGS.valence);
  const arousalData = findFeatureData(features, FEATURE_MAPPINGS.arousal);
  
  const valenceValue = valenceData?.feature_value || -0.32;
  const arousalValue = arousalData?.feature_value || 0.5;
  
  // Calculate prosody index from valence and arousal variance
  const prosodyIndex = Math.max(0, Math.min(1, 0.5 + valenceValue * 0.3 + (arousalValue - 0.5) * 0.4));
  
  // Estimate pause ratio from arousal (lower arousal = more pauses)
  const pauseRatio = 0.3 + (0.5 - arousalValue) * 0.2;
  
  // Estimate speech rate from arousal
  const speechRate = 120 + (arousalValue - 0.5) * 30;
  
  // Tonal variance from spectral features
  const spectralData = findFeatureData(features, FEATURE_MAPPINGS.spectralCentroid);
  const tonalVariance = spectralData ? 10 + Math.abs(spectralData.z_score_0) * 2 : 8.2;
  
  // Vocal energy classification
  const vocalEnergy = arousalValue < 0.3 ? "LOW" : arousalValue > 0.7 ? "HIGH" : "MED";
  
  const labMetrics: LabMetric[] = [
    {
      label: "AFFECTIVE VALENCE",
      value: valenceValue.toFixed(2),
      unit: "AU",
      reference: REFERENCE_RANGES.valence.normal,
      status: determineStatus(valenceValue, REFERENCE_RANGES.valence),
    },
    {
      label: "VOCAL ENERGY",
      value: vocalEnergy,
      unit: "",
      reference: "Norm: MED-HIGH",
      status: vocalEnergy === "LOW" ? "low" : "normal",
    },
    {
      label: "TONAL VARIANCE",
      value: tonalVariance.toFixed(1),
      unit: "Hz",
      reference: "Norm: 10-15Hz",
      status: tonalVariance >= 10 && tonalVariance <= 15 ? "normal" : "low",
    },
    {
      label: "PAUSE RATIO",
      value: pauseRatio.toFixed(2),
      unit: "s/w",
      reference: REFERENCE_RANGES.pauseRatio.normal,
      status: determineStatus(pauseRatio, REFERENCE_RANGES.pauseRatio),
    },
    {
      label: "SPEECH RATE",
      value: Math.round(speechRate).toString(),
      unit: "wpm",
      reference: "Norm: 120-150",
      status: speechRate >= 120 && speechRate <= 150 ? "normal" : "low",
    },
    {
      label: "PROSODY INDEX",
      value: prosodyIndex.toFixed(2),
      unit: "score",
      reference: REFERENCE_RANGES.prosody.normal,
      status: determineStatus(prosodyIndex, REFERENCE_RANGES.prosody),
    },
  ];
  
  const biomarkers: BiomarkerDefinition[] = [
    {
      title: "Affective Valence",
      technicalName: "Emotional Polarity Index",
      value: valenceValue.toFixed(2),
      unit: "AU",
      definition: "Machine learning-derived score indicating the emotional tone embedded in vocal patterns. Negative values correlate with low mood states; positive values with elevated affect.",
      clinicalContext: valenceValue <= 0.1
        ? "Your score suggests a tendency toward low mood expression. Consider mental wellness support if persistent."
        : "Valence within normal range, indicating balanced emotional expression.",
      normalRange: REFERENCE_RANGES.valence.normal,
    },
    {
      title: "Vocal Energy",
      technicalName: "Dynamic Range",
      value: vocalEnergy,
      unit: "",
      definition: "Overall acoustic energy and dynamic variation in speech. Reduced energy levels are associated with fatigue, depression, or motivational deficits.",
      clinicalContext: vocalEnergy === "LOW"
        ? "Low vocal energy detected. This pattern is often seen in fatigue states or depressive episodes."
        : "Vocal energy within normal range.",
      normalRange: "MED-HIGH",
    },
    {
      title: "Pause Ratio",
      technicalName: "Speech Hesitation Index",
      value: pauseRatio.toFixed(2),
      unit: "s/w",
      definition: "Average pause duration between words or phrases. Extended pauses may indicate cognitive load, anxiety, or processing difficulties.",
      clinicalContext: pauseRatio >= 0.3
        ? "Elevated pause ratio suggests possible anxiety or cognitive overload during speech production."
        : "Pause ratio within normal parameters.",
      normalRange: REFERENCE_RANGES.pauseRatio.normal,
    },
    {
      title: "Prosody Index",
      technicalName: "Melodic Variation Score",
      value: prosodyIndex.toFixed(2),
      unit: "score",
      definition: "Quantifies the melodic variation and emotional expressiveness in speech patterns. Flat prosody is associated with emotional blunting or depression.",
      clinicalContext: prosodyIndex <= 0.7
        ? "Below optimal range. Reduced prosody may indicate emotional dysregulation or depressive symptoms."
        : "Prosody within healthy range, indicating good emotional expressiveness.",
      normalRange: REFERENCE_RANGES.prosody.normal,
    },
  ];
  
  return { labMetrics, biomarkers };
}

function transformFertility(
  features: Record<string, FeatureData>,
  score: number,
  biologicalSex?: "male" | "female"
): { labMetrics: LabMetric[]; biomarkers: BiomarkerDefinition[] } {
  const f0Data = findFeatureData(features, FEATURE_MAPPINGS.f0);
  const f1Data = findFeatureData(features, FEATURE_MAPPINGS.f1);
  const f2Data = findFeatureData(features, FEATURE_MAPPINGS.f2);
  const shimmerData = findFeatureData(features, FEATURE_MAPPINGS.shimmer);
  const jitterData = findFeatureData(features, FEATURE_MAPPINGS.jitter);
  
  // Require F0 data for fertility pathway
  if (!f0Data) {
    throw new Error("Missing F0 feature for FERTILITY pathway transformation");
  }
  
  // Convert F0 from semitones to Hz (simplified conversion)
  // F0semitoneFrom27.5Hz: semitone offset from 27.5Hz
  const f0Semitone = f0Data.feature_value;
  const f0Hz = 27.5 * Math.pow(2, f0Semitone / 12);
  
  // Require essential features for fertility pathway
  if (!f1Data || !f2Data || !jitterData || !shimmerData) {
    throw new Error("Missing required features for FERTILITY pathway transformation");
  }
  
  // Harmonic power (from formant analysis)
  const harmonicPower = (f1Data.feature_value + 1) * 0.5;
  
  // Jitter PPQ (simplified from jitter features)
  const jitterPPQ = Math.abs(jitterData.feature_value) * 0.6;
  
  // Cycle variance (from shimmer)
  const cycleVariance = Math.abs(shimmerData.z_score_0) * 0.5 + 1.5;
  
  // Shimmer APQ
  const shimmerAPQ = Math.abs(shimmerData.feature_value) * 0.1;
  
  // Formant ratio F1/F2
  const formantRatio = Math.abs(f1Data.feature_value) / Math.max(0.1, Math.abs(f2Data.feature_value));
  
  // Use appropriate F0 reference range based on biological sex
  const f0Reference = biologicalSex === "female" 
    ? REFERENCE_RANGES.f0_female 
    : REFERENCE_RANGES.f0_male;
  
  const labMetrics: LabMetric[] = [
    {
      label: "F0 FUNDAMENTAL",
      value: Math.round(f0Hz).toString(),
      unit: "Hz",
      reference: f0Reference.normal,
      status: determineStatus(f0Hz, f0Reference),
    },
    {
      label: "HARMONIC POWER",
      value: harmonicPower.toFixed(2),
      unit: "kHz",
      reference: "Norm: 1.5-2.5kHz",
      status: harmonicPower >= 1.5 && harmonicPower <= 2.5 ? "normal" : "low",
    },
    {
      label: "SHIMMER APQ",
      value: shimmerAPQ.toFixed(1),
      unit: "%",
      reference: "Norm: <5%",
      status: shimmerAPQ < 5 ? "normal" : "elevated",
    },
    {
      label: "JITTER PPQ",
      value: jitterPPQ.toFixed(2),
      unit: "%",
      reference: "Norm: <0.5%",
      status: determineStatus(jitterPPQ, { normal: "<0.5%", elevated: ">=0.5%" }),
    },
    {
      label: "CYCLE VARIANCE",
      value: cycleVariance.toFixed(1),
      unit: "σ",
      reference: "Norm: <1.5σ",
      status: cycleVariance < 1.5 ? "normal" : "elevated",
    },
    {
      label: "FORMANT RATIO",
      value: formantRatio.toFixed(2),
      unit: "F1/F2",
      reference: "Norm: 0.85-1.1",
      status: formantRatio >= 0.85 && formantRatio <= 1.1 ? "normal" : "elevated",
    },
  ];
  
  const biomarkers: BiomarkerDefinition[] = [
    {
      title: "F0 Fundamental",
      technicalName: "Base Pitch Frequency",
      value: Math.round(f0Hz).toString(),
      unit: "Hz",
      definition: "The fundamental frequency of the voice, determined by vocal fold mass and tension. Hormonal changes can alter F0 values across menstrual cycles and life stages.",
      clinicalContext: (biologicalSex === "female" && f0Hz < 165) || (biologicalSex === "male" && f0Hz < 85)
        ? "Slightly below typical range, which may reflect hormonal variation. Consider endocrine evaluation if persistent."
        : "F0 within normal range for your demographic.",
      normalRange: f0Reference.normal,
    },
    {
      title: "Harmonic Power",
      technicalName: "Spectral Energy Distribution",
      value: harmonicPower.toFixed(2),
      unit: "kHz",
      definition: "Peak frequency of harmonic energy in the voice spectrum. Shifts in harmonic power may indicate hormonal influences on vocal fold tissue.",
      clinicalContext: harmonicPower < 1.5
        ? "Below optimal range. Hormonal fluctuations may be affecting vocal quality."
        : "Harmonic power within normal parameters.",
      normalRange: "1.5-2.5kHz",
    },
    {
      title: "Jitter PPQ",
      technicalName: "Pitch Perturbation Quotient",
      value: jitterPPQ.toFixed(2),
      unit: "%",
      definition: "Five-point period perturbation quotient measuring pitch stability. Elevated values may correlate with hormonal imbalances affecting neuromuscular control.",
      clinicalContext: jitterPPQ >= 0.5
        ? "Slightly elevated. Consider hormonal panel if combined with other fertility markers."
        : "Jitter PPQ within normal range.",
      normalRange: "<0.5%",
    },
    {
      title: "Cycle Variance",
      technicalName: "Periodic Stability Index",
      value: cycleVariance.toFixed(1),
      unit: "σ",
      definition: "Standard deviation of vocal cycle lengths, indicating overall phonatory stability. Higher variance may reflect hormonal or metabolic influences.",
      clinicalContext: cycleVariance >= 1.5
        ? "Above normal variance. This pattern may warrant further endocrine investigation."
        : "Cycle variance within normal parameters.",
      normalRange: "<1.5σ",
    },
  ];
  
  return { labMetrics, biomarkers };
}

// ============================================================================
// Main Transformation Function
// ============================================================================

/**
 * Calculate pathway score from ranked features (using average absolute z-scores)
 */
function calculatePathwayScoreFromRankedFeatures(
  features: Record<string, FeatureData>
): number {
  const zScores = Object.values(features).map(f => Math.abs(f.z_score_0));
  if (zScores.length === 0) {
    return 50; // Default score if no features
  }
  
  const avgZScore = zScores.reduce((a, b) => a + b, 0) / zScores.length;
  // Lower z-scores (closer to normal) = higher score
  // Z-score of 0 = perfect (100), z-score of 2 = concerning (50), z-score of 4+ = critical (0)
  const score = Math.max(0, Math.min(100, 100 - (avgZScore * 12.5)));
  return Math.round(score);
}

/**
 * Transform API result into visualization-ready format
 * 
 * @param apiResult - Raw API result from MaaS analysis
 * @param pathway - Assessment pathway (BRAIN_AGE, LONGEVITY, MENTAL_HEALTH, FERTILITY)
 * @param biologicalSex - Optional biological sex for pathway-specific calculations
 * @returns VisualizedResult ready for display in Reveal and Detail Analysis pages
 */
export function transformApiResultToVisualization(
  apiResult: ApiResult,
  pathway: AssessmentPathway,
  biologicalSex?: "male" | "female"
): VisualizedResult {
  const likelihoodTier = apiResult.result?.likelihood_tier || "INCONCLUSIVE";
  const isInconclusive = likelihoodTier === "INCONCLUSIVE";
  
  // Extract audio quality (always extract if available)
  const signalQuality = extractAudioQuality(apiResult.result?.internal);
  
  // Extract flagging results (robustness and explanation)
  const flaggingResults = extractFlaggingResults(apiResult.result?.internal);
  
  // If inconclusive, return minimal result with only audio quality
  if (isInconclusive) {
    const pathwayName = pathway === "BRAIN_AGE" ? "COGNITIVE" 
      : pathway === "LONGEVITY" ? "RESPIRATORY"
      : pathway === "MENTAL_HEALTH" ? "AFFECTIVE"
      : pathway === "FERTILITY" ? "HORMONAL"
      : "BIOMETRIC";
    
    return {
      jobId: apiResult.job_id,
      createdAt: apiResult.created_at,
      status: apiResult.status,
      likelihoodTier,
      pathway: pathway || "BRAIN_AGE",
      score: 50, // Default score for inconclusive
      classification: `INCONCLUSIVE ${pathwayName} ASSESSMENT`,
      labMetrics: [], // No features shown for inconclusive
      biomarkers: [], // No features shown for inconclusive
      clinicalSubtext: "Results are inconclusive. Audio quality metrics are available below.",
      keyStat: {
        label: "Status",
        value: "Inconclusive",
        suffix: "",
      },
      confidence: mapLikelihoodTierToConfidence(likelihoodTier),
      robustness: flaggingResults.robustness,
      flaggingExplanation: flaggingResults.explanation,
      signalQuality,
    };
  }
  
  // Score, classification, confidence from likelihood tier (shared for full and minimal result)
  const score = calculateScoreFromLikelihoodTier(likelihoodTier);
  const classification = getClassificationFromLikelihoodTier(likelihoodTier, pathway);
  const confidence = mapLikelihoodTierToConfidence(likelihoodTier);

  const pathwayName = pathway === "BRAIN_AGE" ? "cognitive"
    : pathway === "LONGEVITY" ? "respiratory"
    : pathway === "MENTAL_HEALTH" ? "affective"
    : pathway === "FERTILITY" ? "hormonal"
    : pathway === "WELLNESS" ? "wellness"
    : "biometric";

  const upperTier = likelihoodTier.toUpperCase();
  const tierBasedSubtext =
    upperTier === "NO_RISK" ? `Analysis indicates optimal ${pathwayName} function.`
    : upperTier === "LOW" ? `Analysis shows stable ${pathwayName} variance.`
    : upperTier === "MODERATE" || upperTier === "HIGH"
      ? `${pathwayName.charAt(0).toUpperCase() + pathwayName.slice(1)} markers suggest elevated risk. Further assessment may be warranted.`
    : `Analysis shows ${pathwayName} variance.`;

  // No feature explanations at all. v2 payloads never reach here — they are
  // routed to transformV2ResultToVisualization upstream — so this is only the
  // guard for a malformed or truncated v1 result.
  if (!apiResult.result?.explanations?.feature_explanations?.features) {
    return {
      jobId: apiResult.job_id,
      createdAt: apiResult.created_at,
      status: apiResult.status,
      likelihoodTier,
      pathway: pathway || "BRAIN_AGE",
      score,
      classification,
      labMetrics: [],
      biomarkers: [],
      clinicalSubtext: tierBasedSubtext,
      keyStat: { label: "Status", value: upperTier.replace("_", " "), suffix: "" },
      confidence,
      robustness: flaggingResults.robustness,
      flaggingExplanation: flaggingResults.explanation,
      signalQuality,
    };
  }

  const features = apiResult.result.explanations.feature_explanations.features;

  // Transform ranked features using JSON lookup and RI stats
  const transformed = transformRankedFeatures(features);
  const labMetrics = transformed.labMetrics;
  const biomarkers = transformed.biomarkers;

  // Generate clinical subtext and key stat from top feature
  const sortedFeatures = Object.entries(features).sort((a, b) => {
    const rankA = a[1].rank ?? 999;
    const rankB = b[1].rank ?? 999;
    return rankA - rankB;
  });

  let clinicalSubtext = tierBasedSubtext;
  let keyStat: { label: string; value: string; suffix: string } = { label: "Status", value: upperTier.replace("_", " "), suffix: "" };

  if (sortedFeatures.length > 0) {
    const [topFeatureName, topFeatureData] = sortedFeatures[0];
    const topFeatureDesc = getFeatureDescription(topFeatureName);

    if (topFeatureDesc) {
      const formattedValue = formatFeatureValue(topFeatureData.feature_value, topFeatureDesc.units);
      keyStat = {
        label: topFeatureDesc.label,
        value: formattedValue,
        suffix: topFeatureDesc.units ? ` ${topFeatureDesc.units}` : "",
      };
    }
  }

  return {
    jobId: apiResult.job_id,
    createdAt: apiResult.created_at,
    status: apiResult.status,
    likelihoodTier,
    pathway: pathway || "BRAIN_AGE",
    score,
    classification,
    labMetrics,
    biomarkers,
    clinicalSubtext,
    keyStat,
    confidence,
    robustness: flaggingResults.robustness,
    flaggingExplanation: flaggingResults.explanation,
    signalQuality,
  };
}

/**
 * Export the transformation function as default
 */
export default transformApiResultToVisualization;
