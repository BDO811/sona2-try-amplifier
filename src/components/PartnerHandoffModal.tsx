import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Shield, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AssessmentPathway, getIsSeniorMode, AgeRange } from "@/context/AssessmentContext";
import harmonicIcon from "@/assets/harmonic-icon.png";

interface PartnerHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pathway: AssessmentPathway;
  score: number;
  ageRange?: AgeRange;
}

// Pathway-specific partner messaging
const PATHWAY_PARTNER_CONTEXT: Record<NonNullable<AssessmentPathway>, { specialty: string; focus: string }> = {
  BRAIN_AGE: {
    specialty: "cognitive wellness and cognitive assessment",
    focus: "Based on your Cognitive Risk score, we recommend a comprehensive screening with Harmonic Health. They specialize in cognitive performance and brain health optimization.",
  },
  LONGEVITY: {
    specialty: "cardiovascular and autonomic nervous system regulation",
    focus: "Based on your Respiratory Risk score, we recommend a comprehensive screening with Harmonic Health. They specialize in cardiovascular and autonomic nervous system regulation.",
  },
  MENTAL_HEALTH: {
    specialty: "mental wellness and emotional regulation",
    focus: "Based on your Affective Risk score, we recommend a comprehensive consultation with Harmonic Health. They specialize in mental wellness and emotional health support.",
  },
  FERTILITY: {
    specialty: "hormonal health and endocrine assessment",
    focus: "Based on your Hormonal Risk score, we recommend a comprehensive evaluation with Harmonic Health. They specialize in hormonal health and fertility optimization.",
  },
  WELLNESS: {
    specialty: "general wellness and preventive care",
    focus: "Based on your Wellness Check result, we recommend a comprehensive follow-up with a healthcare provider. Early attention to subtle wellness signals enables timely care.",
  },
};

export const PartnerHandoffModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pathway,
  ageRange,
}: PartnerHandoffModalProps) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isSeniorMode = getIsSeniorMode(ageRange);

  const context = pathway ? PATHWAY_PARTNER_CONTEXT[pathway] : PATHWAY_PARTNER_CONTEXT.LONGEVITY;

  const handleConfirm = async () => {
    if (!consentChecked) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Fire Meta Pixel events when referral is sent
    if (typeof window !== 'undefined' && (window as any).fbq) {
      // Custom event for analytics
      (window as any).fbq('trackCustom', 'ReferralSent', {
        partner: 'Harmonic Health',
        pathway: pathway || 'unknown',
      });
      
      // Purchase event for conversion tracking
      (window as any).fbq('track', 'Purchase', {
        content_name: pathway || 'Unknown Pathway',
        content_category: 'Clinical Referral',
        value: 0,
        currency: 'USD',
      });
    }
    
    setShowSuccess(true);
    
    // Close after success animation
    setTimeout(() => {
      onConfirm();
      // Reset state for next time
      setConsentChecked(false);
      setIsSubmitting(false);
      setShowSuccess(false);
    }, 1800);
  };

  const handleClose = () => {
    if (isSubmitting || showSuccess) return;
    setConsentChecked(false);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          
          {/* Modal Content */}
          <motion.div
            className="relative z-10 w-full max-w-lg"
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div 
              className="relative bg-card border border-border rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)',
              }}
            >
              {/* Close button - larger for senior mode */}
              {!isSubmitting && !showSuccess && (
                <button
                  onClick={handleClose}
                  className={`absolute top-4 right-4 rounded-full hover:bg-muted transition-colors ${
                    isSeniorMode ? 'p-3' : 'p-2'
                  }`}
                >
                  <X className={`text-muted-foreground ${isSeniorMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
                </button>
              )}

              {/* Success State */}
              <AnimatePresence mode="sync">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    className="flex flex-col items-center justify-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.3 }}
                      >
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                      </motion.div>
                    </motion.div>
                    <h3 className="font-mono text-lg uppercase tracking-widest text-foreground mb-2">
                      Request Sent
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground text-center">
                      A Care Coordinator will contact you within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="font-mono text-lg md:text-xl uppercase tracking-widest text-foreground mb-2">
                        Clinical Partner Match
                      </h2>
                      <div className="w-16 h-px bg-border mx-auto" />
                    </div>

                    {/* Partner Identity */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center p-2"
                        style={{
                          background: 'linear-gradient(135deg, hsl(var(--primary)/0.2) 0%, hsl(var(--primary)/0.05) 100%)',
                          border: '1px solid hsl(var(--primary)/0.3)',
                        }}
                      >
                        <img 
                          src={harmonicIcon} 
                          alt="Harmonic Health" 
                          className="w-full h-full object-contain brightness-0 invert"
                        />
                      </div>
                      <div>
                        <h3 className="font-mono text-sm text-foreground font-medium">
                          Harmonic Health
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                            Vetted Clinical Partner
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* The Why */}
                    <div className="mb-6">
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed text-center">
                        {context.focus}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-border mb-6" />

                    {/* What Happens Next */}
                    <div className="mb-8">
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                        What Happens Next
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-mono text-[10px] text-primary">
                            1
                          </span>
                          <p className="font-mono text-xs text-foreground/80">
                            We will securely share your Acoustic Report with their intake team.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-mono text-[10px] text-primary">
                            2
                          </span>
                          <p className="font-mono text-xs text-foreground/80">
                            A Care Coordinator will contact you via SMS/Phone within 24 hours.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consent Checkbox - larger for senior mode */}
                    <div className="mb-6">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox
                          checked={consentChecked}
                          onCheckedChange={(checked) => setConsentChecked(checked === true)}
                          className={`mt-0.5 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                            isSeniorMode ? 'h-7 w-7' : ''
                          }`}
                        />
                        <span className={`font-mono text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors ${
                          isSeniorMode ? 'text-base' : 'text-xs'
                        }`}>
                          I agree to share my contact details and assessment results with Harmonic Health.
                        </span>
                      </label>
                    </div>

                    {/* Confirm Button - larger for senior mode */}
                    <button
                      onClick={handleConfirm}
                      disabled={!consentChecked || isSubmitting}
                      className={`w-full rounded-xl font-mono uppercase tracking-widest font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSeniorMode ? 'py-5 text-base' : 'py-4 text-sm'
                      }`}
                      style={{
                        background: consentChecked 
                          ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)'
                          : 'hsl(var(--muted))',
                        color: consentChecked ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        boxShadow: consentChecked ? '0 4px 20px hsl(var(--primary)/0.4)' : 'none',
                      }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            className={`border-2 border-current border-t-transparent rounded-full ${
                              isSeniorMode ? 'w-5 h-5' : 'w-4 h-4'
                            }`}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Processing...
                        </span>
                      ) : (
                        "Confirm & Request Call"
                      )}
                    </button>

                    {/* Privacy Note */}
                    <p className={`font-mono text-muted-foreground/60 text-center mt-4 leading-relaxed ${
                      isSeniorMode ? 'text-xs' : 'text-[9px]'
                    }`}>
                      Your data remains encrypted. You are opting in for a one-time consultation.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render via portal to document.body for true global overlay
  return createPortal(modalContent, document.body);
};