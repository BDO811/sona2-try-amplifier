import { describe, expect, it } from "vitest";
import {
  HEADLINE_COPY,
  HEADLINE_VARIANTS,
  STRONG_SIGNAL_FLOOR,
  headlineFor,
  rungFor,
  type HeadlineRung,
} from "@/lib/result-headline";

const h = (name: string, levels: string[]) => headlineFor({ name, levels });

describe("headlineFor", () => {
  it("says OPTIMAL only when nothing is flagged", () => {
    expect(h("ATHLETIC", ["low", "low", "none", "low"])).toBe("OPTIMAL ATHLETIC FUNCTION");
    expect(h("WELLNESS", ["none", "none"])).toBe("OPTIMAL WELLNESS FUNCTION");
  });

  it("gives a good outcome whenever two signals are reading well", () => {
    // The brief. Reached regardless of how high the remaining signals went.
    expect(h("ATHLETIC", ["low", "low", "consider"])).toBe("STRONG ATHLETIC FOUNDATION");
    expect(h("ATHLETIC", ["low", "low", "moderate", "moderate", "consider"])).toBe(
      "STRONG ATHLETIC FOUNDATION"
    );
    expect(h("ATHLETIC", ["none", "low", "elevated", "elevated"])).toBe(
      "STRONG ATHLETIC FOUNDATION"
    );
  });

  it("never claims OPTIMAL while a signal is at HIGH or above", () => {
    // The headline prints directly above the flagged rows; claiming optimal
    // function there contradicts the screen it sits on.
    const withHigh = [
      ["low", "low", "moderate"],
      ["low", "low", "low", "elevated"],
      ["none", "none", "none", "none", "elevated"],
    ];
    for (const levels of withHigh) {
      expect(h("ATHLETIC", levels)).not.toContain("OPTIMAL");
    }
  });

  it("degrades gently rather than turning negative", () => {
    expect(h("ATHLETIC", ["low", "moderate", "moderate"])).toBe("STEADY ATHLETIC BASELINE");
    expect(h("ATHLETIC", ["moderate", "elevated", "consider"])).toBe(
      "ATHLETIC PROFILE NEEDS IMPROVEMENT"
    );
  });

  it("reserves an optimal-whole claim for a clean result", () => {
    // The good rung sits above flagged rows, so it must not claim the whole
    // picture is optimal. Only the clean rung may.
    expect(rungFor({ levels: ["low", "low", "moderate"] })).toBe("good");
    expect(HEADLINE_COPY.good).not.toContain("OPTIMAL");
    expect(HEADLINE_COPY.clean).toContain("OPTIMAL");
  });

  it("uses no negative or diagnostic wording at any rung", () => {
    const banned = ["RISK", "ELEVATED", "POOR", "ABNORMAL", "DEFICIENT", "IMPAIRED", "FAILURE"];
    const cases = [
      ["none", "none"],
      ["low", "low", "consider"],
      ["low", "low", "moderate", "moderate"],
      ["low", "moderate", "moderate"],
      ["moderate", "elevated"],
      ["inconclusive", "inconclusive"],
    ];
    for (const levels of cases) {
      const headline = h("ATHLETIC", levels);
      for (const word of banned) {
        expect(headline).not.toContain(word);
      }
    }
  });

  it("reports inconclusive when nothing is readable, without implying a finding", () => {
    const headline = h("WELLNESS", ["inconclusive", "inconclusive", "inconclusive"]);
    expect(headline).toBe("WELLNESS ASSESSMENT INCONCLUSIVE");
    expect(headline).not.toContain("OPTIMAL");
  });

  it("ignores inconclusive signals when grading the readable ones", () => {
    // Two readable signals both clean, plus noise that could not be read.
    expect(h("ATHLETIC", ["low", "none", "inconclusive"])).toBe("OPTIMAL ATHLETIC FUNCTION");
  });

  it("handles a single signal", () => {
    expect(h("COGNITIVE", ["low"])).toBe("OPTIMAL COGNITIVE FUNCTION");
    expect(h("COGNITIVE", ["moderate"])).toBe("COGNITIVE PROFILE NEEDS IMPROVEMENT");
  });

  it("honours the strong-signal floor", () => {
    const justUnder = Array(STRONG_SIGNAL_FLOOR - 1)
      .fill("low")
      .concat(["moderate", "moderate"]);
    const atFloor = Array(STRONG_SIGNAL_FLOOR).fill("low").concat(["moderate", "moderate"]);
    expect(rungFor({ levels: justUnder })).not.toBe("good");
    expect(rungFor({ levels: atFloor })).toBe("good");
  });
});

describe("the vocabulary catalogue", () => {
  const RUNGS: HeadlineRung[] = ["clean", "good", "steady", "focus", "unreadable"];

  it("offers alternatives for every rung", () => {
    for (const rung of RUNGS) {
      expect(HEADLINE_VARIANTS[rung].length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the copy in use inside its own rung's variants", () => {
    for (const rung of RUNGS) {
      expect(HEADLINE_VARIANTS[rung]).toContain(HEADLINE_COPY[rung]);
    }
  });

  it("gives every variant a name slot to fill", () => {
    for (const rung of RUNGS) {
      for (const variant of HEADLINE_VARIANTS[rung]) {
        expect(variant).toContain("{NAME}");
      }
    }
  });

  it("uses no risk or diagnostic wording in any variant", () => {
    const banned = ["RISK", "ELEVATED", "POOR", "ABNORMAL", "DEFICIENT", "IMPAIRED", "DISEASE"];
    for (const rung of RUNGS) {
      for (const variant of HEADLINE_VARIANTS[rung]) {
        for (const word of banned) {
          expect(variant).not.toContain(word);
        }
      }
    }
  });

  it("claims optimal or peak condition only on the clean rung", () => {
    for (const rung of RUNGS) {
      if (rung === "clean") continue;
      for (const variant of HEADLINE_VARIANTS[rung]) {
        expect(variant).not.toContain("OPTIMAL");
        expect(variant).not.toContain("PEAK");
      }
    }
  });

  it("has no duplicate wording across rungs", () => {
    const all = RUNGS.flatMap((r) => HEADLINE_VARIANTS[r]);
    expect(new Set(all).size).toBe(all.length);
  });
});
