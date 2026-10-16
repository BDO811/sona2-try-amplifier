import type { ExtendedMetric, SignalSummary } from "@/lib/result-types";
import { bandForSignal, type DisplayBand } from "@/lib/signal-band";
import { SUB_DIMENSIONS, bandIndexFor } from "@/lib/sub-dimensions";

/**
 * One combined number out of 100: every signal and every shown sub-dimension
 * from this result, weighted equally, averaged.
 *
 * Why this averages the displayed BAND rather than the raw 0-1 score: the v2
 * Display Guidelines are explicit that score is "for internal use only; use
 * level for display" and that score-to-level is "a distribution-based
 * calibration unique to each model, rather than fixed numeric ranges" (see
 * the header comment in signal-band.ts, and the real apex run quoted there
 * where a 0.359 reads `consider` and a lower 0.273 reads `moderate`). A raw
 * average across signs would be averaging numbers the vendor itself says are
 * not on a shared scale. The band is the one place a sign has already been
 * normalised against its own model's calibration into something comparable
 * row to row, so that is what this averages instead.
 *
 * Sub-dimensions carry no vendor-calibrated level at all, only score_mean
 * against a fixed low/high anchor pair. sub-dimensions.ts already buckets
 * that into low / NORMAL / high (0.40-0.60 = NORMAL); this reuses that same
 * bucket as the sub-dimension's equivalent of a band.
 *
 * Equal weight per metric, not per metric type or per zone: a result with 7
 * signals and 8 sub-dimensions divides by 15, not by 2. Inconclusive signals
 * are left out of both the sum and the count — an unreadable reading is a
 * data-quality gap, not a measurement of zero, and should not silently drag
 * the average down.
 */

/** Four bands, evenly spaced 100/66.67/33.33/0 so each step down costs the same. */
const SIGNAL_BAND_POINTS: Record<DisplayBand, number> = {
  NORMAL: 100,
  LOW: 200 / 3,
  MODERATE: 100 / 3,
  ELEVATED: 0,
  // Never read: INCONCLUSIVE signals are filtered out before this lookup runs.
  INCONCLUSIVE: 0,
};

/**
 * 0 = the low anchor (the good direction on every currently shown
 * sub-dimension, e.g. ENERGETIC, UPBEAT, FRESH), 1 = NORMAL, 2 = the high
 * anchor (TIRED, FLAT, DEPLETED). Both 0 and 1 score full points: nothing
 * above "normal" is being measured here, only whether a reading has crossed
 * into its concerning direction. See sub-dimensions.ts's bandIndexFor.
 */
const SUB_DIMENSION_BAND_POINTS: Record<0 | 1 | 2, number> = {
  0: 100,
  1: 100,
  2: 0,
};

export interface AmplifierScoreMetric {
  id: string;
  label: string;
  kind: "signal" | "sub-dimension";
  /** This metric's 0-100 contribution, before averaging. */
  points: number;
}

export interface AmplifierScoreResult {
  /** 0-100, rounded to the nearest whole number. */
  score: number;
  metricCount: number;
  metrics: AmplifierScoreMetric[];
}

/**
 * Null when there is nothing to average: no signals, no shown sub-dimensions
 * present in this result, or every signal came back inconclusive. A results
 * screen should render nothing rather than a fabricated 0 or 100.
 */
export function computeAmplifierScore(
  signals: SignalSummary[] | undefined,
  extendedMetrics: ExtendedMetric[] | undefined
): AmplifierScoreResult | null {
  const metrics: AmplifierScoreMetric[] = [];

  for (const signal of signals ?? []) {
    const band = bandForSignal(signal.name, signal.level, signal.score);
    if (band === "INCONCLUSIVE") continue;
    metrics.push({
      id: signal.name,
      label: signal.label,
      kind: "signal",
      points: SIGNAL_BAND_POINTS[band],
    });
  }

  const metricById = new Map((extendedMetrics ?? []).map((m) => [m.metric_id, m]));
  for (const config of SUB_DIMENSIONS.filter((c) => c.shown)) {
    const metric = metricById.get(config.id);
    if (!metric) continue;
    const bandIndex = bandIndexFor(metric.score_mean);
    metrics.push({
      id: config.id,
      label: config.label,
      kind: "sub-dimension",
      points: SUB_DIMENSION_BAND_POINTS[bandIndex],
    });
  }

  if (metrics.length === 0) return null;

  const total = metrics.reduce((sum, m) => sum + m.points, 0);
  return {
    score: Math.round(total / metrics.length),
    metricCount: metrics.length,
    metrics,
  };
}

export type AmplifierScoreTier = "strong" | "good" | "fair" | "attention";

/**
 * Four tiers rather than reusing the signal DisplayBand words: NORMAL/LOW/
 * MODERATE/ELEVATED are a risk vocabulary for one measurement, and this is a
 * blended wellness composite across every measurement, not a clinical
 * finding. Thresholds are this score's own: 85+ is "most readings landed
 * fully in range", under 40 is "most readings crossed into their concerning
 * direction".
 */
export function amplifierScoreTier(score: number): AmplifierScoreTier {
  if (score >= 85) return "strong";
  if (score >= 65) return "good";
  if (score >= 40) return "fair";
  return "attention";
}

const TIER_LABEL: Record<AmplifierScoreTier, string> = {
  strong: "Strong",
  good: "Good",
  fair: "Fair",
  attention: "Needs Attention",
};

/** Dark/light hex per tier. Same four-colour ramp as signal-band.ts's BAND_COLOR, in the same order. */
const TIER_COLOR: Record<AmplifierScoreTier, { dark: string; light: string }> = {
  strong: { dark: "#4CAF6E", light: "#1E5631" },
  good: { dark: "#F5EF79", light: "#6D5200" },
  fair: { dark: "#FFC163", light: "#8A3B08" },
  attention: { dark: "#FF6173", light: "#8E1220" },
};

export function amplifierScoreTierLabel(tier: AmplifierScoreTier): string {
  return TIER_LABEL[tier];
}

export function amplifierScoreTierColor(tier: AmplifierScoreTier, surface: "dark" | "light" = "dark"): string {
  return TIER_COLOR[tier][surface];
}
