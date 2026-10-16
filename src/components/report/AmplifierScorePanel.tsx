import { motion } from "framer-motion";
import type { ExtendedMetric, SignalSummary } from "@/lib/result-types";
import {
  amplifierScoreTier,
  amplifierScoreTierColor,
  amplifierScoreTierLabel,
  computeAmplifierScore,
} from "@/lib/amplifier-score";

interface AmplifierScorePanelProps {
  signals: SignalSummary[] | undefined;
  extendedMetrics: ExtendedMetric[] | undefined;
  showContent: boolean;
  isHighVis?: boolean;
  isSeniorMode?: boolean;
}

/**
 * One blended number out of 100, sitting right under the headline result and
 * above the per-metric Body Map breakdown. See lib/amplifier-score.ts for how
 * it is computed and why it averages bands rather than raw scores.
 *
 * Renders nothing when there is nothing to average (computeAmplifierScore
 * returns null) — no fabricated number for a result with no signals or
 * sub-dimensions.
 */
export const AmplifierScorePanel = ({
  signals,
  extendedMetrics,
  showContent,
  isHighVis = false,
  isSeniorMode = false,
}: AmplifierScorePanelProps) => {
  const result = computeAmplifierScore(signals, extendedMetrics);
  if (!result) return null;

  const tier = amplifierScoreTier(result.score);
  const tierLabel = amplifierScoreTierLabel(tier);
  const tierColor = amplifierScoreTierColor(tier, "dark");

  return (
    <motion.div
      className="px-4 py-3 border-b border-[#231200]/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 8 }}
      transition={{ delay: 1.05, duration: 0.3 }}
    >
      <h3
        className={`font-mono uppercase tracking-widest mb-2 ${
          isHighVis ? "text-[10px] md:text-xs font-semibold text-[#231200]" : "text-[9px] font-medium text-[#231200]"
        }`}
      >
        Amplifier Score
      </h3>

      <div
        className={`rounded-xl flex items-center gap-4 ${isSeniorMode ? "px-5 py-5" : "px-4 py-4"}`}
        style={{ backgroundColor: "#0B0B0A" }}
      >
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span
            className={`font-mono font-semibold leading-none ${
              isSeniorMode ? "text-5xl" : isHighVis ? "text-4xl" : "text-3xl"
            }`}
            style={{ color: tierColor, textShadow: `0 0 20px ${tierColor}40` }}
          >
            {result.score}
          </span>
          <span
            className={`font-mono text-white/40 leading-none ${isSeniorMode ? "text-lg" : "text-sm"}`}
          >
            / 100
          </span>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={`font-mono uppercase tracking-wider font-semibold ${
              isSeniorMode ? "text-base" : isHighVis ? "text-xs" : "text-[11px]"
            }`}
            style={{ color: tierColor }}
          >
            {tierLabel}
          </span>
          <span
            className={`font-mono text-white/50 ${isSeniorMode ? "text-xs" : "text-[9px]"}`}
          >
            Equal-weighted average of {result.metricCount} measurement
            {result.metricCount === 1 ? "" : "s"} from this session
          </span>
        </div>
      </div>
    </motion.div>
  );
};
