import { motion } from "framer-motion";
import { SignalSummary } from "@/lib/cognitive-api-visual-mapping";
import { bandColor, bandFill, bandForLevel } from "@/lib/signal-band";

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
 * Both the word and the bar come from the band, so they cannot disagree. The
 * raw 0-1 score is deliberately not drawn: it is a per-sign probability, not a
 * common scale, so comparing bar lengths across rows invited a false reading.
 * See lib/signal-band.ts.
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
        const color = bandColor(band);
        const pct = bandFill(band);

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
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
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
              <span
                className={`font-mono uppercase tracking-widest flex-shrink-0 ${
                  isSeniorMode ? "text-xs font-semibold" : isHighVis ? "text-[10px]" : "text-[9px]"
                }`}
                style={{ color }}
              >
                {band}
              </span>
            </div>

            {/* Signal strength bar */}
            <div className="relative h-1 w-full rounded-full overflow-hidden bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: showContent ? `${pct}%` : 0 }}
                transition={{ delay: 1.25 + index * 0.06, duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
