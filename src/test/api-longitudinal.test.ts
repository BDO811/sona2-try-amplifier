import { describe, expect, it } from "vitest";
import {
  deviationFromBaseline,
  type ApiLongitudinalSignal,
} from "@/lib/api-longitudinal-client";

/**
 * A real signal from the live group endpoint, captured 2026-09-14 against a
 * group holding all twenty of this account's done jobs. Trimmed to three data
 * points; every scalar is as returned.
 */
const LIVE_FATIGUE: ApiLongitudinalSignal = {
  name: "fatigue",
  status: "ok",
  baseline_score: 0.21258321231281635,
  latest_score: 0.3727680069876773,
  change_absolute: 0.27423127224500415,
  z_score: 0.5875461597639926,
  population_z: 0.6238752070869141,
  uncertainty: 0.24071506744495966,
  baseline_personal_weight: 0.28232691954793043,
  flagged_rate: 1.0,
  min_data_points_met: true,
  trajectory: {
    resolvable: false,
    data_points_used: 0,
    direction: "insufficient_data",
    slope: null,
  },
  data_points: [
    { recorded_at: "2026-09-08T16:32:07.361000Z", job_id: "e9779164", score: 0.09853673474267317, level: "consider", flagged: true, anomaly: null },
    { recorded_at: "2026-09-09T01:26:48.355000Z", job_id: "3657ac59", score: 0.4471547024289678, level: "moderate", flagged: true, anomaly: null },
    { recorded_at: "2026-09-11T22:32:00.593000Z", job_id: "b54b6c61", score: 0.3727680069876773, level: "moderate", flagged: true, anomaly: null },
  ],
};

describe("change_absolute", () => {
  it("is latest minus the first reading, not minus the baseline", () => {
    /*
      The trap this pins. Both readings are plausible, and reading it as a
      deviation from baseline overstates this move by about 70%: the real
      distance from baseline is 0.160 and change_absolute is 0.274.
    */
    const first = LIVE_FATIGUE.data_points[0].score;
    expect(LIVE_FATIGUE.change_absolute).toBeCloseTo(LIVE_FATIGUE.latest_score - first, 6);
    expect(LIVE_FATIGUE.change_absolute).not.toBeCloseTo(
      LIVE_FATIGUE.latest_score - LIVE_FATIGUE.baseline_score,
      3
    );
  });

  it("exposes the baseline deviation separately, since the payload has no field for it", () => {
    expect(deviationFromBaseline(LIVE_FATIGUE)).toBeCloseTo(0.16018, 4);
  });
});

describe("trajectory", () => {
  it("can decline to resolve even with twenty recordings behind it", () => {
    /*
      Observed on a group of twenty done jobs: resolvable false,
      data_points_used 0, direction "insufficient_data". Anything reading
      `direction` must handle that string rather than assuming rising, falling
      or flat, and must not infer a trend from data_points being non-empty.
    */
    expect(LIVE_FATIGUE.trajectory.resolvable).toBe(false);
    expect(LIVE_FATIGUE.trajectory.direction).toBe("insufficient_data");
    expect(LIVE_FATIGUE.trajectory.slope).toBeNull();
    expect(LIVE_FATIGUE.data_points.length).toBeGreaterThan(0);
  });
});

describe("data points", () => {
  it("carries the level alongside the score, so bands need no recomputation", () => {
    for (const p of LIVE_FATIGUE.data_points) {
      expect(["none", "low", "consider", "moderate", "elevated"]).toContain(p.level);
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(1);
    }
  });

  it("is ordered oldest first", () => {
    const times = LIVE_FATIGUE.data_points.map((p) => Date.parse(p.recorded_at));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
