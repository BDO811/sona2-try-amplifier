import { AssessmentPathway } from "@/context/AssessmentContext";

export function getProtocolId(pathway: AssessmentPathway): string {
  if (pathway === "BRAIN_AGE") return "COGNITIVE-01";
  if (pathway === "LONGEVITY") return "RESPIRATORY-01";
  if (pathway === "MENTAL_HEALTH") return "AFFECTIVE-01";
  if (pathway === "FERTILITY") return "HORMONAL-01";
  if (pathway === "WELLNESS") return "WELLNESS-01";
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

export function getStatusColorFromLikelihoodTier(tier: string): string {
  const upperTier = tier.toUpperCase();
  if (upperTier === "NO_RISK") return "#10B981";
  if (upperTier === "LOW") return "#84CC16";
  if (upperTier === "MODERATE") return "#F59E0B";
  if (upperTier === "HIGH") return "#EF4444";
  return "#F59E0B";
}
