import { motion } from "framer-motion";
import { SignalSummary } from "@/lib/cognitive-api-visual-mapping";
import { bandForLevel, bandScaleOptions } from "@/lib/signal-band";
import { OptionScale } from "./OptionScale";

interface SignalPanelProps {
  signals: SignalSummary[];
  showContent: boolean;
  isHighVis?: boolean;
  isSeniorMode?: boolean;
}

/**
 * The per-sign read from a v2 model job: one row per sign the model measures,
 * ranked most-severe first, each reported as a band.
 *
 * Each row shows every band in fixed order with only its own lit, so a signal's
 * position is read in place. The previous single-word-plus-bar treatment could
 * not do that: the word came from the level and the bar from the raw score, two
 * different scales, so five rows reading MEDIUM carried five different bar
 * lengths. The raw score is no longer drawn at all — it is a per-sign
 * probability, not a common one, so comparing it across rows invited a false
 * reading. See lib/signal-band.ts.
 */
export const SignalPanel = ({
  signals,
  showContent,
  isHighVis = false,
  isSeniorMode = false,
}: SignalPanelProps) => {
  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-px bg-white/5 rounded-lg overflow-hidden">
      {signals.map((signal, index) => {
        const band = bandForLevel(signal.level);

        return (
          <motion.div
            key={signal.name}
            className={`bg-black/60 ${
              isSeniorMode ? "px-4 py-4" : isHighVis ? "px-3.5 py-3" : "px-3 py-2.5"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 8 }}
            transition={{ delay: 1.15 + index * 0.06, duration: 0.3 }}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span
                className={`font-mono uppercase tracking-wider truncate ${
                  isSeniorMode
                    ? "text-sm font-semibold text-white/90"
                    : isHighVis
                      ? "text-[11px] font-medium text-white/80"
                      : "text-[10px] text-white/60"
                }`}
              >
                {signal.label}
              </span>
              {/* Only surfaced when the scale has nothing to light. */}
              {band === "INCONCLUSIVE" && (
                <span
                  className={`font-mono uppercase tracking-widest flex-shrink-0 text-white/40 ${
                    isSeniorMode ? "text-xs" : "text-[9px]"
                  }`}
                >
                  inconclusive
                </span>
              )}
            </div>

            <OptionScale
              options={bandScaleOptions()}
              activeKey={band === "INCONCLUSIVE" ? null : band}
              ariaLabel={`${signal.label}: ${band}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
