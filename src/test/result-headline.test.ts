import { describe, expect, it } from "vitest";
import {
  RUNG_LABEL_VARIANTS,
  RUNG_SCALE,
  STRONG_SIGNAL_FLOOR,
  rungFor,
  type HeadlineRung,
} from "@/lib/result-headline";

const rung = (levels: string[]) => rungFor({ levels });

describe("rungFor", () => {
  it("reaches the clean rung only when nothing is flagged", () => {
    expect(rung(["low", "low", "none", "low"])).toBe("clean");
    expect(rung(["none", "none"])).toBe("clean");
  });

  it("gives a good outcome whenever two signals are reading well", () => {
    // The brief. Reached regardless of how high the remaining signals went.
    expect(rung(["low", "low", "consider"])).toBe("good");
    expect(rung(["low", "low", "moderate", "moderate", "consider"])).toBe("good");
    expect(rung(["none", "low", "elevated", "elevated"])).toBe("good");
  });

  it("degrades gently rather than turning negative", () => {
    expect(rung(["low", "moderate", "moderate"])).toBe("steady");
    expect(rung(["moderate", "elevated", "consider"])).toBe("focus");
  });

  it("reports unreadable when nothing can be read", () => {
    expect(rung(["inconclusive", "inconclusive"])).toBe("unreadable");
  });

  it("ignores inconclusive signals when grading the readable ones", () => {
    expect(rung(["low", "none", "inconclusive"])).toBe("clean");
  });

  it("handles a single signal", () => {
    expect(rung(["low"])).toBe("clean");
    expect(rung(["moderate"])).toBe("focus");
  });

  it("honours the strong-signal floor", () => {
    const justUnder = Array(STRONG_SIGNAL_FLOOR - 1)
      .fill("low")
      .concat(["moderate", "moderate"]);
    const atFloor = Array(STRONG_SIGNAL_FLOOR).fill("low").concat(["moderate", "moderate"]);
    expect(rung(justUnder)).not.toBe("good");
    expect(rung(atFloor)).toBe("good");
  });

  it("treats an empty signal list as unreadable, not as clean", () => {
    // No signals is not evidence that nothing was found.
    expect(rung([])).toBe("unreadable");
  });
});

describe("RUNG_SCALE", () => {
  const GRADEABLE: HeadlineRung[] = ["clean", "good", "steady", "focus"];

  it("covers every gradeable rung, strongest first", () => {
    expect(RUNG_SCALE.map((r) => r.key)).toEqual(GRADEABLE);
  });

  it("leaves the unreadable state off the scale", () => {
    // It describes the recording, not the result, so it is not a rung.
    expect(RUNG_SCALE.map((r) => r.key)).not.toContain("unreadable");
  });

  it("gives every rung a colour for both grounds", () => {
    for (const r of RUNG_SCALE) {
      expect(r.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(r.colorLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("shares one green across the two good rungs", () => {
    // Left to right carries the order, so colour is free to carry good versus
    // caution. A gradient between clean and good would imply a gap the grading
    // never makes.
    const clean = RUNG_SCALE.find((r) => r.key === "clean")!;
    const good = RUNG_SCALE.find((r) => r.key === "good")!;
    expect(clean.colorLight).toBe(good.colorLight);
  });

  it("labels the four rungs OPTIMAL / STRONG / LOW / EXTREME", () => {
    expect(RUNG_SCALE.map((r) => r.label)).toEqual(["OPTIMAL", "STRONG", "LOW", "EXTREME"]);
  });

  it("uses no risk or diagnostic wording in any label", () => {
    const banned = ["RISK", "ELEVATED", "POOR", "ABNORMAL", "DEFICIENT", "IMPAIRED", "DISEASE"];
    for (const r of RUNG_SCALE) {
      for (const word of banned) {
        expect(r.label).not.toContain(word);
      }
    }
  });
});

describe("RUNG_LABEL_VARIANTS", () => {
  const RUNGS: HeadlineRung[] = ["clean", "good", "steady", "focus", "unreadable"];

  it("offers alternates for every rung", () => {
    for (const r of RUNGS) {
      expect(RUNG_LABEL_VARIANTS[r].length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps each label in use inside its own rung's alternates", () => {
    for (const entry of RUNG_SCALE) {
      expect(RUNG_LABEL_VARIANTS[entry.key]).toContain(entry.label);
    }
  });

  it("claims optimal or peak condition only on the clean rung", () => {
    for (const r of RUNGS) {
      if (r === "clean") continue;
      for (const variant of RUNG_LABEL_VARIANTS[r]) {
        expect(variant).not.toContain("OPTIMAL");
        expect(variant).not.toContain("PEAK");
      }
    }
  });

  it("uses no risk or diagnostic wording in any alternate", () => {
    const banned = ["RISK", "ELEVATED", "POOR", "ABNORMAL", "DEFICIENT", "IMPAIRED", "DISEASE"];
    for (const r of RUNGS) {
      for (const variant of RUNG_LABEL_VARIANTS[r]) {
        for (const word of banned) {
          expect(variant).not.toContain(word);
        }
      }
    }
  });

  it("has no duplicate wording across rungs", () => {
    const all = RUNGS.flatMap((r) => RUNG_LABEL_VARIANTS[r]);
    expect(new Set(all).size).toBe(all.length);
  });
});
