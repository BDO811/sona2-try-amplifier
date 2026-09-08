import { AssessmentPathway } from "@/context/AssessmentContext";
import { bandColorOn, type Surface } from "@/lib/signal-band";

export function getProtocolId(pathway: AssessmentPathway): string {
  if (pathway === "BRAIN_AGE") return "COGNITIVE-01";
  if (pathway === "LONGEVITY") return "RESPIRATORY-01";
  if (pathway === "MENTAL_HEALTH") return "AFFECTIVE-01";
  if (pathway === "FERTILITY") return "HORMONAL-01";
  if (pathway === "WELLNESS") return "WELLNESS-01";
  if (pathway === "SPORTS") return "ATHLETIC-01";
  return "BIOMETRIC-01";
}

/**
 * Get status color for wellness binary result
 * Negative (no risk/low) = Cyan #22d3ee
 * Positive (moderate/high) = Amber #f59e0b
 */
export function getWellnessStatusColor(likelihoodTier: string): string {
  const upper = likelihoodTier.toUpperCase();
  if (upper === "NO_RISK" || upper === "LOW") return "#22d3ee"; // Cyan - negative
  return "#f59e0b"; // Amber - positive
}

/**
 * Determine if wellness result is positive (needs clinical attention)
 */
export function isWellnessPositive(likelihoodTier: string): boolean {
  const upper = likelihoodTier.toUpperCase();
  return upper === "MODERATE" || upper === "HIGH";
}

/**
 * Colour for the likelihood tier, mapped onto the signal band palette so the
 * tier word and the bands beneath it come from one ramp.
 *
 * The old values were off-brand: emerald #10B981, amber #F59E0B, red #EF4444,
 * and #84CC16 for the LOW tier, which is a lime green the design canon bans
 * outright. They also assumed a dark ground, and both report screens sit on
 * the beige page, where #F59E0B measures 1.9:1.
 */
export function getStatusColorFromLikelihoodTier(
  tier: string,
  surface: Surface = "light"
): string {
  const upperTier = tier.toUpperCase();
  if (upperTier === "NO_RISK" || upperTier === "LOW") return bandColorOn("LOW", surface);
  if (upperTier === "MODERATE") return bandColorOn("HIGH", surface);
  if (upperTier === "HIGH") return bandColorOn("VERY HIGH", surface);
  if (upperTier === "INCONCLUSIVE") return bandColorOn("INCONCLUSIVE", surface);
  return bandColorOn("HIGH", surface);
}
