import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useAssessment, BRAND_COLOR } from "@/context/AssessmentContext";

// Acceptability thresholds for audio quality metrics
const QUALITY_THRESHOLDS = {
  pesq: 1.1,
  stoi: 0.5,
  voicePercentage: 0.3,
  siSdr: -10.0, // dB
};

// Descriptions from feature_descriptions.json
const METRIC_DESCRIPTIONS = {
  pesq: "Average Perceptual Evaluation of Speech Quality score, measuring overall speech quality perception.",
  stoi: "Average Short-Time Objective Intelligibility score, measuring how intelligible the speech is.",
};

interface AnalysisFailedProps {
  onRestart: () => void;
}

export const AnalysisFailed = ({ onRestart }: AnalysisFailedProps) => {
  const { pathwayDisplayTitle, visualizedResult } = useAssessment();
  const assessmentTitle = pathwayDisplayTitle || "Assessment";

  const isInconclusive = visualizedResult?.likelihoodTier === "INCONCLUSIVE";
  const signalQuality = visualizedResult?.signalQuality;

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Subtle ambient gradient */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, hsla(0, 100%, 50%, 0.03) 0%, transparent 60%)",
        }}
      />

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-2xl mx-4 md:mx-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Error Icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.h1
          className="font-mono text-2xl md:text-3xl uppercase tracking-[0.15em] font-semibold mb-4"
          style={{ color: BRAND_COLOR }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isInconclusive ? "Inconclusive Results" : "Analysis Failed"}
        </motion.h1>

        <motion.p
          className="font-mono text-sm md:text-base text-black/60 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isInconclusive 
            ? "We were unable to complete a full analysis of your voice sample."
            : `We encountered an issue while processing your ${assessmentTitle.toLowerCase()} assessment.`
          }
        </motion.p>

        <motion.p
          className="font-mono text-xs md:text-sm text-black/50 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {isInconclusive
            ? "Audio quality metrics are available below. Please try recording again with better audio conditions."
            : "This may be due to audio quality, network connectivity, or a temporary service issue."
          }
        </motion.p>

        {/* Audio Quality Metrics for Inconclusive Results */}
        {isInconclusive && signalQuality && (
          <motion.div
            className="w-full max-w-md mx-auto mb-8 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="font-mono text-xs uppercase tracking-widest text-black/60 mb-4 pb-2 border-b border-black/10">
              Audio Quality Metrics
            </h2>
            
            {/* Explanation from flagging_results */}
            {visualizedResult?.flaggingExplanation && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="font-mono text-xs text-amber-200 leading-relaxed">
                  {visualizedResult.flaggingExplanation}
                </p>
              </div>
            )}
            
            <div className="space-y-0 divide-y divide-white/5 bg-black/40 rounded-lg overflow-hidden">
              {signalQuality.pesq !== undefined && (() => {
                const meetsThreshold = signalQuality.pesq > QUALITY_THRESHOLDS.pesq;
                return (
                  <div className="py-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white/50">PESQ Score</span>
                        {meetsThreshold ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-mono text-xs font-semibold"
                          style={{ color: meetsThreshold ? "#10B981" : "#EF4444" }}
                        >
                          {signalQuality.pesq.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">
                          (&gt;{QUALITY_THRESHOLDS.pesq})
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-white/40 mt-1">
                      {METRIC_DESCRIPTIONS.pesq}
                    </p>
                  </div>
                );
              })()}
              {signalQuality.stoi !== undefined && (() => {
                const meetsThreshold = signalQuality.stoi > QUALITY_THRESHOLDS.stoi;
                return (
                  <div className="py-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white/50">STOI Score</span>
                        {meetsThreshold ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-mono text-xs font-semibold"
                          style={{ color: meetsThreshold ? "#10B981" : "#EF4444" }}
                        >
                          {signalQuality.stoi.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">
                          (&gt;{QUALITY_THRESHOLDS.stoi})
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-white/40 mt-1">
                      {METRIC_DESCRIPTIONS.stoi}
                    </p>
                  </div>
                );
              })()}
              {signalQuality.snr !== undefined && (() => {
                const meetsThreshold = signalQuality.snr > QUALITY_THRESHOLDS.siSdr;
                return (
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/50">Signal-to-Noise Ratio (SI-SDR)</span>
                      {meetsThreshold ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-xs font-semibold"
                        style={{ color: meetsThreshold ? "#10B981" : "#EF4444" }}
                      >
                        {signalQuality.snr.toFixed(1)} dB
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        (&gt;{QUALITY_THRESHOLDS.siSdr}dB)
                      </span>
                    </div>
                  </div>
                );
              })()}
              {signalQuality.voicePercentage !== undefined && (() => {
                const meetsThreshold = signalQuality.voicePercentage > QUALITY_THRESHOLDS.voicePercentage;
                return (
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/50">Voice Percentage</span>
                      {meetsThreshold ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-xs font-semibold"
                        style={{ color: meetsThreshold ? "#10B981" : "#EF4444" }}
                      >
                        {(signalQuality.voicePercentage * 100).toFixed(1)}%
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        (&gt;{QUALITY_THRESHOLDS.voicePercentage * 100}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
              {signalQuality.duration !== undefined && (
                <div className="flex items-center justify-between py-3 px-4">
                  <span className="font-mono text-xs text-white/50">Duration</span>
                  <span className="font-mono text-xs text-white/80">
                    {signalQuality.duration.toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Restart Button */}
        <motion.button
          onClick={onRestart}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-lg font-mono text-sm uppercase tracking-widest font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #00D4FF 100%)`,
            color: '#000',
            boxShadow: `0 4px 20px ${BRAND_COLOR}40`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isInconclusive ? 0.9 : 0.7 }}
          whileHover={{ boxShadow: `0 6px 30px ${BRAND_COLOR}60` }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className="w-5 h-5" />
          <span>Restart Capture</span>
        </motion.button>

        {/* Help Text */}
        <motion.p
          className="font-mono text-[10px] text-black/40 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isInconclusive ? 1.0 : 0.8 }}
        >
          Please ensure you have a stable internet connection and try again.
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisFailed;
