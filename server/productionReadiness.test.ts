import { describe, expect, it } from "vitest";
import { calculateCctScenario, productionReadinessRouter } from "./routers/productionReadiness";

describe("EDV Production Readiness", () => {
  it("expone checklist, monitor de salud y simulador CCT", () => {
    expect(productionReadinessRouter).toBeDefined();
    expect(productionReadinessRouter._def.procedures.getChecklist).toBeDefined();
    expect(productionReadinessRouter._def.procedures.getExternalHealth).toBeDefined();
    expect(productionReadinessRouter._def.procedures.simulateCct).toBeDefined();
  });

  it("calcula en forma determinística el impacto de un concepto CCT", () => {
    const result = calculateCctScenario({
      baseSalary: 1_600_000,
      employerRate: 0.24,
      employeeRate: 0.17,
      concepts: [{ name: "Adicional", percent: 0.1, fixed: 0, kind: "earning" }],
    });

    expect(result.gross).toBe(1_760_000);
    expect(result.employerContributions).toBe(422_400);
    expect(result.employeeContributions).toBe(299_200);
    expect(result.net).toBe(1_460_800);
    expect(result.totalEmployerCost).toBe(2_182_400);
    expect(result.control.deterministic).toBe(true);
    expect(result.control.requiresProfessionalReview).toBe(true);
  });

  it("impide que una deducción lleve el neto por debajo de cero", () => {
    const result = calculateCctScenario({
      baseSalary: 100_000,
      employerRate: 0.24,
      employeeRate: 0.17,
      concepts: [{ name: "Deducción extraordinaria", percent: 0, fixed: 1_000_000, kind: "deduction" }],
    });

    expect(result.net).toBe(0);
    expect(result.gross).toBe(100_000);
  });
});
