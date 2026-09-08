import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Brand color for static UI frame elements
const BRAND_COLOR = "#1E5631";

interface SystemStatusBarProps {
  showContent: boolean;
  statusColor: string; // Still passed for robustness display (data-driven)
  robustness?: number; // Optional: use from visualized result if available (0-1 scale)
}

export const SystemStatusBar = ({ showContent, statusColor, robustness: propRobustness }: SystemStatusBarProps) => {
  const [blinkOn, setBlinkOn] = useState(true);
  const [robustness, setRobustness] = useState(propRobustness ?? 0.92);

  // Blink effect for status indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkOn((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Use robustness from visualized result if provided
  useEffect(() => {
    if (propRobustness !== undefined) {
      setRobustness(propRobustness);
    }
  }, [propRobustness]);

  return (
    <motion.div
      className="flex items-center justify-between px-4 py-2 border-b border-[#231200]/10 font-mono text-[9px] md:text-[10px] uppercase tracking-wider"
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Sensor Status - Uses brand color (static UI) */}
      <div className="flex items-center gap-2">
        <motion.span
          className="w-1.5 h-1.5 rounded-full"
          style={{ 
            backgroundColor: BRAND_COLOR,
            boxShadow: blinkOn ? `0 0 8px ${BRAND_COLOR}` : 'none',
          }}
          animate={{ opacity: blinkOn ? 1 : 0.4 }}
          transition={{ duration: 0.15 }}
        />
        <span className="text-[#2E2E2E]">
          Sensor: <span style={{ color: BRAND_COLOR }}>Active</span>
        </span>
      </div>

      {/* Divider */}
      <span className="hidden md:block text-[#4B2700]/50">|</span>

      {/* Sample Rate */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[#2E2E2E]">
          Sample Rate: <span className="text-[#231200] font-medium">48kHz</span>
        </span>
      </div>

      {/* Divider */}
      <span className="text-[#4B2700]/50">|</span>

      {/* Model Version */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[#2E2E2E]">
          Model: <span className="text-[#231200] font-medium">SONA-2.0</span>
        </span>
      </div>
    </motion.div>
  );
};
