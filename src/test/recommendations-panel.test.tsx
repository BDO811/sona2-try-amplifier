import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  RecommendationsPanel,
  RECOMMENDATIONS_ENABLED,
} from "@/components/report/RecommendationsPanel";

const SIGNS = [
  { label: "Fatigue", band: "LOW" },
  { label: "Stress", band: "MODERATE" },
];

describe("RecommendationsPanel", () => {
  it("renders nothing while the feature is off", () => {
    /*
      The endpoint answers 429 on every call because the model project is out of
      credit, so the button could only ever produce an error. This asserts the
      gate actually suppresses it rather than the flag existing unused.
    */
    const { container } = render(
      <RecommendationsPanel signs={SIGNS} assessment="wellness" showContent />
    );
    if (!RECOMMENDATIONS_ENABLED) {
      expect(container).toBeEmptyDOMElement();
    } else {
      expect(container.textContent).toContain("recommendations");
    }
  });

  it("is off, so nothing ships to production that cannot succeed", () => {
    expect(RECOMMENDATIONS_ENABLED).toBe(false);
  });

  it("renders nothing when there is nothing flagged either", () => {
    const { container } = render(
      <RecommendationsPanel signs={[]} assessment="wellness" showContent />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
