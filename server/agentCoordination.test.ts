import { describe, expect, it } from "vitest";
import {
  buildAgentCoordinationPlan,
  selectNextStage,
  shouldEscalate,
} from "./agentCoordination";

describe("agent coordination policy", () => {
  it("encadena las etapas del órgano impositivo y fuerza HITL", () => {
    const plan = buildAgentCoordinationPlan("tax_computation");
    expect(plan.organ).toBe("Impositivo");
    expect(plan.stages).toHaveLength(4);
    expect(plan.requiresHumanApproval).toBe(true);
    expect(plan.autonomy).toBe("assistive");
    expect(plan.externalAction).toBe(true);
  });

  it("conserva el riesgo mínimo de revisión contable aunque el caller declare low", () => {
    const plan = buildAgentCoordinationPlan("accounting_review", "low");
    expect(plan.autonomy).toBe("assistive");
    expect(plan.requiresHumanApproval).toBe(true);
  });

  it("escala por ausencia de ADN o indisponibilidad cognitiva", () => {
    expect(
      shouldEscalate({
        risk: "low",
        missingDnaRules: true,
        externalAction: false,
        llmAvailable: true,
      })
    ).toBe(true);
    expect(
      shouldEscalate({
        risk: "low",
        missingDnaRules: false,
        externalAction: false,
        llmAvailable: false,
      })
    ).toBe(true);
  });

  it("elige la siguiente etapa lista y no salta etapas bloqueadas", () => {
    expect(
      selectNextStage([
        { sequence: 1, status: "completed" },
        { sequence: 2, status: "ready" },
      ])?.sequence
    ).toBe(2);
    expect(selectNextStage([{ sequence: 1, status: "blocked" }])).toBe(null);
  });
});
