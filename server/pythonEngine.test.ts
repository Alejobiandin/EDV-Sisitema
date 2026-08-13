import { describe, expect, it } from "vitest";
import { runPythonCalculation } from "./pythonBridge";

describe("EDV Python Engine Bridge", () => {
  it("calcula IVA y detecta umbral alto usando el motor Python", async () => {
    const res = await runPythonCalculation({
      taskType: "tax_computation",
      payload: { grossSales: 6_000_000, vatPurchases: 1_000_000 },
      rules: { "IVA - alícuota general": 0.21 },
    });

    expect(res.success).toBe(true);
    expect(res.result.netVatDue).toBe(1_050_000);
    expect(res.requiresApproval).toBe(true);
  });

  it("calcula liquidación salarial y aportes correctamente", async () => {
    const res = await runPythonCalculation({
      taskType: "payroll_liquidation",
      payload: { baseSalary: 500_000, overtimeHours: 0 },
      rules: {
        "Aportes jubilatorios": 0.11,
        "Aporte obra social": 0.03,
        "Aporte convencional": 0.02,
        "Contribuciones patronales seguridad social": 0.16,
        "Contribuciones asignaciones familiares": 0.045,
      },
    });

    if (!res.success) {
      console.error("Python bridge error:", res);
    }
    expect(res.success).toBe(true);
    expect(res.result.grossSalary).toBe(500_000);
    expect(res.result.netSalary).toBe(420_000);
    expect(res.requiresApproval).toBe(false);
  });
});
