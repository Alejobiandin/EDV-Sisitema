import { describe, expect, it, vi } from "vitest";
import { calculateDeterministicAccounting } from "./agentEngine";

describe("Integration & End-to-End simulation of agent calculations and HITL rules", () => {
  it("simula una determinación impositiva elevada que activa el circuito de aprobación humana", async () => {
    const calculation = await calculateDeterministicAccounting({
      taskType: "tax_computation",
      payload: { clientName: "Corporación Alfa S.A.", grossSales: 10_000_000, vatPurchases: 1_000_000 },
    });

    expect(calculation.requiresApproval).toBe(true);
    expect(calculation.result.netVatDue).toBe(1_890_000);
  });

  it("simula una liquidación salarial por debajo del umbral que se completa automáticamente", async () => {
    const calculation = await calculateDeterministicAccounting({
      taskType: "payroll_liquidation",
      payload: { baseSalary: 400_000, overtimeHours: 0 },
    });

    expect(calculation.requiresApproval).toBe(false);
    expect((calculation.result.netSalary as number)).toBeGreaterThan(0);
  });
});
