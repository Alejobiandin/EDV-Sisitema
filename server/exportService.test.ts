import { describe, expect, it } from "vitest";
import { generateExcelReport, generatePdfReport } from "./exportService";

const taxPayload = {
  reportType: "tax" as const,
  clientName: "Cliente Alfa",
  period: "2026-07",
  data: {
    grossSales: 4_000_000,
    vatRate: 0.21,
    vatDebits: 840_000,
    vatCredits: 168_000,
    netVatDue: 672_000,
    parameterSource: "ADN Organizacional",
  },
};

const payrollPayload = {
  reportType: "payroll" as const,
  clientName: "Cliente Beta",
  period: "2026-07",
  data: {
    baseSalary: 1_000_000,
    overtimePay: 0,
    grossSalary: 1_000_000,
    netSalary: 840_000,
    employeeDeductions: { retirement: 110_000, socialSecurity: 30_000, union: 20_000, total: 160_000 },
    employerContributions: { total: 205_000 },
  },
};

describe("exportService", () => {
  it("genera un PDF de determinación de IVA con firma PDF válida", async () => {
    const buffer = await generatePdfReport(taxPayload);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("genera un XLSX de salarios como archivo ZIP OpenXML", async () => {
    const buffer = await generateExcelReport(payrollPayload);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 2).toString("hex")).toBe("504b");
  });
});
