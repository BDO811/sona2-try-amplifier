import { describe, it, expect } from "vitest";
import { getModelForPathway, DEFAULT_MODEL } from "@/lib/pathway-model-map";
import { HEALTH_FOCUS_TO_PATHWAY } from "@/context/AssessmentContext";

/**
 * The full chain the user's pick travels:
 *   focus card id → AssessmentPathway → Amplifier v2 model name
 * A break anywhere here silently sends every user to the wellness model.
 */
describe("health focus → pathway → v2 model", () => {
  it("routes each focus card to its own model", () => {
    const chain = (focus: string) => getModelForPathway(HEALTH_FOCUS_TO_PATHWAY[focus]);

    expect(HEALTH_FOCUS_TO_PATHWAY.cognitive).toBe("BRAIN_AGE");
    expect(chain("cognitive")).toBe("clarity");

    expect(HEALTH_FOCUS_TO_PATHWAY.longevity).toBe("LONGEVITY");
    expect(chain("longevity")).toBe("tide");

    expect(HEALTH_FOCUS_TO_PATHWAY.mood).toBe("MENTAL_HEALTH");
    expect(chain("mood")).toBe("haven");

    expect(HEALTH_FOCUS_TO_PATHWAY.reproductive).toBe("FERTILITY");
    expect(chain("reproductive")).toBe("aria");
  });

  it("gives each focus a distinct model — no two picks collapse to the same one", () => {
    const models = ["cognitive", "longevity", "mood", "reproductive"].map((f) =>
      getModelForPathway(HEALTH_FOCUS_TO_PATHWAY[f])
    );
    expect(new Set(models).size).toBe(4);
  });

  it("falls back to pulse for wellness and for an unset pathway", () => {
    expect(getModelForPathway("WELLNESS")).toBe("pulse");
    expect(getModelForPathway(null)).toBe(DEFAULT_MODEL);
    expect(DEFAULT_MODEL).toBe("pulse");
  });
});
