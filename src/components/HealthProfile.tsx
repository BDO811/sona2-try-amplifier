import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArchetypeData } from "./AnalysisAnimation";
import { useAssessment, AssessmentPathway, BRAND_COLOR, getIsHighVis, getIsSeniorMode } from "@/context/AssessmentContext";
import { Bell, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SpectrogramWaveform } from "./report/SpectrogramWaveform";
import { BiometricLabGrid } from "./report/BiometricLabGrid";
import { SignalPanel } from "./report/SignalPanel";
import { SinceLastVisitPanel } from "./report/SinceLastVisitPanel";
import { SystemStatusBar } from "./report/SystemStatusBar";
import { useVoiceHistory } from "@/hooks/use-voice-history";
import { formatLikelihoodTierForDisplay } from "@/lib/cognitive-api-visual-mapping";
import { getProtocolId, getStatusColorFromLikelihoodTier } from "@/lib/assessment-display-utils";
import { actionLabel, actionOf } from "@/lib/signal-band";
import { RUNG_SCALE } from "@/lib/result-headline";
import { OptionScale } from "./report/OptionScale";
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

  // Persists this result against the user's email, then loads their history so
  // a returning member can see what moved. Called above the early return below,
  // because a hook behind a conditional return is a hook order violation.
  const voiceHistory = useVoiceHistory({ save: true });

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
  
  // Both assessments use the same tier presentation. The WELLNESS pathway used
  // to switch to a binary positive/negative headline coloured cyan #22d3ee, a
  // retired palette; routing the Wellness card here would have brought it back
  // and made the two assessments look unrelated to each other.
  const dataStatusColor = getStatusColorFromLikelihoodTier(likelihoodTier);
  
  // Use dynamic display title or fall back to pathway config
  const assessmentTitle = pathwayDisplayTitle || (pathwayConfig?.title || "Assessment");
  
  // Inconclusive state - show recapture option
  const isInconclusiveState = likelihoodTier.toUpperCase() === "INCONCLUSIVE";

  /*
    The footer card states the API's own recommended_action, using the meaning
    the docs give it, rather than a count of flags or a collapsed rewrite.

    The action is derived server-side from the full distribution of signal
    levels, with one elevated signal outranking several weak ones, so no count
    reproduces it. It was previously folded into three outcomes with invented
    headlines; that discarded the distinction between consider, review and
    escalate, which is the whole point of the field.
  */
  const flaggedCount = visualizedResult.flaggedCount ?? 0;
  const totalSignals = visualizedResult.totalSignals ?? flaggedCount;
  const resultAction = actionOf(visualizedResult.recommendedAction);
  const monitoringCard = {
    headline: actionLabel(resultAction),
    body:
      resultAction === "inconclusive"
        ? "This recording could not be read reliably. Record again to get a result."
        : flaggedCount > 0
          ? `${flaggedCount} of ${totalSignals} voice signals were flagged. Record again to see whether the pattern holds.`
          : `None of the ${totalSignals} voice signals measured were flagged. Record again anytime to track changes.`,
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

  const handleViewDetailedAnalysis = () => {
    if (pathway) {
      markAssessmentComplete(pathway);
    }
    navigate('/detailed-analysis');
  };

  const handleViewHistory = () => {
    navigate('/history');
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
          /*
            Was a 40% black scrim over the beige page, which produced a muddy
            mid-grey and left every white-alpha label sitting at 30-60% on top
            of it. Now the brand paper surface shows through and the chrome is
            near-black at full opacity, per the canon's rule for a cream ground.
            The data blocks inside keep their own black canvas.
          */
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(35, 18, 0, 0.15)',
        }}
      >
        {/* Measurement Grid Pattern Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(35,18,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(35,18,0,0.5) 1px, transparent 1px)
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
          className="flex items-center justify-center gap-4 px-4 py-3 border-b border-[#231200]/10 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-semibold text-[#231200]' : 'text-[9px] md:text-[10px] text-[#231200]'
          }`}>
            {assessmentTitle} Assessment
          </span>
          <span className={'text-[#4B2700]/50'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-[#2E2E2E]' : 'text-[9px] md:text-[10px] text-[#2E2E2E]'
          }`}>
            Protocol: {protocolId}
          </span>
          <span className={'text-[#4B2700]/50'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-[#2E2E2E]' : 'text-[9px] md:text-[10px] text-[#2E2E2E]'
          }`}>
            Date: {currentDate}
          </span>
          <span className={'text-[#4B2700]/50'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-[#2E2E2E]' : 'text-[9px] md:text-[10px] text-[#2E2E2E]'
          }`}>
            Outcome: {formatLikelihoodTierForDisplay(visualizedResult.likelihoodTier)}
          </span>
          <span className={'text-[#4B2700]/50'}>|</span>
          <span className={`font-mono uppercase tracking-widest ${
            isHighVis ? 'text-[10px] md:text-xs font-medium text-[#2E2E2E]' : 'text-[9px] md:text-[10px] text-[#2E2E2E]'
          }`}>
            Job ID: {visualizedResult.jobId}
          </span>
        </motion.div>

        {/* Hero: Raw Signal Spectrogram - displays likelihood tier text */}
        <div className="relative px-4 py-4 md:py-5 border-b border-[#231200]/10">
          {/*
            Labels the tier word underneath it. Deliberately the same type scale
            as the classification line below the spectrogram, so the two read as
            a matched pair bracketing the result rather than as a heading and a
            caption.
          */}
          <motion.div
            className="text-center font-mono uppercase tracking-[0.2em] text-[9px] md:text-[10px] mb-2.5"
            style={{ color: '#4B2700' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            Assessment
          </motion.div>

          {/*
            Every possible outcome across the top, with the one this result
            landed on lit and the rest at half opacity. The rung comes from the
            mapper alongside the phrase below, so the lit word and the wording
            are the same computation and cannot disagree.
          */}
          {visualizedResult.headlineRung && (
            <motion.div
              className="mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ delay: 1.35, duration: 0.5 }}
            >
              <OptionScale
                options={RUNG_SCALE}
                activeKey={visualizedResult.headlineRung}
                size="lg"
                surface="light"
                ariaLabel="Assessment outcome"
              />
            </motion.div>
          )}

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0B0B0A' }}>
            <SpectrogramWaveform
              displayText={formatLikelihoodTierForDisplay(visualizedResult.likelihoodTier)}
              statusColor={getStatusColorFromLikelihoodTier(likelihoodTier, 'dark')}
              showContent={showContent}
            />
          </div>

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
              {classification}
            </h2>
            <p className={`font-mono uppercase tracking-widest mt-0.5 ${
              isSeniorMode ? 'text-sm font-medium text-[#2E2E2E]' : isHighVis ? 'text-[10px] font-medium text-[#2E2E2E]' : 'text-[9px] text-[#2E2E2E]'
            }`}>
              {t("basedOnVocalAnalysis", language)}
            </p>
          </motion.div>
        </div>

        {/* Voice Signal Panel — the per-sign read from the v2 model */}
        {revealSignals.length > 0 && (
          <div className="px-4 py-3 border-b border-[#231200]/10">
            <motion.h3
              className={`font-mono uppercase tracking-widest mb-2 ${
                isHighVis ? 'text-[10px] md:text-xs font-semibold text-[#231200]' : 'text-[9px] font-medium text-[#231200]'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ delay: 1.1 }}
            >
              Voice Signals
              {visualizedResult.totalSignals ? (
                <span className="text-[#4B2700]">
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

        {/* Returning member: what moved since their previous visit */}
        {voiceHistory.isReturning && voiceHistory.signals.length > 0 && (
          <div className="px-4 py-3 border-b border-[#231200]/10">
            <SinceLastVisitPanel
              signals={voiceHistory.signals}
              sessionCount={voiceHistory.sessions.length}
              showContent={showContent}
              isSeniorMode={isSeniorMode}
              onViewHistory={handleViewHistory}
            />
          </div>
        )}

        {/* Biometric Lab Grid */}
        <div className="px-4 py-3 border-b border-[#231200]/10">
          <motion.h3
            className={`font-mono uppercase tracking-widest mb-2 ${
              isHighVis ? 'text-[10px] md:text-xs font-semibold text-[#231200]' : 'text-[9px] font-medium text-[#231200]'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.3 }}
          >
            Biometric Results
          </motion.h3>
          <motion.p
            className={`font-mono text-[#2E2E2E] mb-3 ${
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
                  background: 'rgba(11, 11, 10, 0.9)',
                  border: '1px solid rgba(255, 193, 99, 0.55)',
                }}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono text-xs md:text-sm uppercase tracking-widest font-semibold mb-2" style={{ color: '#FFC163' }}>
                      AUDIO QUALITY INSUFFICIENT
                    </h3>
                    <p className="font-mono text-[10px] md:text-xs text-white leading-relaxed mb-4">
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
            ) : (
              // Healthy State: Monitoring Card - uses BRAND color for UI elements
              <div 
                className="rounded-lg p-5"
                style={{
                  background: 'rgba(11, 11, 10, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-white mb-1">
                      {monitoringCard.headline}
                    </h3>
                    <p className="font-mono text-[10px] text-white">
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
                  backgroundColor: 'rgba(11, 11, 10, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
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
                  ? 'text-sm font-medium text-[#231200] hover:text-black' 
                  : isHighVis 
                    ? 'text-xs font-medium text-[#231200] hover:text-black' 
                    : 'text-[10px] text-[#2E2E2E] hover:text-black'
              }`}
            >
              {t("startNewScreening", language)}
            </button>
          </motion.div>
        </div>
      </motion.div>

    </motion.div>
  );
};
