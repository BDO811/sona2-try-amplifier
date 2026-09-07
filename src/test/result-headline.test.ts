import { describe, expect, it } from "vitest";
import { HEADLINE_LADDER, STRONG_SIGNAL_FLOOR, headlineFor } from "@/lib/result-headline";

const h = (name: string, levels: string[]) => headlineFor({ name, levels });

describe("headlineFor", () => {
  it("says OPTIMAL only when nothing is flagged", () => {
    expect(h("ATHLETIC", ["low", "low", "none", "low"])).toBe("OPTIMAL ATHLETIC FUNCTION");
    expect(h("WELLNESS", ["none", "none"])).toBe("OPTIMAL WELLNESS FUNCTION");
  });

  it("leads positive when several signals hold and nothing reached HIGH", () => {
    expect(h("ATHLETIC", ["low", "low", "consider"])).toBe("STRONG ATHLETIC FOUNDATION");
  });

  it("stays warm when signals hold alongside flagged ones", () => {
    // The brief's case, and the shape of a real apex run.
    expect(h("ATHLETIC", ["low", "low", "moderate", "moderate", "consider"])).toBe(
      "RESILIENT ATHLETIC BASELINE"
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
    expect(h("ATHLETIC", ["moderate", "elevated", "consider"])).toBe("ATHLETIC PROFILE IN FOCUS");
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
    expect(h("COGNITIVE", ["moderate"])).toBe("COGNITIVE PROFILE IN FOCUS");
  });

  it("honours the strong-signal floor", () => {
    const justUnder = Array(STRONG_SIGNAL_FLOOR - 1)
      .fill("low")
      .concat(["moderate", "moderate"]);
    const atFloor = Array(STRONG_SIGNAL_FLOOR).fill("low").concat(["moderate", "moderate"]);
    expect(h("ATHLETIC", justUnder)).not.toContain("RESILIENT");
    expect(h("ATHLETIC", atFloor)).toBe("RESILIENT ATHLETIC BASELINE");
  });
});

describe("HEADLINE_LADDER", () => {
  it("documents every rung the function can return", () => {
    const produced = new Set([
      h("X", ["none"]),
      h("X", ["low", "low", "consider"]),
      h("X", ["low", "low", "moderate"]),
      h("X", ["low", "moderate", "moderate"]),
      h("X", ["moderate", "moderate"]),
      h("X", ["inconclusive"]),
    ]);
    const documented = new Set(HEADLINE_LADDER.map((r) => r.template.replace("{NAME}", "X")));
    for (const headline of produced) {
      expect(documented).toContain(headline);
    }
  });
});
