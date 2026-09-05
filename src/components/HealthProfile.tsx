import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArchetypeData } from "./AnalysisAnimation";
import { useAssessment, AssessmentPathway, BRAND_COLOR, getIsHighVis, getIsSeniorMode } from "@/context/AssessmentContext";
import { AlertTriangle, Bell, Calendar, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PartnerHandoffModal } from "./PartnerHandoffModal";
import { SpectrogramWaveform } from "./report/SpectrogramWaveform";
import { BiometricLabGrid } from "./report/BiometricLabGrid";
import { SignalPanel } from "./report/SignalPanel";
import { SystemStatusBar } from "./report/SystemStatusBar";
import { formatLikelihoodTierForDisplay } from "@/lib/cognitive-api-visual-mapping";
import { getProtocolId, getStatusColorFromLikelihoodTier, getWellnessStatusColor, isWellnessPositive } from "@/lib/assessment-display-utils";
import { t } from "@/lib/i18n";

interface HealthProfileProps {
  archetype: ArchetypeData | null;
  onReset: () => void;
  onRecapture?: () => void;
}

const DEFAULT_REVEAL_METRICS_COUNT = 6;

const REVEAL_METRICS_COUNT = (() => {
  const rawValue = import.meta.env.VITE_REVEAL_METRICS_COUNT;

  if (rawValue == null) {
    return DEFAULT_REVEAL_METRICS_COUNT;
  }

  const parsed = Number.parseInt(String(rawValue), 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  console.warn(
    `[HealthProfile] Invalid VITE_REVEAL_METRICS_COUNT "${rawValue}", defaulting to ${DEFAULT_REVEAL_METRICS_COUNT}`,
  );

  return DEFAULT_REVEAL_METRICS_COUNT;
})();

export const HealthProfile = ({ archetype, onReset, onRecapture }: HealthProfileProps) => {
  const navigate = useNavigate();
  const { pathway, pathwayConfig, pathwayDisplayTitle, pathwayDisplaySubtitle, userProfile, visualizedResult, language, markAssessmentComplete } = useAssessment();
  const isHighVis = getIsHighVis(userProfile.ageRange);
  const isSeniorMode = getIsSeniorMode(userProfile.ageRange);
  const [showContent, setShowContent] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [currentDate, setCurrentDate] = useState("");
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Require visualized result - no fallback to hardcoded data
  if (!visualizedResult) {
    return null;
  }

  const currentScore = visualizedResult.score;
  const classification = visualizedResult.classification;
  const likelihoodTier = visualizedResult.likelihoodTier;
  const protocolId = getProtocolId(pathway);
  const revealLabMetrics = visualizedResult.labMetrics.slice(0, REVEAL_METRICS_COUNT);
  const revealSignals = visualizedResult.signals ?? [];
  const hasDetailedReport = (visualizedResult.biomarkers?.length ?? 0) > 0;
  
  // For WELLNESS pathway: use binary color system (Cyan=Negative, Amber=Positive)
  const isWellness = pathway === "WELLNESS";
  const wellnessPositive = isWellness ? isWellnessPositive(likelihoodTier) : false;
  const dataStatusColor = isWellness ? getWellnessStatusColor(likelihoodTier) : getStatusColorFromLikelihoodTier(likelihoodTier);
  
  // Use dynamic display title or fall back to pathway config
  const assessmentTitle = pathwayDisplayTitle || (pathwayConfig?.title || "Assessment");
  
  // Risk state. The v2 API publishes its own recommended_action, so honour that
  // rather than inferring from the tier alone — a "moderate" result carrying a
  // "review" action still warrants the follow-up card.
  const recommendedAction = (visualizedResult.recommendedAction || "").toLowerCase();
  const isRiskState =
    likelihoodTier.toUpperCase() === "HIGH" ||
    recommendedAction === "review" ||
    recommendedAction === "escalate";
  const riskMessage = isRiskState && visualizedResult.clinicalSubtext 
    ? { headline: "CLINICAL REVIEW RECOMMENDED", body: visualizedResult.clinicalSubtext }
    : null;
  
  // Inconclusive state - show recapture option
  const isInconclusiveState = likelihoodTier.toUpperCase() === "INCONCLUSIVE";

  // Copy for the non-referral footer card. Never claim "optimal range" unless
  // nothing was actually flagged — the reveal above may say otherwise.
  const flaggedCount = visualizedResult.flaggedCount;
  const monitoringCard =
    flaggedCount && flaggedCount > 0
      ? {
          headline: "Continued Monitoring",
          body: `${flaggedCount} of ${visualizedResult.totalSignals ?? flaggedCount} voice signals came back elevated. Re-screen to see whether the pattern holds.`,
        }
      : {
          headline: "Standard Monitoring",
          body: "Your biomarkers are within optimal range",
        };

  // Initialize date from visualized result or current date
  useEffect(() => {
    if (visualizedResult?.createdAt) {
      const date = new Date(visualizedResult.createdAt);
      setCurrentDate(date.toISOString().split('T')[0].replace(/-/g, '.'));
    } else {
      const now = new Date();
      setCurrentDate(now.toISOString().split('T')[0].replace(/-/g, '.'));
    }
  }, [visualizedResult]);

  // Animation sequence + fire ReportGenerated event
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowContent(true);
      
      // Fire Meta Pixel custom event when report is shown
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'ReportGenerated', {
          archetype: archetype?.id || 'unknown',
          vitality: archetype?.vitality || 0,
        });
      }
    }, 600);
    return () => clearTimeout(showTimer);
  }, [archetype]);

  // Count-up animation for score
  useEffect(() => {
    if (!showContent) return;
    
    const duration = 1800;
    const startTime = Date.now();
    const startDelay = 400;

    const timeout = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - startDelay;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayScore(Math.round(eased * currentScore));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [showContent, currentScore]);
  
  if (!archetype) {
    return null;
  }

  const handleConnect = () => {
    setShowHandoffModal(true);
  };

  const handleViewDetailedAnalysis = () => {
    if (pathway) {
      markAssessmentComplete(pathway);
    }
    navigate('/detailed-analysis');
  };

  const handleHandoffConfirm = () => {
    setShowHandoffModal(false);
    setRequestSent(true);
  };

  const handleSetReminder = () => {
    toast.success("Reminder Set", {
      description: "You'll be notified in 30 days for your next assessment",
      duration: 3000,
    });
  };

  return (
    <motion.div
      className="relative w-full flex items-start justify-center pt-20 pb-8 md:pt-24 md:pb-12"
      style={{ backgroundColor: "#DBCCB1" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Subtle ambient glow - uses data status color for score-based ambiance */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 0.1 : 0 }}
          transition={{ duration: 1.2 }}
          style={{
            background: `radial-gradient(circle at 50% 30%, ${dataStatusColor}15 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Sensor Chassis Container */}
      <motion.div
        className="relative z-10 w-full max-w-[500px] mx-4 md:mx-6 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Measurement Grid Pattern Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* System Status Bar - passes data status color for robustness display */}
        <SystemStatusBar 
          showContent={showContent} 
          statusColor={dataStatusColor}
          robustness={visualizedResult?.robustness}
        />

        {/* Header Metadata Row */}
        <motion.div
          className="flex items-center justify-center gap-4 px-4 py-3 border-b border-white/5 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-white/80' : 'text-[9px] md:text-[10px] text-white/60'
          }`}>
            {isWellness ? t("screeningResult", language) : assessmentTitle} {isWellness ? '' : 'Assessment'}
          </span>
          <span className={isHighVis ? 'text-white/40' : 'text-white/20'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-white/70' : 'text-[9px] md:text-[10px] text-white/40'
          }`}>
            Protocol: {protocolId}
          </span>
          <span className={isHighVis ? 'text-white/40' : 'text-white/20'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-white/70' : 'text-[9px] md:text-[10px] text-white/40'
          }`}>
            Date: {currentDate}
          </span>
          <span className={isHighVis ? 'text-white/40' : 'text-white/20'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-white/70' : 'text-[9px] md:text-[10px] text-white/40'
          }`}>
            Outcome: {formatLikelihoodTierForDisplay(visualizedResult.likelihoodTier)}
          </span>
          <span className={isHighVis ? 'text-white/40' : 'text-white/20'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-white/70' : 'text-[9px] md:text-[10px] text-white/40'
          }`}>
            Job ID: {visualizedResult.jobId}
          </span>
        </motion.div>

        {/* Hero: Raw Signal Spectrogram - displays likelihood tier text */}
        <div className="relative px-4 py-4 md:py-5 border-b border-white/5">
          <SpectrogramWaveform 
            displayText={isWellness
              ? (wellnessPositive ? t("positiveHeadline", language) : t("negativeHeadline", language))
              : formatLikelihoodTierForDisplay(visualizedResult.likelihoodTier)
            }
            statusColor={dataStatusColor} 
            showContent={showContent} 
          />
          
          {/* Verdict Classification - data-driven color */}
          <motion.div
            className="text-center mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <h2 
              className={`font-mono uppercase tracking-[0.25em] ${
                isSeniorMode ? 'text-lg md:text-xl font-bold' : isHighVis ? 'text-sm md:text-base font-semibold' : 'text-xs md:text-sm font-medium'
              }`}
              style={{ 
                color: dataStatusColor,
                textShadow: `0 0 20px ${dataStatusColor}40`,
              }}
            >
              {isWellness
                ? (wellnessPositive ? t("positiveResult", language) : t("negativeResult", language))
                : classification
              }
            </h2>
            <p className={`font-mono uppercase tracking-widest mt-0.5 ${
              isSeniorMode ? 'text-sm font-medium text-white/60' : isHighVis ? 'text-[10px] font-medium text-white/50' : 'text-[9px] text-white/30'
            }`}>
              {t("basedOnVocalAnalysis", language)}
            </p>
          </motion.div>
        </div>

        {/* Voice Signal Panel — the per-sign read from the v2 model */}
        {revealSignals.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5">
            <motion.h3
              className={`font-mono uppercase tracking-widest mb-2 ${
                isHighVis ? 'text-[10px] md:text-xs font-medium text-white/60' : 'text-[9px] text-white/40'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ delay: 1.1 }}
            >
              Voice Signals
              {visualizedResult.totalSignals ? (
                <span className="text-white/30">
                  {" "}· {visualizedResult.flaggedCount ?? 0} of {visualizedResult.totalSignals} flagged
                </span>
              ) : null}
            </motion.h3>
            <SignalPanel
              signals={revealSignals}
              showContent={showContent}
              isHighVis={isHighVis}
              isSeniorMode={isSeniorMode}
            />
          </div>
        )}

        {/* Biometric Lab Grid */}
        <div className="px-4 py-3 border-b border-white/5">
          <motion.h3
            className={`font-mono uppercase tracking-widest mb-2 ${
              isHighVis ? 'text-[10px] md:text-xs font-medium text-white/60' : 'text-[9px] text-white/40'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.3 }}
          >
            Biometric Results
          </motion.h3>
          <motion.p
            className={`font-mono text-white/40 mb-3 ${
              isHighVis ? 'text-[9px] md:text-[10px]' : isSeniorMode ? 'text-[10px]' : 'text-[8px]'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.35 }}
          >
            Note: We analyze over 1,000 voice biomarkers. The markers shown here are a small subset that are easiest to interpret and most influential in your result.
          </motion.p>
          <BiometricLabGrid 
            pathway={pathway} 
            statusColor={dataStatusColor} 
            showContent={showContent}
            labMetrics={revealLabMetrics}
            isHighVis={isHighVis}
            isSeniorMode={isSeniorMode}
          />
        </div>

        {/* Care Bridge: Clinical Recommendation Footer */}
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            {isInconclusiveState ? (
              // Inconclusive State: Recapture Card
              <div 
                className="relative overflow-hidden rounded-lg p-5 md:p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono text-xs md:text-sm uppercase tracking-widest font-semibold mb-2 text-amber-400">
                      AUDIO QUALITY INSUFFICIENT
                    </h3>
                    <p className="font-mono text-[10px] md:text-xs text-white/50 leading-relaxed mb-4">
                      {visualizedResult.clinicalSubtext || "The audio quality was below acceptable thresholds. Please recapture your voice sample in a quieter environment for optimal results."}
                    </p>
                    
                    {onRecapture && (
                      <button
                        onClick={onRecapture}
                        className={`w-full rounded-lg font-mono uppercase tracking-widest font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isSeniorMode ? 'py-5 text-base' : 'py-3 text-xs'
                        }`}
                        style={{
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          color: 'white',
                          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className={isSeniorMode ? 'w-5 h-5' : 'w-4 h-4'} />
                          Recapture Audio Sample
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : isRiskState && riskMessage ? (
              // Risk State: Urgent Clinical Card
              <div 
                className="relative overflow-hidden rounded-lg p-5 md:p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: requestSent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: requestSent ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {requestSent ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-mono text-xs md:text-sm uppercase tracking-widest font-semibold mb-2 ${requestSent ? 'text-emerald-400' : 'text-red-400'}`}>
                      {requestSent ? "REQUEST CONFIRMED" : riskMessage.headline}
                    </h3>
                    <p className="font-mono text-[10px] md:text-xs text-white/50 leading-relaxed mb-4">
                      {requestSent 
                        ? "A Care Coordinator from Harmonic Health will contact you within 24 hours."
                        : riskMessage.body
                      }
                    </p>
                    
                     {/* Primary CTA - Largest element for senior mode */}
                    <button
                      onClick={handleConnect}
                      disabled={requestSent}
                      className={`w-full rounded-lg font-mono uppercase tracking-widest font-semibold transition-all duration-300 disabled:cursor-not-allowed ${
                        isSeniorMode ? 'py-5 text-base' : 'py-3 text-xs'
                      }`}
                      style={{
                        background: requestSent 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        color: requestSent ? 'rgb(52, 211, 153)' : 'white',
                        boxShadow: requestSent ? 'none' : '0 4px 20px rgba(239, 68, 68, 0.3)',
                        border: requestSent ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                      }}
                    >
                      {requestSent ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className={isSeniorMode ? 'w-5 h-5' : 'w-4 h-4'} />
                          Request Sent
                        </span>
                      ) : (
                        "Connect with Care"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Healthy State: Monitoring Card - uses BRAND color for UI elements
              <div 
                className="rounded-lg p-5"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `${BRAND_COLOR}15`,
                      border: `1px solid ${BRAND_COLOR}30`,
                    }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: BRAND_COLOR }} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-white/60 mb-1">
                      {monitoringCard.headline}
                    </h3>
                    <p className="font-mono text-[10px] text-white/40">
                      {monitoringCard.body}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSetReminder}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: `${BRAND_COLOR}10`,
                      border: `1px solid ${BRAND_COLOR}30`,
                      color: BRAND_COLOR,
                    }}
                  >
                    <Bell className="w-3 h-3" />
                    Set Reminder
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Secondary Actions */}
          <motion.div
            className="flex flex-col items-center gap-3 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            {hasDetailedReport && !isInconclusiveState && (
              <button
                onClick={handleViewDetailedAnalysis}
                className={`px-6 rounded-lg font-mono uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] ${
                  isSeniorMode
                    ? 'py-4 text-sm font-semibold'
                    : isHighVis
                      ? 'py-3.5 text-xs font-medium'
                      : 'py-2.5 text-[10px]'
                }`}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSeniorMode ? 'rgba(255, 255, 255, 0.95)' : isHighVis ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                View Detailed Analysis →
              </button>
            )}

            <button
              onClick={onReset}
              className={`font-mono uppercase tracking-widest transition-colors ${
                isSeniorMode 
                  ? 'text-sm font-medium text-white/60 hover:text-white/80' 
                  : isHighVis 
                    ? 'text-xs font-medium text-white/50 hover:text-white/70' 
                    : 'text-[10px] text-white/30 hover:text-white/50'
              }`}
            >
              {t("startNewScreening", language)}
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Partner Handoff Modal */}
      <PartnerHandoffModal
        isOpen={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
        onConfirm={handleHandoffConfirm}
        pathway={pathway}
        score={currentScore}
        ageRange={userProfile.ageRange}
      />
    </motion.div>
  );
};
