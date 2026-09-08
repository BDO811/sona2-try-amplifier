import { SubDimensionPanel } from "@/components/report/SubDimensionPanel";
import type { ExtendedMetric } from "@/lib/result-types";

/**
 * Renders a report panel on its own, at the width it occupies in the report, so
 * layout can be checked without recording audio.
 *
 * Gated on ?dev=true like /api-debug. The sample below is a real apex run, not
 * invented numbers, so the bands it lands in are the bands a real recording
 * produces — every sub-dimension between 0.413 and 0.534, which is the case the
 * 0.40-0.60 middle band was chosen for.
 */

const APEX_RUN: ExtendedMetric[] = [
  { metric_id: "sleep-disturbance", label: "Sleep Disturbance", score_mean: 0.534, score_std: 0.0721, low_anchor: "rested", high_anchor: "sluggish" },
  { metric_id: "fatigue", label: "Fatigue", score_mean: 0.4966, score_std: 0.0577, low_anchor: "invigorated", high_anchor: "exhausted" },
  { metric_id: "anhedonia", label: "Anhedonia", score_mean: 0.4919, score_std: 0.0617, low_anchor: "engaged", high_anchor: "disengaged" },
  { metric_id: "energy-level", label: "Energy Level", score_mean: 0.4854, score_std: 0.0591, low_anchor: "exuberant", high_anchor: "spiritless" },
  { metric_id: "burnout", label: "Burnout", score_mean: 0.4831, score_std: 0.0601, low_anchor: "engaged", high_anchor: "burned out" },
  { metric_id: "psychomotor-state", label: "Psychomotor State", score_mean: 0.4404, score_std: 0.0351, low_anchor: "calm", high_anchor: "frantic" },
  { metric_id: "concentration", label: "Concentration", score_mean: 0.4231, score_std: 0.0713, low_anchor: "focused", high_anchor: "inattentive" },
  { metric_id: "motivation", label: "Motivation", score_mean: 0.4133, score_std: 0.075, low_anchor: "driven", high_anchor: "unmotivated" },
  { metric_id: "vad-arousal", label: "Arousal", score_mean: 0.4312, score_std: 0.044, low_anchor: "calm", high_anchor: "activated" },
  { metric_id: "vad-dominance", label: "Sense of Dominance", score_mean: 0.4678, score_std: 0.0425, low_anchor: "submissive", high_anchor: "dominant" },
];

/** The same run pushed past both edges, so the end words can be checked too. */
const AT_THE_EDGES: ExtendedMetric[] = APEX_RUN.map((m, i) => ({
  ...m,
  score_mean: i % 2 === 0 ? 0.12 : 0.88,
}));

const PanelPreview = () => {
  const isDevMode = new URLSearchParams(window.location.search).get("dev") === "true";

  if (!isDevMode) {
    return (
      <div className="min-h-screen bg-[#F0EAE0] p-8">
        <p className="font-mono text-xs text-[#2E2E2E]">Add ?dev=true to enable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EAE0] py-8">
      {/*
        The report's entry animation is driven by requestAnimationFrame, which
        does not run while a tab is hidden — and a headless or embedded browser
        reports itself hidden, so every row would screenshot at opacity 0. This
        harness exists to be looked at, so it pins the settled state.
      */}
      <style>{`
        [data-panel-preview] [style*="opacity"] {
          opacity: 1 !important;
          transform: none !important;
        }
      `}</style>

      {/* 420px is the report's own content width. */}
      <div className="mx-auto" data-panel-preview style={{ maxWidth: 420 }}>
        <h1 className="font-mono text-[10px] uppercase tracking-widest text-[#231200] mb-1 px-4">
          Sub-Dimensions · real apex run
        </h1>
        <div className="px-4 py-3">
          <SubDimensionPanel metrics={APEX_RUN} showContent />
        </div>

        <h1 className="font-mono text-[10px] uppercase tracking-widest text-[#231200] mb-1 mt-6 px-4">
          Same run forced to both edges
        </h1>
        <div className="px-4 py-3">
          <SubDimensionPanel metrics={AT_THE_EDGES} showContent />
        </div>

        <h1 className="font-mono text-[10px] uppercase tracking-widest text-[#231200] mb-1 mt-6 px-4">
          Senior mode
        </h1>
        <div className="px-4 py-3">
          <SubDimensionPanel metrics={APEX_RUN} showContent isSeniorMode />
        </div>
      </div>
    </div>
  );
};

export default PanelPreview;
