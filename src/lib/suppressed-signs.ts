/**
 * Signs withheld from every surface, by product decision rather than anything
 * the API says.
 *
 * elevated-blood-pressure and head-impact are both dropped outright: each reads
 * as a clinical finding the voice model is not making, and a consumer screen is
 * the wrong place to imply one.
 *
 * This lives on its own so the two places that must agree can share it: the
 * mapper, which filters signals out of every result, and the analysis screen's
 * stage copy, which names the signs being scored while the user waits. When the
 * list lived only in the mapper, the analysis screen went on announcing HEAD
 * IMPACT during a Sports run whose results would never mention it.
 */
export const SUPPRESSED_SIGNS: ReadonlySet<string> = new Set([
  "elevated-blood-pressure",
  "head-impact",
]);

export function isSuppressedSign(name: string | null | undefined): boolean {
  return SUPPRESSED_SIGNS.has((name || "").toLowerCase());
}
