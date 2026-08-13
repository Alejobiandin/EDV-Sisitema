import { describe, expect, it } from "vitest";
import { calculateDeterministicAccounting } from "./agentEngine";

describe("calculateDeterministicAccounting", () => {
  it("usa la alícuota fiscal configurada en el ADN y eleva saldos sensibles", () => {
    const result = calculateDeterministicAccounting(
      {
        taskType: "tax_computation",
        payload: { clientName: "Cliente de prueba", grossSales: 4_000_000, vatPurchases: 800_000 },
      },
      [{ name: "IVA - alícuota general", content: JSON.stringify({ rate: 0.105 }) }],
    );

    expect(result.result.vatRate).toBe(0.105);
    expect(result.result.netVatDue).toBe(336_000);
    expect(result.requiresApproval).toBe(false);
  });

  it("activa HITL cuando la liquidación supera el umbral configurado por el motor", () => {
    const result = calculateDeterministicAccounting({
      taskType: "payroll_liquidation",
      payload: { baseSalary: 1_600_000, overtimeHours: 0 },
    });

    expect(result.result.grossSalary).toBe(1_600_000);
    expect(result.result.netSalary).toBe(1_344_000);
    expect(result.requiresApproval).toBe(true);
  });

  it("calcula cargas patronales y no bloquea un caso de bajo riesgo", () => {
    const result = calculateDeterministicAccounting({
      taskType: "social_charges",
      payload: { baseSalary: 500_000, overtimeHours: 2 },
    });

    const employerContributions = result.result.employerContributions as { total: number };
    expect(employerContributions.total).toBeCloseTo((500_000 + (2 * (500_000 / 160) * 1.5)) * 0.205, 6);
    expect(result.requiresApproval).toBe(false);
  });

  it("mantiene el cálculo y solicita revisión si la regla del ADN es inválida", () => {
    const result = calculateDeterministicAccounting(
      { taskType: "tax_computation", payload: { grossSales: 1_000_000, vatPurchases: 0 } },
      [{ name: "IVA - alícuota general", content: "no-json" }],
    );

    expect(result.result.vatRate).toBe(0.21);
    expect(result.result.netVatDue).toBe(210_000);
    expect(result.requiresApproval).toBe(false);
  });
});
