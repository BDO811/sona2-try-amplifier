import { describe, it, expect } from "vitest";
import {
  isV2Result,
  transformV2ResultToVisualization,
  v2LevelToLikelihoodTier,
  V2JobDetail,
} from "@/lib/v2-api-visual-mapping";

// A real, unedited response from the deployed analyzeAudio Cloud Function
// (Amplifier v2 API, model "pulse") captured 2026-09-05 against a 36s sample.
import realPulseResponse from "./fixtures-v2-pulse-response.json";

const job = realPulseResponse as unknown as V2JobDetail;

describe("v2 result detection", () => {
  it("recognises a v2 payload", () => {
    expect(isV2Result(job.result)).toBe(true);
  });

  it("does not mistake a legacy v1 payload for v2", () => {
    const v1 = { explanations: { feature_explanations: { features: {}, error: null, status: "ok" } } };
    expect(isV2Result(v1)).toBe(false);
  });
});

describe("v2 level → likelihood tier", () => {
  it("maps every documented level", () => {
    expect(v2LevelToLikelihoodTier("none")).toBe("NO_RISK");
    expect(v2LevelToLikelihoodTier("low")).toBe("LOW");
    expect(v2LevelToLikelihoodTier("consider")).toBe("MODERATE");
    expect(v2LevelToLikelihoodTier("moderate")).toBe("MODERATE");
    expect(v2LevelToLikelihoodTier("elevated")).toBe("HIGH");
    expect(v2LevelToLikelihoodTier("inconclusive")).toBe("INCONCLUSIVE");
  });
});

describe("transformV2ResultToVisualization on a real pulse response", () => {
  const visualized = transformV2ResultToVisualization(job, "WELLNESS");

  it("counts flags over the shown signals, not the API total", () => {
    // summary.flagged_count on this sample is 5 across six measured signals.
    // With one suppressed, a screen reading "5 of 6" would sit above five rows.
    expect(visualized.totalSignals).toBe(5);
    expect(visualized.flaggedCount).toBe(5);
  });

  it("carries job metadata through", () => {
    expect(visualized.jobId).toBe("36a1f294-376e-45f6-9f34-6bbc3a6059c3");
    expect(visualized.status).toBe("done");
    expect(visualized.modelName).toBe("pulse");
  });

  it("derives the tier from the summary's overall level", () => {
    // overall_level on this sample is "moderate"
    expect(visualized.likelihoodTier).toBe("MODERATE");
  });

  it("leads the headline with what is holding up, without a risk verdict", () => {
    // On this sample the only signal reading low was elevated-blood-pressure,
    // which is now suppressed. With it gone nothing reads clean, so the result
    // grades down a rung: it read STEADY WELLNESS BASELINE while that signal
    // was still shown. Suppressing a sign changes the grading, not just the
    // list of rows.
    expect(visualized.classification).toBe("WELLNESS PROFILE NEEDS IMPROVEMENT");
    for (const word of ["ELEVATED", "RISK", "OPTIMAL", "STABLE"]) {
      expect(visualized.classification).not.toContain(word);
    }
  });

  it("maps the shown pulse signals into biomarkers, most severe first", () => {
    // pulse returns six; elevated-blood-pressure is suppressed, so five show.
    expect(visualized.biomarkers).toHaveLength(5);
    expect(visualized.signals).toHaveLength(5);
    expect(visualized.signals?.map((s) => s.name)).not.toContain("elevated-blood-pressure");
    expect(visualized.biomarkers.map((b) => b.technicalName)).not.toContain(
      "elevated-blood-pressure"
    );
    // every biomarker has real display copy, not a placeholder
    for (const b of visualized.biomarkers) {
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.definition.length).toBeGreaterThan(20);
      expect(b.value).toMatch(/^\d+$/);
      expect(b.unit).toBe("%");
    }
  });

  it("maps all eleven vocal features into lab metrics with reference ranges", () => {
    expect(visualized.labMetrics).toHaveLength(11);
    const hnr = visualized.labMetrics.find((m) => m.label === "HNR");
    expect(hnr).toBeDefined();
    expect(hnr?.unit).toBe("dB");
    expect(hnr?.value).toBe("9.41");
    expect(hnr?.reference).toBe("> 7 dB");
    // "slightly elevated" must not be read as "within range"
    expect(hnr?.status).toBe("elevated");

    const pitch = visualized.labMetrics.find((m) => m.label === "PITCH");
    expect(pitch?.status).toBe("normal");
    expect(pitch?.value).toBe("170");
  });

  it("passes the thirteen extended metrics through", () => {
    expect(visualized.extendedMetrics).toHaveLength(13);
    const fatigue = visualized.extendedMetrics?.find((m) => m.metric_id === "fatigue");
    expect(fatigue?.low_anchor).toBe("invigorated");
    expect(fatigue?.high_anchor).toBe("exhausted");
  });

  it("uses the API's own narrative, not a generic tier sentence", () => {
    expect(visualized.clinicalSubtext).toContain("5 elevated signals");
    expect(visualized.clinicalSubtext).not.toContain("Analysis shows");
  });

  it("reports the flagged count over the shown signals", () => {
    // The API measured six and flagged five. One is suppressed, so the stat
    // must read over the five that appear, not the six that were measured.
    expect(visualized.flaggedCount).toBe(5);
    expect(visualized.totalSignals).toBe(5);
    expect(visualized.keyStat).toEqual({
      label: "Signals Flagged",
      value: "5",
      suffix: " / 5",
    });
  });

  it("derives the score from actual signal strength, not the tier alone", () => {
    // Scored over the shown signals only, so dropping the suppressed one moves
    // this: max 0.5555 (anxiety) with a higher mean now that the lowest signal
    // is gone.
    expect(visualized.score).toBe(52);
    // a tier-only mapping would have produced a flat 50
    expect(visualized.score).not.toBe(50);
  });

  it("maps audio quality into signal quality", () => {
    // v2 reports voice_percentage as 0-100; the report screens multiply by 100,
    // so the mapper must hand them the 0-1 fraction (96.5% must not render 9650%).
    expect(visualized.signalQuality?.voicePercentage).toBeCloseTo(0.965, 4);
    // audio_clarity is a 0-100 score, NOT a dB SI-SDR — it must not land in snr.
    expect(visualized.signalQuality?.audioClarity).toBe(96.4);
    expect(visualized.signalQuality?.snr).toBe(0);
    expect(visualized.signalQuality?.sampleRate).toBe("48kHz");
    expect(visualized.signalQuality?.duration).toBeCloseTo(36.506, 2);
    expect(visualized.flaggingExplanation).toBeUndefined(); // issues[] is empty
  });
});

describe("condition jobs (singular signal, no summary)", () => {
  const conditionJob: V2JobDetail = {
    job_id: "cond-1",
    status: "done",
    created_at: "2026-09-05T00:00:00",
    job_type: "condition",
    result: {
      signal: {
        name: "fatigue",
        label: "Fatigue",
        score: 0.72,
        level: "elevated",
        flagged: true,
        description: {
          vocal_features: [
            {
              feature: "voice_jitter",
              label: "Voice Jitter",
              value: 1.4,
              unit: "%",
              value_interpretation: "elevated",
            },
          ],
        },
      },
      audio_quality: { voice_percentage: 88.1, audio_clarity: 91.2, issues: [] },
      extended_metrics: [],
    },
  };

  it("handles the singular signal shape", () => {
    const v = transformV2ResultToVisualization(conditionJob, "WELLNESS");
    expect(v.likelihoodTier).toBe("HIGH");
    expect(v.biomarkers).toHaveLength(1);
    expect(v.labMetrics).toHaveLength(1);
    expect(v.flaggedCount).toBe(1);
    expect(v.totalSignals).toBe(1);
    expect(v.clinicalSubtext).toContain("Fatigue");
  });
});

describe("inconclusive / low-quality audio", () => {
  it("returns an inconclusive tier and no crash when signals are empty", () => {
    const v = transformV2ResultToVisualization(
      {
        job_id: "j",
        status: "done",
        result: {
          signals: [],
          extended_metrics: [],
          audio_quality: { voice_percentage: 4.2, audio_clarity: 20, issues: ["low_voice_percentage"] },
        },
      },
      "WELLNESS"
    );
    expect(v.likelihoodTier).toBe("INCONCLUSIVE");
    expect(v.score).toBe(50);
    expect(v.biomarkers).toHaveLength(0);
    expect(v.flaggingExplanation).toBe("low_voice_percentage");
  });
});
