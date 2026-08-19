export type PreflightResult = { id: string; label: string; status: "passed" | "warning" | "failed"; detail: string };

export function normalizeCuit(value: string) {
  return value.replace(/\D/g, "");
}

export function validateCuit(value: string): PreflightResult {
  const digits = normalizeCuit(value);
  if (!/^\d{11}$/.test(digits)) return { id: "cuit", label: "Estructura de CUIT", status: "failed", detail: "El CUIT debe contener 11 dígitos." };

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const remainder = 11 - (sum % 11);
  const control = remainder === 11 ? 0 : remainder === 10 ? 9 : remainder;
  const valid = control === Number(digits[10]);
  return { id: "cuit", label: "Control matemático de CUIT", status: valid ? "passed" : "failed", detail: valid ? "El dígito verificador coincide." : "El dígito verificador no coincide; revisar la identificación fiscal." };
}

export function validateCertificatePem(certPem: string): PreflightResult {
  const value = certPem.trim();
  if (!value) return { id: "certificate", label: "Certificado X.509", status: "warning", detail: "No se cargó certificado: la conexión productiva permanece bloqueada." };
  const isCertificate = value.includes("-----BEGIN CERTIFICATE-----") && value.includes("-----END CERTIFICATE-----");
  return { id: "certificate", label: "Certificado X.509", status: isCertificate ? "passed" : "failed", detail: isCertificate ? "El envoltorio PEM del certificado es válido a nivel estructural." : "El contenido no tiene el formato PEM de un certificado X.509." };
}

export function validateBankCsv(csvData: string): PreflightResult {
  const lines = csvData.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { id: "bank_csv", label: "Extracto bancario CSV", status: "warning", detail: "No hay filas suficientes para validar el extracto." };
  const headers = lines[0].toLowerCase().split(/[;,]/).map(value => value.trim());
  const hasDate = headers.some(value => value.includes("fecha") || value.includes("date"));
  const hasAmount = headers.some(value => value.includes("importe") || value.includes("monto") || value.includes("amount"));
  const hasReference = headers.some(value => value.includes("refer") || value.includes("concept") || value.includes("descripcion"));
  const valid = hasDate && hasAmount && hasReference;
  return { id: "bank_csv", label: "Estructura de extracto bancario", status: valid ? "passed" : "failed", detail: valid ? `${lines.length - 1} movimientos listos para normalizar.` : "Se requieren columnas de fecha, importe y referencia o descripción." };
}

export function validateAccountingBalance(debit: number, credit: number): PreflightResult {
  if (!Number.isFinite(debit) || !Number.isFinite(credit)) return { id: "balance", label: "Equilibrio contable", status: "failed", detail: "Los totales contables deben ser números finitos." };
  const difference = Math.abs(debit - credit);
  const valid = difference < 0.01;
  return { id: "balance", label: "Equilibrio contable", status: valid ? "passed" : "failed", detail: valid ? "Debe y Haber están equilibrados." : `Diferencia detectada: ${difference.toFixed(2)}.` };
}

export function runPreflight(input: { cuit: string; certPem: string; csvData: string; debit: number; credit: number }) {
  const checks = [validateCuit(input.cuit), validateCertificatePem(input.certPem), validateBankCsv(input.csvData), validateAccountingBalance(input.debit, input.credit)];
  return { checks, passed: checks.filter(check => check.status === "passed").length, failed: checks.filter(check => check.status === "failed").length, warnings: checks.filter(check => check.status === "warning").length, readyForHomologation: checks.every(check => check.status !== "failed") };
}
