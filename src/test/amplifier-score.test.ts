import { describe, expect, it } from "vitest";
import {
  amplifierScoreTier,
  amplifierScoreTierColor,
  amplifierScoreTierLabel,
  computeAmplifierScore,
} from "@/lib/amplifier-score";
import type { ExtendedMetric, SignalSummary } from "@/lib/result-types";
import { SUB_DIMENSIONS } from "@/lib/sub-dimensions";

function signal(overrides: Partial<SignalSummary> & Pick<SignalSummary, "name">): SignalSummary {
  return { label: overrides.name, score: 0, level: "none", flagged: false, ...overrides };
}

function metric(overrides: Partial<ExtendedMetric> & Pick<ExtendedMetric, "metric_id">): ExtendedMetric {
  return {
    label: overrides.metric_id,
    score_mean: 0.5,
    score_std: 0,
    low_anchor: "low",
    high_anchor: "high",
    ...overrides,
  };
}

describe("computeAmplifierScore", () => {
  it("returns null when there are no signals and no matching sub-dimensions", () => {
    expect(computeAmplifierScore([], [])).toBeNull();
    expect(computeAmplifierScore(undefined, undefined)).toBeNull();
  });

  it("scores a single NORMAL signal as 100", () => {
    const result = computeAmplifierScore([signal({ name: "fatigue", level: "none" })], []);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.metricCount).toBe(1);
  });

  it("scores a single ELEVATED signal as 0", () => {
    const result = computeAmplifierScore([signal({ name: "fatigue", level: "elevated" })], []);
    expect(result!.score).toBe(0);
  });

  it("spaces LOW and MODERATE evenly between NORMAL and ELEVATED", () => {
    // consider -> LOW band -> 66.67, moderate -> MODERATE band -> 33.33
    const low = computeAmplifierScore([signal({ name: "fatigue", level: "consider" })], []);
    const moderate = computeAmplifierScore([signal({ name: "fatigue", level: "moderate" })], []);
    expect(low!.score).toBe(Math.round(200 / 3));
    expect(moderate!.score).toBe(Math.round(100 / 3));
  });

  it("excludes inconclusive signals from both the sum and the count", () => {
    const result = computeAmplifierScore(
      [
        signal({ name: "fatigue", level: "none" }),
        signal({ name: "stress", level: "inconclusive" }),
      ],
      []
    );
    // Only the NORMAL signal counts, so this is 100, not an average dragged down
    // by treating the inconclusive reading as 0.
    expect(result!.score).toBe(100);
    expect(result!.metricCount).toBe(1);
  });

  it("returns null when every signal is inconclusive and there are no sub-dimensions", () => {
    expect(computeAmplifierScore([signal({ name: "fatigue", level: "inconclusive" })], [])).toBeNull();
  });

  it("averages a mix of signals and sub-dimensions with equal weight", () => {
    // One NORMAL signal (100) + one sub-dimension at its low anchor (100) +
    // one sub-dimension at its high anchor (0) = (100 + 100 + 0) / 3 = 66.67 -> 67
    const result = computeAmplifierScore(
      [signal({ name: "fatigue", level: "none" })],
      [metric({ metric_id: "sleep-disturbance", score_mean: 0.1 }), metric({ metric_id: "burnout", score_mean: 0.9 })]
    );
    expect(result!.metricCount).toBe(3);
    expect(result!.score).toBe(Math.round(200 / 3));
  });

  it("treats a sub-dimension's NORMAL middle band the same as its good anchor", () => {
    const atGoodAnchor = computeAmplifierScore([], [metric({ metric_id: "fatigue", score_mean: 0.1 })]);
    const atNormalMiddle = computeAmplifierScore([], [metric({ metric_id: "fatigue", score_mean: 0.5 })]);
    expect(atGoodAnchor!.score).toBe(100);
    expect(atNormalMiddle!.score).toBe(100);
  });

  it("scores a sub-dimension past its high anchor as 0", () => {
    const result = computeAmplifierScore([], [metric({ metric_id: "fatigue", score_mean: 0.9 })]);
    expect(result!.score).toBe(0);
  });

  it("ignores extended_metrics entries with no matching shown sub-dimension config", () => {
    // vad-arousal and vad-dominance are configured but shown: false.
    const result = computeAmplifierScore(
      [],
      [metric({ metric_id: "vad-arousal", score_mean: 0.9 }), metric({ metric_id: "nonexistent-metric", score_mean: 0.9 })]
    );
    expect(result).toBeNull();
  });

  it("divides by the total metric count, not by metric type", () => {
    const sevenNormalSignals: SignalSummary[] = Array.from({ length: 7 }, (_, i) =>
      signal({ name: `signal-${i}`, level: "none" })
    );
    const eightShownSubDimensionIds = SUB_DIMENSIONS.filter((c) => c.shown).map((c) => c.id);
    expect(eightShownSubDimensionIds.length).toBe(8);
    const eightGoodSubDimensions = eightShownSubDimensionIds.map((id) => metric({ metric_id: id, score_mean: 0.1 }));

    const result = computeAmplifierScore(sevenNormalSignals, eightGoodSubDimensions);
    expect(result!.metricCount).toBe(15);
    expect(result!.score).toBe(100);
  });

  it("applies the percentile-bucketed override (cardiovascular-strain) through the same band lookup", () => {
    // Raw score above the 0.95 cutoff bands ELEVATED regardless of level.
    const result = computeAmplifierScore(
      [signal({ name: "cardiovascular-strain", level: "none", score: 0.97 })],
      []
    );
    expect(result!.score).toBe(0);
  });

  it("applies the flag-only-when-elevated override (head-impact) through the same band lookup", () => {
    // consider would normally band LOW, but head-impact only flags at ELEVATED.
    const result = computeAmplifierScore(
      [signal({ name: "head-impact", level: "consider", score: 0.4 })],
      []
    );
    expect(result!.score).toBe(100);
  });
});

describe("amplifierScoreTier", () => {
  it("buckets the documented thresholds", () => {
    expect(amplifierScoreTier(100)).toBe("strong");
    expect(amplifierScoreTier(85)).toBe("strong");
    expect(amplifierScoreTier(84)).toBe("good");
    expect(amplifierScoreTier(65)).toBe("good");
    expect(amplifierScoreTier(64)).toBe("fair");
    expect(amplifierScoreTier(40)).toBe("fair");
    expect(amplifierScoreTier(39)).toBe("attention");
    expect(amplifierScoreTier(0)).toBe("attention");
  });

  it("gives every tier a label and a dark/light color", () => {
    (["strong", "good", "fair", "attention"] as const).forEach((tier) => {
      expect(amplifierScoreTierLabel(tier)).toBeTruthy();
      expect(amplifierScoreTierColor(tier, "dark")).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(amplifierScoreTierColor(tier, "light")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
