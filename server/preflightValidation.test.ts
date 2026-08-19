import { describe, expect, it } from "vitest";
import { runPreflight, validateAccountingBalance, validateBankCsv, validateCertificatePem, validateCuit } from "./lib/preflightValidation";

describe("EDV preflight validation", () => {
  it("valida el dígito verificador de un CUIT válido", () => {
    expect(validateCuit("30-71234567-1").status).toBe("passed");
  });

  it("rechaza un CUIT con formato o dígito inválido", () => {
    expect(validateCuit("30-71234567-8").status).toBe("failed");
    expect(validateCuit("123").status).toBe("failed");
  });

  it("valida el envoltorio PEM del certificado", () => {
    expect(validateCertificatePem(`-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----`).status).toBe("passed");
    expect(validateCertificatePem("certificado inválido").status).toBe("failed");
  });

  it("valida encabezados mínimos del extracto CSV", () => {
    expect(validateBankCsv(`fecha,importe,referencia\n2026-08-01,100,ABC`).status).toBe("passed");
    expect(validateBankCsv(`fecha,importe\n2026-08-01,100`).status).toBe("failed");
  });

  it("detecta diferencias de debe y haber", () => {
    expect(validateAccountingBalance(100, 100).status).toBe("passed");
    expect(validateAccountingBalance(100, 99).status).toBe("failed");
  });

  it("clasifica el preflight sin afirmar que una credencial externa existe", () => {
    const result = runPreflight({ cuit: "30-71234567-1", certPem: "", csvData: `fecha,importe,referencia\n2026-08-01,100,ABC`, debit: 100, credit: 100 });
    expect(result.passed).toBe(3);
    expect(result.warnings).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.readyForHomologation).toBe(true);
  });
});
