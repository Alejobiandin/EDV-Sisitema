import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ExportReportPayload = {
  reportType: "tax" | "payroll";
  clientName: string;
  period: string;
  data: Record<string, unknown>;
  generatedBy?: string;
  companyTaxId?: string;
  companyName?: string;
  logoText?: string;
};

export async function generateExcelReport(payload: ExportReportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = payload.companyName ?? "EDV - Sistema Organizacional Cognitivo";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(payload.reportType === "tax" ? "Determinación IVA EDV" : "Liquidación Haberes EDV");

  sheet.columns = [
    { header: "Concepto / Parámetro Institucional", key: "concept", width: 40 },
    { header: "Valor / Importe", key: "value", width: 26 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };

  sheet.addRow({ concept: "Sistema Organizacional", value: "EDV · Plataforma Cognitiva Multiagente" });
  sheet.addRow({ concept: "Empresa / Contribuyente", value: payload.companyName ?? "Estudio Contable EDV S.A." });
  sheet.addRow({ concept: "CUIT / Datos Fiscales", value: payload.companyTaxId ?? "CUIT: 30-71458921-4" });
  sheet.addRow({ concept: "Reporte Institucional", value: payload.reportType === "tax" ? "Determinación Impositiva (IVA)" : "Liquidación de Sueldos y Cargas" });
  sheet.addRow({ concept: "Cliente / Entidad", value: payload.clientName });
  sheet.addRow({ concept: "Período Fiscal", value: payload.period });
  sheet.addRow({ concept: "Fecha de Emisión", value: new Date().toLocaleString() });
  sheet.addRow({ concept: "Generado por", value: payload.generatedBy ?? "Célula Cognitiva Autorizada EDV" });
  sheet.addRow({ concept: "", value: "" });

  const data = payload.data;
  if (payload.reportType === "tax") {
    sheet.addRow({ concept: "Ventas Gravadas", value: data.grossSales ?? 0 });
    sheet.addRow({ concept: "Alícuota IVA Aplicada", value: `${((Number(data.vatRate ?? 0.21)) * 100).toFixed(1)}%` });
    sheet.addRow({ concept: "Débito Fiscal IVA", value: data.vatDebits ?? 0 });
    sheet.addRow({ concept: "Crédito Fiscal IVA", value: data.vatCredits ?? 0 });
    sheet.addRow({ concept: "Saldo Técnico a Pagar", value: data.netVatDue ?? 0 });
    sheet.addRow({ concept: "Fuente Normativa / ADN EDV", value: data.parameterSource ?? "ADN Organizacional" });
  } else {
    sheet.addRow({ concept: "Sueldo Básico", value: data.baseSalary ?? 0 });
    sheet.addRow({ concept: "Pago Horas Extra", value: data.overtimePay ?? 0 });
    sheet.addRow({ concept: "Haberes Brutos Totales", value: data.grossSalary ?? 0 });
    const deductions = data.employeeDeductions as { retirement?: number; socialSecurity?: number; union?: number; total?: number } | undefined;
    sheet.addRow({ concept: "Aportes Jubilatorios (11%)", value: deductions?.retirement ?? 0 });
    sheet.addRow({ concept: "Aporte Obra Social (3%)", value: deductions?.socialSecurity ?? 0 });
    sheet.addRow({ concept: "Aporte Sindical / Convencional", value: deductions?.union ?? 0 });
    sheet.addRow({ concept: "Total Deducciones Ley", value: deductions?.total ?? 0 });
    sheet.addRow({ concept: "Neto a Percibir", value: data.netSalary ?? 0 });
    const employer = data.employerContributions as { socialSecurity?: number; familyAllowances?: number; total?: number } | undefined;
    sheet.addRow({ concept: "Contribuciones Patronales F.931", value: employer?.total ?? 0 });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generatePdfReport(payload: ExportReportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    // Cabecera institucional EDV con logotipo tipográfico y datos fiscales
    doc.rect(50, 45, 495, 65).fill("#1E3A8A");
    doc.fontSize(22).fillColor("#FFFFFF").text(payload.logoText ?? "EDV", 65, 57, { continued: true });
    doc.fontSize(10).fillColor("#93C5FD").text("  |  SISTEMA COGNITIVO MULTIAGENTE", { baseline: "bottom" });
    doc.fontSize(9.5).fillColor("#E2E8F0").text(`${payload.companyName ?? "Estudio Contable EDV S.A."}  ·  ${payload.companyTaxId ?? "CUIT: 30-71458921-4"}`, 65, 82);
    doc.moveDown(3);

    doc.fontSize(14).fillColor("#111827").text(payload.reportType === "tax" ? "REPORTE DE DETERMINACIÓN IMPOSITIVA (IVA)" : "REPORTE DE LIQUIDACIÓN DE HABERES", { continued: false });
    doc.fontSize(10).fillColor("#374151").text(`Cliente / Entidad: ${payload.clientName}`);
    doc.text(`Período Fiscal: ${payload.period}`);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`);
    doc.text(`Célula Emisora EDV: ${payload.generatedBy ?? "Área Especializada Cognitiva"}`);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#D1D5DB").stroke();
    doc.moveDown(1);

    const data = payload.data;
    doc.fontSize(11).fillColor("#1F2937");

    if (payload.reportType === "tax") {
      doc.text(`Ventas Gravadas: $${Number(data.grossSales ?? 0).toLocaleString()}`);
      doc.text(`Alícuota IVA: ${(Number(data.vatRate ?? 0.21) * 100).toFixed(1)}%`);
      doc.text(`Débito Fiscal: $${Number(data.vatDebits ?? 0).toLocaleString()}`);
      doc.text(`Crédito Fiscal: $${Number(data.vatCredits ?? 0).toLocaleString()}`);
      doc.fontSize(12).fillColor("#1E3A8A").text(`Saldo Técnico Neto a Pagar: $${Number(data.netVatDue ?? 0).toLocaleString()}`, { continued: false });
    } else {
      doc.text(`Sueldo Básico: $${Number(data.baseSalary ?? 0).toLocaleString()}`);
      doc.text(`Horas Extra: $${Number(data.overtimePay ?? 0).toLocaleString()}`);
      doc.text(`Sueldo Bruto Total: $${Number(data.grossSalary ?? 0).toLocaleString()}`);
      const deductions = data.employeeDeductions as { retirement?: number; socialSecurity?: number; union?: number; total?: number } | undefined;
      doc.text(`Total Deducciones de Ley: $${Number(deductions?.total ?? 0).toLocaleString()}`);
      doc.fontSize(12).fillColor("#1E3A8A").text(`Sueldo Neto a Cobrar: $${Number(data.netSalary ?? 0).toLocaleString()}`, { continued: false });
      const employer = data.employerContributions as { total?: number } | undefined;
      doc.fontSize(10).fillColor("#374151").text(`Contribuciones Patronales (F.931): $${Number(employer?.total ?? 0).toLocaleString()}`);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#6B7280").text("Este documento fue generado y certificado por EDV, plataforma organizacional cognitiva. Los cálculos se basan en el motor determinístico Python y las reglas parametrizadas en el ADN Organizacional, sujetos a revisión profesional responsable.", { align: "justify" });

    doc.end();
  });
}
