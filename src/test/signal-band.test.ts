import { describe, expect, it } from "vitest";
import {
  BAND_ORDER,
  bandColor,
  bandFill,
  bandForLevel,
  bandRank,
  type SignalBand,
} from "@/lib/signal-band";

/** Every level the v2 API documents, with whether it sets flagged=true. */
const API_LEVELS: Array<{ level: string; flagged: boolean; band: SignalBand }> = [
  { level: "none", flagged: false, band: "NONE" },
  { level: "low", flagged: false, band: "LOW" },
  { level: "consider", flagged: true, band: "MEDIUM" },
  { level: "moderate", flagged: true, band: "HIGH" },
  { level: "elevated", flagged: true, band: "VERY HIGH" },
  { level: "inconclusive", flagged: false, band: "INCONCLUSIVE" },
];

describe("bandForLevel", () => {
  it("maps every documented level to its band", () => {
    for (const { level, band } of API_LEVELS) {
      expect(bandForLevel(level)).toBe(band);
    }
  });

  it("is case insensitive, since level casing is not guaranteed", () => {
    expect(bandForLevel("MODERATE")).toBe("HIGH");
    expect(bandForLevel("Consider")).toBe("MEDIUM");
  });

  it("reads an unknown or missing level as inconclusive, never as none", () => {
    // "none" is a claim that nothing was detected. An unrecognised level is not
    // evidence of that, so it must not borrow the claim.
    for (const value of ["", null, undefined, "severe", "critical"]) {
      expect(bandForLevel(value)).toBe("INCONCLUSIVE");
    }
  });

  it("keeps none distinct from low", () => {
    expect(bandForLevel("none")).not.toBe(bandForLevel("low"));
  });

  it("never puts a flagged level in a band below an unflagged one", () => {
    const worstUnflagged = Math.max(
      ...API_LEVELS.filter((l) => !l.flagged && l.band !== "INCONCLUSIVE").map((l) =>
        bandRank(l.band)
      )
    );
    const bestFlagged = Math.min(...API_LEVELS.filter((l) => l.flagged).map((l) => bandRank(l.band)));
    expect(bestFlagged).toBeGreaterThan(worstUnflagged);
  });
});

describe("bandFill", () => {
  it("rises monotonically across the severity scale", () => {
    const fills = BAND_ORDER.map(bandFill);
    for (let i = 1; i < fills.length; i++) {
      expect(fills[i]).toBeGreaterThan(fills[i - 1]);
    }
  });

  it("runs from empty to full", () => {
    expect(bandFill("NONE")).toBe(0);
    expect(bandFill("VERY HIGH")).toBe(100);
  });

  it("draws nothing for an unreadable signal", () => {
    expect(bandFill("INCONCLUSIVE")).toBe(0);
  });

  it("stays within the width of the bar", () => {
    for (const band of [...BAND_ORDER, "INCONCLUSIVE" as SignalBand]) {
      expect(bandFill(band)).toBeGreaterThanOrEqual(0);
      expect(bandFill(band)).toBeLessThanOrEqual(100);
    }
  });
});

describe("bandColor", () => {
  it("gives every band its own colour", () => {
    const all: SignalBand[] = [...BAND_ORDER, "INCONCLUSIVE"];
    const colors = all.map(bandColor);
    expect(new Set(colors).size).toBe(all.length);
  });

  it("uses no lime green", () => {
    const banned = ["#c8f579", "#c7f25e", "#9cc73a", "#abd150", "#8eff84"];
    for (const band of [...BAND_ORDER, "INCONCLUSIVE" as SignalBand]) {
      expect(banned).not.toContain(bandColor(band).toLowerCase());
    }
  });

  it("uses no retired cyan or emerald", () => {
    const retired = ["#22d3ee", "#10b981"];
    for (const band of [...BAND_ORDER, "INCONCLUSIVE" as SignalBand]) {
      expect(retired).not.toContain(bandColor(band).toLowerCase());
    }
  });
});

describe("the calibration trap", () => {
  it("keeps a low-scoring flagged signal above a higher-scoring unflagged one", () => {
    // Straight from a real apex run: cognitive load scored 0.120 and came back
    // "consider"; head impact scored 0.144 and came back "low". Banding by score
    // would invert these. Banding by level must not.
    const cognitiveLoad = bandForLevel("consider");
    const headImpact = bandForLevel("low");

    expect(bandRank(cognitiveLoad)).toBeGreaterThan(bandRank(headImpact));
    expect(bandFill(cognitiveLoad)).toBeGreaterThan(bandFill(headImpact));
  });

  it("bands a whole real payload without reading the score at all", () => {
    const run = [
      { label: "Anxiety", score: 0.57, level: "moderate" },
      { label: "Fatigue", score: 0.39, level: "moderate" },
      { label: "Dehydration", score: 0.273, level: "consider" },
      { label: "Stress", score: 0.163, level: "consider" },
      { label: "Head Impact", score: 0.144, level: "low" },
      { label: "Cardiovascular Strain", score: 0.14, level: "low" },
      { label: "Cognitive Load", score: 0.12, level: "consider" },
    ];
    expect(run.map((s) => bandForLevel(s.level))).toEqual([
      "HIGH",
      "HIGH",
      "MEDIUM",
      "MEDIUM",
      "LOW",
      "LOW",
      "MEDIUM",
    ]);
  });
});
