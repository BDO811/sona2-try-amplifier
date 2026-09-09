import { motion } from "framer-motion";
import { useState } from "react";
import { fetchRecommendations, type RecommendationSign } from "@/lib/recommendations-client";

interface RecommendationsPanelProps {
  /** The readings that are not normal, in the order they appear on screen. */
  signs: RecommendationSign[];
  /** Names the model for the prompt, e.g. "wellness". */
  assessment: string;
  showContent: boolean;
  isSeniorMode?: boolean;
}

/*
  Off in production.

  The button is live code and the endpoint is deployed, but the model behind it
  returns 429 "prepayment credits are depleted" on every call, so tapping it can
  only ever produce an error. A control that cannot succeed is worse than no
  control, so it does not render until the backend can answer.

  Flip this to true to bring it back. Nothing else needs to change: the client,
  the Cloud Function and the CORS allowlist are all in place and were verified
  end to end on 2026-09-09, up to the point where Gemini refused on billing.
*/
export const RECOMMENDATIONS_ENABLED = false;

/**
 * The recommendations button and the text it fetches.
 *
 * Shown on the rung that reads NEEDS OPTIMIZATION, where there is something to
 * act on and the reader has not been told what. It asks rather than loading on
 * mount: the call costs a model round trip, and most readers of a good result
 * will never want it.
 */
export const RecommendationsPanel = ({
  signs,
  assessment,
  showContent,
  isSeniorMode = false,
}: RecommendationsPanelProps) => {
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  if (!RECOMMENDATIONS_ENABLED) return null;
  if (signs.length === 0) return null;

  const load = async () => {
    setState("loading");
    try {
      const result = await fetchRecommendations(signs, assessment);
      setText(result.text);
      setState("idle");
    } catch (error) {
      console.error("[RecommendationsPanel] failed", error);
      setState("error");
    }
  };

  return (
    <motion.div
      className="mt-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ delay: 1.45, duration: 0.5 }}
    >
      {text ? (
        <div
          className="rounded-lg px-4 py-3.5 text-left"
          style={{ background: "rgba(11, 11, 10, 0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="font-mono text-[9px] uppercase tracking-widest text-white block mb-2">
            Recommendations
          </span>
          {/*
            Split on blank lines rather than rendered as one block: the prompt
            asks for a paragraph per reading, and running them together loses
            which suggestion belongs to which.
          */}
          {text
            .split(/\n\s*\n/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p
                key={i}
                className={`font-mono text-white leading-relaxed ${
                  isSeniorMode ? "text-[12px]" : "text-[11px]"
                } ${i > 0 ? "mt-2.5" : ""}`}
              >
                {para}
              </p>
            ))}
        </div>
      ) : (
        <div className="text-center">
          <button
            type="button"
            onClick={load}
            disabled={state === "loading"}
            className={`font-mono uppercase tracking-widest rounded-full px-5 py-2.5 transition-opacity disabled:opacity-60 ${
              isSeniorMode ? "text-[12px]" : "text-[10px]"
            }`}
            style={{
              background: "#1E5631",
              color: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          >
            {state === "loading" ? "Preparing…" : "Click here for recommendations"}
          </button>
          {state === "error" && (
            <p className="font-mono text-[10px] mt-2" style={{ color: "#8E1220" }}>
              Could not load recommendations. Tap to try again.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RecommendationsPanel;
