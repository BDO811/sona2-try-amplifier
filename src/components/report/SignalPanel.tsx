import { motion } from "framer-motion";
import { SignalSummary } from "@/lib/cognitive-api-visual-mapping";

interface SignalPanelProps {
  signals: SignalSummary[];
  showContent: boolean;
  isHighVis?: boolean;
  isSeniorMode?: boolean;
}

/**
 * Colour per v2 severity level. Matches the thresholds used by
 * BiometricLabGrid so a signal and a lab metric of equivalent severity read
 * the same across the report.
 */
const LEVEL_COLOR: Record<string, string> = {
  none: "#10B981",
  low: "#10B981",
  consider: "#F59E0B",
  moderate: "#F59E0B",
  elevated: "#EF4444",
  inconclusive: "#6B7280",
};

const levelColor = (level: string): string =>
  LEVEL_COLOR[(level || "").toLowerCase()] ?? "#6B7280";

/**
 * The per-sign read from a v2 model job: one row per sign the model measures,
 * ranked most-severe first, with the model's own 0-1 score as a bar.
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
        const color = levelColor(signal.level);
        const pct = Math.round((Number.isFinite(signal.score) ? signal.score : 0) * 100);

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
                {signal.flagged ? signal.level : "not flagged"}
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
